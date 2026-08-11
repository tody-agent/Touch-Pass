#!/usr/bin/env python3
import argparse
import ctypes
import hashlib
import hmac
import json
import os
import queue
import subprocess
import sys
import threading
import time
from pathlib import Path

import serial
import serial.tools.list_ports

HELPER_DIR = Path(__file__).resolve().parent
if str(HELPER_DIR) not in sys.path:
    sys.path.insert(0, str(HELPER_DIR))

from tinytouch_portal import (
    AdminJobDevice,
    KeychainSecretStore,
    PortalAPI,
    ProfileStore,
    TriggerGate,
    create_http_server,
    encode_action,
)


SERVICE = "tinyTouch"
ACCOUNT = "tinyTouch"
PAIRING_SERVICE = "tinyTouch-pairing"
PREFERRED_SERIAL = "B8F862FB478C"
STATE_DIR = Path.home() / "Library" / "Application Support" / "tinyTouch"
MAX_SEEN_NONCES = 256

_COMMON_CRYPTO = ctypes.CDLL("/usr/lib/system/libcommonCrypto.dylib")
_COMMON_CRYPTO.CCCryptorCreateWithMode.argtypes = [
    ctypes.c_uint32, ctypes.c_uint32, ctypes.c_uint32, ctypes.c_uint32,
    ctypes.c_void_p, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_void_p,
    ctypes.c_size_t, ctypes.c_int, ctypes.c_uint32, ctypes.POINTER(ctypes.c_void_p),
]
_COMMON_CRYPTO.CCCryptorCreateWithMode.restype = ctypes.c_int32
_COMMON_CRYPTO.CCCryptorUpdate.argtypes = [
    ctypes.c_void_p, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_void_p,
    ctypes.c_size_t, ctypes.POINTER(ctypes.c_size_t),
]
_COMMON_CRYPTO.CCCryptorUpdate.restype = ctypes.c_int32
_COMMON_CRYPTO.CCCryptorRelease.argtypes = [ctypes.c_void_p]
_COMMON_CRYPTO.CCCryptorRelease.restype = ctypes.c_int32

_CC_ENCRYPT = 0
_CC_MODE_CTR = 4
_CC_ALGORITHM_AES = 0
_CC_NO_PADDING = 0
_CC_MODE_OPTION_CTR_BE = 0x0002


def normalize_serial(value: str) -> str:
    return "".join(char for char in value.upper() if char.isalnum() or char in "_.-")


def port_identity(port_name: str) -> str:
    for port in serial.tools.list_ports.comports():
        if port.device == port_name and port.serial_number:
            identity = normalize_serial(port.serial_number)
            if identity:
                return identity
    return normalize_serial(Path(port_name).name) or PREFERRED_SERIAL


def keychain_set(password: str, device_id: str = ACCOUNT) -> None:
    subprocess.run(
        [
            "security",
            "add-generic-password",
            "-U",
            "-a",
            device_id,
            "-s",
            SERVICE,
            "-w",
            password,
        ],
        check=True,
    )


def keychain_get(device_id: str = ACCOUNT) -> bytes:
    result = subprocess.run(
        [
            "security",
            "find-generic-password",
            "-a",
            device_id,
            "-s",
            SERVICE,
            "-w",
        ],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return result.stdout.rstrip("\n").encode("utf-8")


def parse_pairing_key(key_hex: str) -> bytes:
    try:
        key = bytes.fromhex(key_hex.strip())
    except ValueError as exc:
        raise SystemExit("Pairing key must be 64 hex characters.") from exc
    if len(key) != 32:
        raise SystemExit("Pairing key must be exactly 32 bytes / 64 hex characters.")
    return key


def pairing_keychain_set(key_hex: str, device_id: str = PREFERRED_SERIAL) -> None:
    key = parse_pairing_key(key_hex)
    subprocess.run(
        [
            "security",
            "add-generic-password",
            "-U",
            "-a",
            device_id,
            "-s",
            PAIRING_SERVICE,
            "-w",
            key.hex(),
        ],
        check=True,
    )


def pairing_keychain_get(device_id: str = PREFERRED_SERIAL) -> bytes:
    result = subprocess.run(
        [
            "security",
            "find-generic-password",
            "-a",
            device_id,
            "-s",
            PAIRING_SERVICE,
            "-w",
        ],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return parse_pairing_key(result.stdout.rstrip("\n"))


def mac_hex(pairing_key: bytes, message: str) -> str:
    return hmac.new(pairing_key, message.encode("ascii"), hashlib.sha256).hexdigest()


def session_key(pairing_key: bytes, nonce_hex: str) -> bytes:
    return hmac.new(pairing_key, f"SESSION|{nonce_hex}".encode("ascii"), hashlib.sha256).digest()


def aes_ctr_crypt(key: bytes, iv: bytes, data: bytes) -> bytes:
    if len(key) not in {16, 24, 32} or len(iv) != 16:
        raise ValueError("AES-CTR requires a 16/24/32-byte key and a 16-byte IV")
    cryptor = ctypes.c_void_p()
    key_buffer = ctypes.create_string_buffer(key, len(key))
    iv_buffer = ctypes.create_string_buffer(iv, len(iv))
    status = _COMMON_CRYPTO.CCCryptorCreateWithMode(
        _CC_ENCRYPT,
        _CC_MODE_CTR,
        _CC_ALGORITHM_AES,
        _CC_NO_PADDING,
        iv_buffer,
        key_buffer,
        len(key),
        None,
        0,
        0,
        _CC_MODE_OPTION_CTR_BE,
        ctypes.byref(cryptor),
    )
    if status != 0:
        raise RuntimeError(f"CommonCrypto could not create AES-CTR context ({status})")
    try:
        if not data:
            return b""
        input_buffer = ctypes.create_string_buffer(data, len(data))
        output_buffer = ctypes.create_string_buffer(len(data))
        moved = ctypes.c_size_t()
        status = _COMMON_CRYPTO.CCCryptorUpdate(
            cryptor,
            input_buffer,
            len(data),
            output_buffer,
            len(data),
            ctypes.byref(moved),
        )
        if status != 0 or moved.value != len(data):
            raise RuntimeError(f"CommonCrypto AES-CTR failed ({status})")
        return output_buffer.raw[:moved.value]
    finally:
        _COMMON_CRYPTO.CCCryptorRelease(cryptor)


def encrypt_password(pairing_key: bytes, nonce_hex: str, password: bytes) -> tuple[str, str]:
    iv = os.urandom(16)
    ciphertext = aes_ctr_crypt(session_key(pairing_key, nonce_hex), iv, password)
    return iv.hex(), ciphertext.hex()


def state_path(device_id: str | None = None) -> Path:
    suffix = normalize_serial(device_id or "legacy")
    return STATE_DIR / f"state-{suffix}.json"


def load_state(device_id: str | None = None) -> dict:
    path = state_path(device_id)
    try:
        with path.open("r", encoding="utf-8") as f:
            state = json.load(f)
    except FileNotFoundError:
        return {"seen_nonces": []}
    except (OSError, json.JSONDecodeError):
        return {"seen_nonces": []}
    seen = state.get("seen_nonces", [])
    if not isinstance(seen, list):
        seen = []
    return {"seen_nonces": [str(item) for item in seen[-MAX_SEEN_NONCES:]]}


def save_state(state: dict, device_id: str | None = None) -> None:
    path = state_path(device_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(state, f, separators=(",", ":"))
    tmp.replace(path)


def valid_hex(value: str, byte_len: int) -> bool:
    if len(value) != byte_len * 2:
        return False
    try:
        bytes.fromhex(value)
    except ValueError:
        return False
    return True


def handle_event(
    line: str,
    password: bytes,
    pairing_key: bytes,
    state: dict | None = None,
    persist_state: bool = True,
    device_id: str | None = None,
) -> str | None:
    parts = line.strip().split()
    if len(parts) != 6 or parts[0] != "EV":
        return None
    _, nonce, counter, slot, score, got_mac = parts
    if not valid_hex(nonce, 16):
        print("bad event nonce", file=sys.stderr)
        return None
    expected = mac_hex(pairing_key, f"EV|{nonce}|{counter}|{slot}|{score}")
    if not hmac.compare_digest(expected, got_mac.lower()):
        print("bad event mac", file=sys.stderr)
        return None
    if state is not None:
        seen_nonces = state.setdefault("seen_nonces", [])
        if nonce in seen_nonces:
            print("replayed event nonce", file=sys.stderr)
            return None
    iv_hex, ct_hex = encrypt_password(pairing_key, nonce, password)
    reply_mac = mac_hex(pairing_key, f"PW|{nonce}|{iv_hex}|{ct_hex}")
    if state is not None:
        seen_nonces.append(nonce)
        state["seen_nonces"] = seen_nonces[-MAX_SEEN_NONCES:]
        if persist_state:
            save_state(state, device_id)
    return f"PW {nonce} {iv_hex} {ct_hex} {reply_mac}\n"


def handle_action_event(
    line: str,
    pairing_key: bytes,
    state: dict,
    profile_resolver,
    secret_resolver,
    gate: TriggerGate,
    *,
    now: float | None = None,
    persist_state: bool = True,
    device_id: str | None = None,
) -> str | None:
    """Authenticate a sensor event and return an ARM or encrypted ACT response."""
    parts = line.strip().split()
    if len(parts) != 6 or parts[0] != "EV":
        return None
    _, nonce, counter, slot_text, score, got_mac = parts
    if not valid_hex(nonce, 16):
        return None
    expected = mac_hex(pairing_key, f"EV|{nonce}|{counter}|{slot_text}|{score}")
    if not hmac.compare_digest(expected, got_mac.lower()):
        return None
    seen_nonces = state.setdefault("seen_nonces", [])
    if nonce in seen_nonces:
        return None
    try:
        slot = int(slot_text)
    except ValueError:
        return None
    profile = profile_resolver(slot)
    if not profile:
        return None

    seen_nonces.append(nonce)
    state["seen_nonces"] = seen_nonces[-MAX_SEEN_NONCES:]
    if persist_state:
        save_state(state, device_id)

    decision = gate.touch(slot, profile.get("action", {}), time.monotonic() if now is None else now)
    if decision == "armed":
        expires_ms = int(gate.window_seconds * 1000)
        reply_mac = mac_hex(pairing_key, f"ARM|{nonce}|{slot}|{expires_ms}")
        return f"ARM {nonce} {slot} {expires_ms} {reply_mac}\n"

    payload = encode_action(profile.get("action", {}), secret_resolver)
    iv_hex, ciphertext_hex = encrypt_password(pairing_key, nonce, payload)
    reply_mac = mac_hex(pairing_key, f"ACT|{nonce}|{iv_hex}|{ciphertext_hex}")
    return f"ACT {nonce} {iv_hex} {ciphertext_hex} {reply_mac}\n"


def open_serial(port: str) -> serial.Serial:
    ser = serial.Serial()
    ser.port = port
    ser.baudrate = 115200
    ser.timeout = 0.2
    ser.write_timeout = 2
    try:
        ser.dtr = True
        ser.rts = False
    except (OSError, serial.SerialException):
        pass
    ser.open()
    try:
        ser.dtr = True
        ser.rts = False
    except (OSError, serial.SerialException):
        pass
    return ser


def serve_port(port: str, once: bool = False) -> None:
    device_id = port_identity(port)
    password = keychain_get(device_id)
    pairing_key = pairing_keychain_get(device_id)
    state = load_state(device_id)
    try:
        with open_serial(port) as ser:
            print(f"helper listening on {port} ({device_id})", flush=True)
            while True:
                raw = ser.readline()
                if not raw:
                    continue
                line = raw.decode("utf-8", "replace").strip()
                if line:
                    print(f"{device_id}: {line}", flush=True)
                reply = handle_event(line, password, pairing_key, state, device_id=device_id)
                if reply:
                    ser.write(reply.encode("ascii"))
                    ser.flush()
                    print(f"sent encrypted password to {device_id}", flush=True)
                    if once:
                        return
                time.sleep(0.01)
    finally:
        password = b"\x00" * len(password)
        pairing_key = b"\x00" * len(pairing_key)


def device_ports() -> list[str]:
    return sorted(port.device for port in serial.tools.list_ports.comports()
                  if port.device.startswith("/dev/cu.usbmodem"))


def select_device_port(explicit_port: str | None, available_ports: list[str] | None = None) -> str:
    if explicit_port:
        return explicit_port
    ports = device_ports() if available_ports is None else sorted(available_ports)
    if not ports:
        raise RuntimeError("No ESP32-S3 USB CDC device was found")
    if len(ports) > 1:
        raise RuntimeError("Multiple ESP32-S3 USB CDC devices found; use --port: " + ", ".join(ports))
    return ports[0]


def credentials_exist(device_id: str) -> bool:
    for service in (PAIRING_SERVICE, SERVICE):
        result = subprocess.run(
            ["security", "find-generic-password", "-a", device_id, "-s", service],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if result.returncode != 0:
            return False
    return True


def run_manager() -> None:
    workers: dict[str, threading.Thread] = {}
    while True:
        for port, worker in list(workers.items()):
            if not worker.is_alive():
                worker.join()
                del workers[port]
        for port in device_ports():
            if port in workers:
                continue
            device_id = port_identity(port)
            if not credentials_exist(device_id):
                continue
            worker = threading.Thread(target=managed_worker, args=(port,), daemon=True,
                                      name=f"tinyTouch-{device_id}")
            workers[port] = worker
            worker.start()
        time.sleep(1)


def managed_worker(port: str) -> None:
    try:
        serve_port(port)
    except (OSError, serial.SerialException, subprocess.CalledProcessError) as exc:
        print(f"worker for {port} stopped: {exc}", file=sys.stderr, flush=True)


def _configured_profile(profiles: ProfileStore, slot: int) -> dict | None:
    try:
        profile = profiles.get_profile(slot)
    except ValueError:
        return None
    return profile if profile.get("enrolled") else None


def portal_serial_worker(
    device: AdminJobDevice,
    profiles: ProfileStore,
    secret_store: KeychainSecretStore,
    explicit_port: str | None,
    credential_device_id: str,
) -> None:
    """Own the CDC connection, route admin progress, and answer fingerprint events."""
    while True:
        pairing_key = b""
        try:
            port = select_device_port(explicit_port)
            actual_device_id = port_identity(port)
            try:
                pairing_key = pairing_keychain_get(actual_device_id)
            except subprocess.CalledProcessError:
                pairing_key = pairing_keychain_get(credential_device_id)
            state = load_state(actual_device_id)
            gate = TriggerGate()
            with open_serial(port) as ser:
                device.set_connection(True, port, "checking")
                ser.write(b"STATUS\n")
                ser.flush()
                while True:
                    try:
                        command = device.next_command(timeout=0)
                    except queue.Empty:
                        command = None
                    if command:
                        ser.write((command + "\n").encode("ascii"))
                        ser.flush()
                    raw = ser.readline()
                    if not raw:
                        continue
                    line = raw.decode("utf-8", "replace").strip()
                    if not line:
                        continue
                    print(f"{actual_device_id}: {line}", flush=True)
                    if device.feed_line(line):
                        continue
                    if line.startswith("OK STATUS"):
                        device.set_connection(True, port, "ok" if "sensor=ok" in line else "error")
                        continue
                    if line.startswith("ERR STATUS"):
                        device.set_connection(True, port, "error")
                        continue
                    if line.startswith("EV "):
                        reply = handle_action_event(
                            line,
                            pairing_key,
                            state,
                            lambda slot: _configured_profile(profiles, slot),
                            secret_store.get,
                            gate,
                            device_id=actual_device_id,
                        )
                        if reply:
                            ser.write(reply.encode("ascii"))
                            ser.flush()
        except (RuntimeError, OSError, serial.SerialException, subprocess.CalledProcessError) as exc:
            device.set_connection(False, None, "unavailable")
            print(f"portal serial reconnect after error: {exc}", file=sys.stderr, flush=True)
            time.sleep(1)
        finally:
            pairing_key = b"\x00" * len(pairing_key)


def run_portal(
    explicit_port: str | None,
    credential_device_id: str,
    host: str,
    port: int,
) -> None:
    secret_store = KeychainSecretStore(credential_device_id)
    profiles = ProfileStore(STATE_DIR / f"profiles-{normalize_serial(credential_device_id)}.json", secret_store)
    device = AdminJobDevice()
    api = PortalAPI(profiles, device)
    assets = HELPER_DIR / "portal"
    server = create_http_server(api, assets, host=host, port=port)
    worker = threading.Thread(
        target=portal_serial_worker,
        args=(device, profiles, secret_store, explicit_port, credential_device_id),
        daemon=True,
        name="tinyTouch-portal-serial",
    )
    worker.start()
    print(f"tinyTouch portal: http://{host}:{server.server_port}", flush=True)
    try:
        server.serve_forever()
    finally:
        server.server_close()


def run(port: str | None, once: bool) -> None:
    if port:
        while True:
            try:
                serve_port(port, once)
                return
            except (OSError, serial.SerialException, subprocess.CalledProcessError) as exc:
                print(f"serial reconnect after error: {exc}", file=sys.stderr, flush=True)
                time.sleep(1)
    if once:
        raise SystemExit("--once requires --port when multiple-device mode is active")
    run_manager()


def self_test(device_id: str = PREFERRED_SERIAL) -> None:
    password = keychain_get(device_id)
    pairing_key = pairing_keychain_get(device_id)
    nonce = "00" * 16
    event_mac = mac_hex(pairing_key, f"EV|{nonce}|1|1|123")
    reply = handle_event(
        f"EV {nonce} 1 1 123 {event_mac}",
        password,
        pairing_key,
        {"seen_nonces": []},
        persist_state=False,
        device_id=device_id,
    )
    assert reply is not None
    parts = reply.split()
    assert parts[0] == "PW"
    assert hmac.compare_digest(parts[4], mac_hex(pairing_key, f"PW|{parts[1]}|{parts[2]}|{parts[3]}"))
    print("self-test ok")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port")
    parser.add_argument("--set-password")
    parser.add_argument("--set-pairing-key")
    parser.add_argument("--device-id", default=PREFERRED_SERIAL)
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--portal", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--portal-host", choices=("127.0.0.1", "localhost"), default="127.0.0.1")
    parser.add_argument("--portal-port", type=int, default=8787)
    return parser


def main() -> None:
    args = build_parser().parse_args()

    if args.set_password is not None:
        keychain_set(args.set_password, args.device_id)
        print("password stored in Keychain")
    if args.set_pairing_key is not None:
        pairing_keychain_set(args.set_pairing_key, args.device_id)
        print("pairing key stored in Keychain")
    if args.self_test:
        self_test(args.device_id)
        return
    if args.set_password is None and args.set_pairing_key is None:
        if args.portal:
            run_portal(args.port, args.device_id, args.portal_host, args.portal_port)
            return
        while True:
            try:
                run(args.port, args.once)
                return
            except KeyboardInterrupt:
                raise
            except BaseException as exc:
                print(f"top-level restart after error: {exc!r}", file=sys.stderr, flush=True)
                time.sleep(1)


if __name__ == "__main__":
    main()
