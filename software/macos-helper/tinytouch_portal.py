"""Core types shared by the tinyTouch macOS helper and local portal."""

from __future__ import annotations

from collections import deque
from collections.abc import Callable
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import mimetypes
from pathlib import Path
import queue
import re
import secrets
import subprocess
import threading
import time
from urllib.parse import urlsplit


ACTION_VERSION = 1
OP_TEXT = 1
OP_KEY = 2
OP_DELAY = 3

KEY_ENTER = 1
KEY_ESCAPE = 2
KEY_TAB = 3
KEY_SPACE = 4
KEY_UP = 5
KEY_DOWN = 6
KEY_LEFT = 7
KEY_RIGHT = 8

MAX_ACTION_BYTES = 256
MAX_ACTION_STEPS = 16
MAX_FINGERS = 10
CONFIG_VERSION = 1

KEY_NAMES = {
    "enter": KEY_ENTER,
    "escape": KEY_ESCAPE,
    "tab": KEY_TAB,
    "space": KEY_SPACE,
    "up": KEY_UP,
    "down": KEY_DOWN,
    "left": KEY_LEFT,
    "right": KEY_RIGHT,
}


class TriggerGate:
    """Require a second touch for actions that can approve or control UI."""

    def __init__(self, window_seconds: float = 3.0):
        self.window_seconds = window_seconds
        self._slot: int | None = None
        self._deadline = 0.0

    def touch(self, slot: int, profile: dict, now: float) -> str:
        requires_confirmation = profile.get("confirm")
        if requires_confirmation is None:
            requires_confirmation = profile.get("preset") != "password"
        if not requires_confirmation:
            self._slot = None
            self._deadline = 0.0
            return "execute"
        if self._slot == slot and now <= self._deadline:
            self._slot = None
            self._deadline = 0.0
            return "execute"
        self._slot = slot
        self._deadline = now + self.window_seconds
        return "armed"


def _default_profile(slot: int) -> dict:
    return {
        "slot": slot,
        "label": f"Ngón {slot}",
        "enrolled": False,
        "action": {"preset": "enter", "confirm": True},
    }


class ProfileStore:
    """Versioned profile metadata with secrets delegated to macOS Keychain."""

    def __init__(self, path: Path, secret_store):
        self.path = Path(path)
        self.secret_store = secret_store
        self._profiles = self._load()

    @staticmethod
    def _validate_slot(slot: int) -> None:
        if not 1 <= slot <= MAX_FINGERS:
            raise ValueError("slot must be between 1 and 10")

    def _load(self) -> list[dict]:
        try:
            document = json.loads(self.path.read_text(encoding="utf-8"))
        except (FileNotFoundError, OSError, json.JSONDecodeError):
            return [_default_profile(slot) for slot in range(1, MAX_FINGERS + 1)]
        by_slot = {
            int(item.get("slot", 0)): item
            for item in document.get("profiles", [])
            if isinstance(item, dict) and 1 <= int(item.get("slot", 0)) <= MAX_FINGERS
        }
        return [by_slot.get(slot, _default_profile(slot)) for slot in range(1, MAX_FINGERS + 1)]

    def _save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.path.with_suffix(".tmp")
        temporary.write_text(
            json.dumps({"version": CONFIG_VERSION, "profiles": self._profiles}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        temporary.replace(self.path)

    def _public(self, profile: dict) -> dict:
        public = json.loads(json.dumps(profile))
        action = public.get("action", {})
        reference = action.get("secret_ref")
        configured = False
        if reference:
            try:
                self.secret_store.get(reference)
                configured = True
            except (KeyError, OSError, RuntimeError):
                configured = False
        action["secret_configured"] = configured
        return public

    def list_profiles(self) -> list[dict]:
        return [self._public(profile) for profile in self._profiles]

    def get_profile(self, slot: int) -> dict:
        self._validate_slot(slot)
        return self._profiles[slot - 1]

    def update_profile(self, slot: int, changes: dict) -> dict:
        self._validate_slot(slot)
        current = self._profiles[slot - 1]
        label = str(changes.get("label", current["label"])).strip()
        if not label or len(label) > 64:
            raise ValueError("label must contain between 1 and 64 characters")
        action = changes.get("action", current.get("action", {}))
        if not isinstance(action, dict):
            raise ValueError("action must be an object")
        action = json.loads(json.dumps(action))
        preset = action.get("preset")
        if preset == "password":
            reference = f"slot-{slot}"
            if "secret" in changes:
                try:
                    secret = str(changes["secret"]).encode("ascii")
                except UnicodeEncodeError as exc:
                    raise ValueError("password actions require ASCII") from exc
                if not secret or len(secret) > 128:
                    raise ValueError("password must contain between 1 and 128 ASCII bytes")
                self.secret_store.set(reference, secret)
            action["secret_ref"] = reference
            try:
                encode_action(action, self.secret_store.get)
            except (KeyError, OSError, RuntimeError):
                encode_action(action, lambda _ref: b"")
        else:
            self.secret_store.delete(f"slot-{slot}")
            action.pop("secret_ref", None)
            encode_action(action, lambda _reference: b"")
        action.pop("secret_configured", None)
        self._profiles[slot - 1] = {
            "slot": slot,
            "label": label,
            "enrolled": bool(changes.get("enrolled", current.get("enrolled", False))),
            "action": action,
        }
        self._save()
        return self._public(self._profiles[slot - 1])

    def set_enrolled(self, slot: int, enrolled: bool) -> dict:
        self._validate_slot(slot)
        self._profiles[slot - 1]["enrolled"] = enrolled
        self._save()
        return self._public(self._profiles[slot - 1])

    def delete_profile(self, slot: int) -> dict:
        self._validate_slot(slot)
        self.secret_store.delete(f"slot-{slot}")
        self._profiles[slot - 1] = _default_profile(slot)
        self._save()
        return self._public(self._profiles[slot - 1])


import platform


class KeychainSecretStore:
    """Store each fingerprint action secret using keyring with platform fallback."""

    def __init__(self, device_id: str, runner=subprocess.run):
        safe_device = re.sub(r"[^A-Za-z0-9_.-]", "", device_id) or "default"
        self.service = f"tinyTouch-action-{safe_device}"
        self.runner = runner
        self._fallback_store = {}

    def set(self, reference: str, value: bytes) -> None:
        val_str = value.decode("ascii")
        if self.runner is not subprocess.run:
            self.runner(
                [
                    "security",
                    "add-generic-password",
                    "-U",
                    "-a",
                    reference,
                    "-s",
                    self.service,
                    "-w",
                    val_str,
                ],
                check=True,
            )
            return
        try:
            import keyring
            keyring.set_password(self.service, reference, val_str)
            return
        except Exception:
            pass
        if platform.system() == "Darwin":
            self.runner(
                [
                    "security",
                    "add-generic-password",
                    "-U",
                    "-a",
                    reference,
                    "-s",
                    self.service,
                    "-w",
                    val_str,
                ],
                check=True,
            )
        else:
            self._fallback_store[reference] = value

    def get(self, reference: str) -> bytes:
        if self.runner is not subprocess.run:
            result = self.runner(
                [
                    "security",
                    "find-generic-password",
                    "-a",
                    reference,
                    "-s",
                    self.service,
                    "-w",
                ],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            return result.stdout.rstrip("\n").encode("ascii")
        try:
            import keyring
            secret = keyring.get_password(self.service, reference)
            if secret is not None:
                return secret.encode("ascii")
        except Exception:
            pass
        if platform.system() == "Darwin":
            result = self.runner(
                [
                    "security",
                    "find-generic-password",
                    "-a",
                    reference,
                    "-s",
                    self.service,
                    "-w",
                ],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            return result.stdout.rstrip("\n").encode("ascii")
        if reference in self._fallback_store:
            return self._fallback_store[reference]
        raise KeyError(f"Secret not found for reference: {reference}")

    def delete(self, reference: str) -> None:
        self._fallback_store.pop(reference, None)
        if self.runner is not subprocess.run:
            self.runner(
                ["security", "delete-generic-password", "-a", reference, "-s", self.service],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return
        try:
            import keyring
            keyring.delete_password(self.service, reference)
            return
        except Exception:
            pass
        if platform.system() == "Darwin":
            self.runner(
                ["security", "delete-generic-password", "-a", reference, "-s", self.service],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )


class AdminJobDevice:
    """Thread-safe bridge between portal jobs and the serial owner loop."""

    TERMINAL_STATES = {"stored", "deleted", "cancelled", "error"}

    def __init__(self):
        self._commands: queue.Queue[str] = queue.Queue()
        self._jobs: dict[str, dict] = {}
        self._callbacks: dict[str, Callable[[], None]] = {}
        self._lock = threading.RLock()
        self._connected = False
        self._sensor = "unknown"
        self._port: str | None = None

    @staticmethod
    def _public(job: dict) -> dict:
        return json.loads(json.dumps(job))

    def _start(self, kind: str, slot: int, callback: Callable[[], None]) -> dict:
        ProfileStore._validate_slot(slot)
        with self._lock:
            if any(job["state"] not in self.TERMINAL_STATES for job in self._jobs.values()):
                raise RuntimeError("an admin job is already active")
            job_id = secrets.token_hex(6)
            job = {
                "id": job_id,
                "kind": kind,
                "slot": slot,
                "state": "queued",
                "updated_at": time.time(),
            }
            self._jobs[job_id] = job
            self._callbacks[job_id] = callback
            self._commands.put(f"ADMIN {kind.upper()} {job_id} {slot}")
            return self._public(job)

    def start_enroll(self, slot: int, on_success: Callable[[], None]) -> dict:
        return self._start("enroll", slot, on_success)

    def start_delete(self, slot: int, on_success: Callable[[], None]) -> dict:
        return self._start("delete", slot, on_success)

    def next_command(self, timeout: float = 0.0) -> str:
        return self._commands.get(timeout=timeout)

    def feed_line(self, line: str) -> bool:
        parts = line.strip().split()
        if len(parts) < 3 or parts[0] != "ADMIN":
            return False
        job_id = parts[1]
        state = parts[2].lower()
        callback = None
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return False
            if state == "error":
                job["error"] = " ".join(parts[3:]) or "device error"
            job["state"] = state
            job["updated_at"] = time.time()
            if state in {"stored", "deleted"}:
                callback = self._callbacks.pop(job_id, None)
            elif state in self.TERMINAL_STATES:
                self._callbacks.pop(job_id, None)
        if callback:
            callback()
        return True

    def get_job(self, job_id: str) -> dict | None:
        with self._lock:
            job = self._jobs.get(job_id)
            return self._public(job) if job else None

    def cancel_job(self, job_id: str) -> dict:
        with self._lock:
            job = self._jobs[job_id]
            if job["state"] not in self.TERMINAL_STATES:
                job["state"] = "cancelled"
                job["updated_at"] = time.time()
                self._callbacks.pop(job_id, None)
                self._commands.put(f"ADMIN CANCEL {job_id}")
            return self._public(job)

    def set_connection(self, connected: bool, port: str | None = None, sensor: str = "unknown") -> None:
        with self._lock:
            self._connected = connected
            self._port = port
            self._sensor = sensor

    def status(self) -> dict:
        with self._lock:
            return {"connected": self._connected, "sensor": self._sensor, "port": self._port}

class PortalAPI:
    """Framework-free JSON API used by the loopback HTTP server."""

    _finger_path = re.compile(r"^/api/fingers/(\d+)$")
    _enroll_path = re.compile(r"^/api/fingers/(\d+)/enroll$")
    _job_path = re.compile(r"^/api/jobs/([A-Za-z0-9_.-]+)$")
    _cancel_path = re.compile(r"^/api/jobs/([A-Za-z0-9_.-]+)/cancel$")

    def __init__(self, profiles: ProfileStore, device, csrf_token: str | None = None):
        self.profiles = profiles
        self.device = device
        self.csrf_token = csrf_token or secrets.token_urlsafe(32)
        self._log_lock = threading.Lock()
        self.log_buffer: deque[dict] = deque(maxlen=200)

    def add_log(self, tag: str, message: str) -> dict:
        """Add an event log entry with ISO timestamp to the thread-safe ring buffer."""
        timestamp = datetime.now(timezone.utc).isoformat()
        entry = {
            "timestamp": timestamp,
            "tag": tag,
            "message": message,
        }
        with self._log_lock:
            self.log_buffer.append(entry)
        return entry

    @staticmethod
    def _header(headers: dict, name: str) -> str:
        return next((str(value) for key, value in headers.items() if key.lower() == name.lower()), "")

    def _trusted(self, method: str, headers: dict) -> bool:
        host = self._header(headers, "Host").split(":", 1)[0].strip("[]").lower()
        if host not in {"127.0.0.1", "localhost", "::1"}:
            return False
        if method in {"POST", "PUT", "PATCH", "DELETE"}:
            return secrets.compare_digest(self._header(headers, "X-CSRF-Token"), self.csrf_token)
        return True

    def dispatch(self, method: str, path: str, body: dict, headers: dict) -> tuple[int, dict]:
        method = method.upper()
        if not self._trusted(method, headers):
            return 403, {"error": "request rejected"}
        try:
            if method == "GET" and path == "/api/status":
                return 200, {"device": self.device.status(), "csrf_token": self.csrf_token}
            if method == "GET" and path == "/api/logs":
                with self._log_lock:
                    logs = list(self.log_buffer)
                return 200, {"logs": logs}
            if path == "/api/test":
                if method != "POST":
                    return 405, {"error": "method not allowed"}
                action = body.get("action")
                if action not in {"ping", "type_test"}:
                    return 400, {"error": "action must be 'ping' or 'type_test'"}
                self.add_log("TEST", f"Triggered test action: {action}")
                return 200, {"status": "ok", "action": action}
            if method == "GET" and path == "/api/fingers":
                return 200, {"fingers": self.profiles.list_profiles()}
            if match := self._enroll_path.match(path):
                if method != "POST":
                    return 405, {"error": "method not allowed"}
                slot = int(match.group(1))
                self.profiles._validate_slot(slot)
                job = self.device.start_enroll(slot, lambda: self.profiles.set_enrolled(slot, True))
                self.add_log("ENROLL", f"Started enroll job for slot {slot}")
                return 202, {"job": job}
            if match := self._finger_path.match(path):
                slot = int(match.group(1))
                if method == "PUT":
                    profile = self.profiles.update_profile(slot, body)
                    self.add_log("CONFIG", f"Updated slot {slot} profile")
                    return 200, {"finger": profile}
                if method == "DELETE":
                    job = self.device.start_delete(slot, lambda: self.profiles.delete_profile(slot))
                    self.add_log("DELETE", f"Started delete job for slot {slot}")
                    return 202, {"job": job}
                return 405, {"error": "method not allowed"}
            if match := self._cancel_path.match(path):
                if method != "POST":
                    return 405, {"error": "method not allowed"}
                job = self.device.cancel_job(match.group(1))
                self.add_log("JOB", f"Cancelled job {match.group(1)}")
                return 200, {"job": job}
            if match := self._job_path.match(path):
                if method != "GET":
                    return 405, {"error": "method not allowed"}
                job = self.device.get_job(match.group(1))
                return (200, {"job": job}) if job else (404, {"error": "job not found"})
            return 404, {"error": "not found"}
        except RuntimeError as exc:
            return 409, {"error": str(exc)}
        except (KeyError, TypeError, ValueError) as exc:
            return 400, {"error": str(exc)}


def create_http_server(api, asset_directory: Path, host: str = "127.0.0.1", port: int = 8787):
    assets = Path(asset_directory).resolve()

    class PortalHandler(BaseHTTPRequestHandler):
        server_version = "tinyTouchPortal/1"

        def _security_headers(self) -> None:
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "DENY")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header(
                "Content-Security-Policy",
                "default-src 'self'; script-src 'self'; style-src 'self'; "
                "img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
            )

        def _send_json(self, status: int, payload: dict) -> None:
            data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self._security_headers()
            self.end_headers()
            self.wfile.write(data)

        def _body(self) -> dict:
            length = int(self.headers.get("Content-Length", "0"))
            if length > 65536:
                raise ValueError("request body exceeds 64 KiB")
            if not length:
                return {}
            value = json.loads(self.rfile.read(length).decode("utf-8"))
            if not isinstance(value, dict):
                raise ValueError("JSON body must be an object")
            return value

        def _api(self) -> None:
            try:
                body = self._body()
                status, payload = api.dispatch(
                    self.command,
                    urlsplit(self.path).path,
                    body,
                    dict(self.headers.items()),
                )
            except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
                status, payload = 400, {"error": str(exc)}
            self._send_json(status, payload)

        def _static(self) -> None:
            path = urlsplit(self.path).path
            names = {"/": "index.html", "/app.js": "app.js", "/styles.css": "styles.css"}
            name = names.get(path)
            if not name:
                self._send_json(404, {"error": "not found"})
                return
            target = assets / name
            try:
                data = target.read_bytes()
            except OSError:
                self._send_json(404, {"error": "asset not found"})
                return
            content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
            self.send_response(200)
            self.send_header("Content-Type", f"{content_type}; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self._security_headers()
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self) -> None:
            self._api() if self.path.startswith("/api/") else self._static()

        def do_POST(self) -> None:
            self._api()

        def do_PUT(self) -> None:
            self._api()

        def do_DELETE(self) -> None:
            self._api()

        def log_message(self, _format: str, *_args) -> None:
            return

    return ThreadingHTTPServer((host, port), PortalHandler)

def _text_step(value: bytes) -> bytes:
    if len(value) > 255:
        raise ValueError("text step is too long")
    return bytes([OP_TEXT]) + len(value).to_bytes(2, "big") + value


def _key_step(key: str, modifiers: int = 0) -> bytes:
    try:
        key_code = KEY_NAMES[key]
    except KeyError as exc:
        raise ValueError(f"unsupported key: {key}") from exc
    if not 0 <= modifiers <= 0x0F:
        raise ValueError("invalid key modifiers")
    return bytes([OP_KEY, modifiers, key_code])


def _custom_steps(profile: dict) -> list[bytes]:
    configured = profile.get("steps", [])
    if not isinstance(configured, list) or len(configured) > MAX_ACTION_STEPS:
        raise ValueError("custom action is limited to 16 steps")
    encoded = []
    for step in configured:
        kind = step.get("type") if isinstance(step, dict) else None
        if kind == "text":
            try:
                value = str(step.get("value", "")).encode("ascii")
            except UnicodeEncodeError as exc:
                raise ValueError("text actions require ASCII") from exc
            encoded.append(_text_step(value))
        elif kind == "key":
            encoded.append(_key_step(str(step.get("key", "")), int(step.get("modifiers", 0))))
        elif kind == "delay":
            milliseconds = int(step.get("milliseconds", 0))
            if not 0 <= milliseconds <= 5000:
                raise ValueError("delay must be between 0 and 5000 ms")
            encoded.append(bytes([OP_DELAY]) + milliseconds.to_bytes(2, "big"))
        else:
            raise ValueError("unsupported custom action step")
    return encoded


def encode_action(profile: dict, secret_resolver: Callable[[str], bytes]) -> bytes:
    """Encode a configured profile into the bounded firmware action format."""
    preset = profile.get("preset")
    if preset == "password":
        secret = secret_resolver(str(profile.get("secret_ref", "")))
        steps = [_text_step(secret), _key_step("enter")]
    elif preset == "enter":
        steps = [_key_step("enter")]
    elif preset == "accept":
        steps = [_text_step(b"y"), _key_step("enter")]
    elif preset == "escape":
        steps = [_key_step("escape")]
    elif preset == "custom":
        steps = _custom_steps(profile)
    else:
        raise ValueError("unsupported action preset")
    payload = bytes([ACTION_VERSION, len(steps)]) + b"".join(steps)
    if len(payload) > MAX_ACTION_BYTES:
        raise ValueError("encoded action exceeds 256 bytes")
    return payload
