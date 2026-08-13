import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "tinytouch_helper", ROOT / "software" / "macos-helper" / "tinytouch_helper.py"
)
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


class HelperProtocolTests(unittest.TestCase):
    def test_authenticated_event_returns_decryptable_password(self):
        key = bytes(range(32))
        password = b"correct horse battery staple!"
        nonce = "01" * 16
        event_mac = helper.mac_hex(key, f"EV|{nonce}|7|1|1")
        response = helper.handle_event(
            f"EV {nonce} 7 1 1 {event_mac}",
            password,
            key,
            {"seen_nonces": []},
            persist_state=False,
        )
        self.assertIsNotNone(response)
        kind, got_nonce, iv_hex, ciphertext_hex, response_mac = response.split()
        self.assertEqual((kind, got_nonce), ("PW", nonce))
        self.assertEqual(
            response_mac,
            helper.mac_hex(key, f"PW|{nonce}|{iv_hex}|{ciphertext_hex}"),
        )
        plaintext = helper.aes_ctr_crypt(
            helper.session_key(key, nonce), bytes.fromhex(iv_hex), bytes.fromhex(ciphertext_hex)
        )
        self.assertEqual(plaintext, password)

    def test_commoncrypto_matches_nist_aes_256_ctr_vector(self):
        key = bytes.fromhex(
            "603deb1015ca71be2b73aef0857d7781"
            "1f352c073b6108d72d9810a30914dff4"
        )
        iv = bytes.fromhex("f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff")
        plaintext = bytes.fromhex("6bc1bee22e409f96e93d7e117393172a")
        expected = bytes.fromhex("601ec313775789a5b7a7f504bbf3d228")
        self.assertEqual(helper.aes_ctr_crypt(key, iv, plaintext), expected)

    def test_replayed_nonce_is_rejected(self):
        key = bytes(range(32))
        nonce = "02" * 16
        event_mac = helper.mac_hex(key, f"EV|{nonce}|1|1|1")
        state = {"seen_nonces": [nonce]}
        response = helper.handle_event(
            f"EV {nonce} 1 1 1 {event_mac}",
            b"password",
            key,
            state,
            persist_state=False,
        )
        self.assertIsNone(response)

    def test_password_profile_returns_decryptable_action_payload(self):
        key = bytes(range(32))
        nonce = "03" * 16
        event_mac = helper.mac_hex(key, f"EV|{nonce}|2|1|99")
        profile = {"slot": 1, "action": {"preset": "password", "secret_ref": "slot-1"}}

        response = helper.handle_action_event(
            f"EV {nonce} 2 1 99 {event_mac}",
            key,
            {"seen_nonces": []},
            lambda slot: profile if slot == 1 else None,
            lambda reference: b"password" if reference == "slot-1" else b"",
            helper.TriggerGate(),
            now=10,
            persist_state=False,
        )

        kind, got_nonce, iv_hex, ciphertext_hex, response_mac = response.split()
        self.assertEqual((kind, got_nonce), ("ACT", nonce))
        self.assertEqual(
            response_mac,
            helper.mac_hex(key, f"ACT|{nonce}|{iv_hex}|{ciphertext_hex}"),
        )
        payload = helper.aes_ctr_crypt(
            helper.session_key(key, nonce), bytes.fromhex(iv_hex), bytes.fromhex(ciphertext_hex)
        )
        self.assertEqual(payload, helper.encode_action(profile["action"], lambda _ref: b"password"))

    def test_accept_profile_arms_then_executes_on_second_touch(self):
        key = bytes(range(32))
        state = {"seen_nonces": []}
        gate = helper.TriggerGate()
        profile = {"slot": 2, "action": {"preset": "accept"}}

        first_nonce = "04" * 16
        first_mac = helper.mac_hex(key, f"EV|{first_nonce}|1|2|100")
        first = helper.handle_action_event(
            f"EV {first_nonce} 1 2 100 {first_mac}",
            key,
            state,
            lambda slot: profile if slot == 2 else None,
            lambda _ref: b"",
            gate,
            now=10,
            persist_state=False,
        )

        second_nonce = "05" * 16
        second_mac = helper.mac_hex(key, f"EV|{second_nonce}|2|2|101")
        second = helper.handle_action_event(
            f"EV {second_nonce} 2 2 101 {second_mac}",
            key,
            state,
            lambda slot: profile if slot == 2 else None,
            lambda _ref: b"",
            gate,
            now=12,
            persist_state=False,
        )

        self.assertTrue(first.startswith(f"ARM {first_nonce} 2 3000 "))
        self.assertTrue(second.startswith(f"ACT {second_nonce} "))

    def test_port_selection_prefers_explicit_port(self):
        self.assertEqual(
            helper.select_device_port("/dev/cu.custom", ["/dev/cu.usbmodem1"]),
            "/dev/cu.custom",
        )

    def test_port_selection_accepts_one_usbmodem(self):
        self.assertEqual(helper.select_device_port(None, ["/dev/cu.usbmodem1"]), "/dev/cu.usbmodem1")

    def test_port_selection_rejects_zero_or_multiple_devices(self):
        with self.assertRaisesRegex(RuntimeError, "No ESP32-S3"):
            helper.select_device_port(None, [])
        with self.assertRaisesRegex(RuntimeError, "Multiple ESP32-S3"):
            helper.select_device_port(None, ["/dev/cu.usbmodem1", "/dev/cu.usbmodem2"])

    def test_portal_cli_defaults_to_loopback_portal(self):
        args = helper.build_parser().parse_args([])

        self.assertTrue(args.portal)
        self.assertEqual(args.portal_host, "127.0.0.1")
        self.assertEqual(args.portal_port, 8787)

    def test_admin_job_device_connection_status(self):
        device = helper.AdminJobDevice()
        self.assertFalse(device.status()["connected"])
        
        device.set_connection(True, "COM3", "ok")
        status = device.status()
        self.assertTrue(status["connected"])
        self.assertEqual(status["port"], "COM3")
        self.assertEqual(status["sensor"], "ok")

        device.set_connection(False, None, "unavailable")
        status_off = device.status()
        self.assertFalse(status_off["connected"])
        self.assertIsNone(status_off["port"])
        self.assertEqual(status_off["sensor"], "unavailable")


if __name__ == "__main__":
    unittest.main()

