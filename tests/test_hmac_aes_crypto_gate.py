import hmac
import hashlib
import sys
import unittest
from pathlib import Path

# Add helper path
HELPER_DIR = Path(__file__).resolve().parent.parent / "software" / "macos-helper"
if str(HELPER_DIR) not in sys.path:
    sys.path.insert(0, str(HELPER_DIR))

import tinytouch_helper as helper
import tinytouch_portal as portal


class HmacAesCryptoGateTests(unittest.TestCase):
    def setUp(self):
        self.pairing_key = b"A" * 32
        self.password = b"SuperSecretPass123"
        self.state = {"seen_nonces": []}

    def _mac(self, message: str) -> str:
        return hmac.new(self.pairing_key, message.encode("ascii"), hashlib.sha256).hexdigest()

    def test_handle_event_valid_hmac_returns_encrypted_pw(self):
        nonce = "0102030405060708090a0b0c0d0e0f10"
        counter = "1"
        slot = "1"
        score = "150"
        mac = self._mac(f"EV|{nonce}|{counter}|{slot}|{score}")
        line = f"EV {nonce} {counter} {slot} {score} {mac}"

        reply = helper.handle_event(line, self.password, self.pairing_key, self.state, persist_state=False)
        self.assertIsNotNone(reply)
        parts = reply.strip().split()
        self.assertEqual(parts[0], "PW")
        self.assertEqual(parts[1], nonce)

    def test_handle_event_invalid_hmac_rejected(self):
        nonce = "0102030405060708090a0b0c0d0e0f10"
        line = f"EV {nonce} 1 1 150 badmac0000000000000000000000000000000000000000000000000000000000"
        reply = helper.handle_event(line, self.password, self.pairing_key, self.state, persist_state=False)
        self.assertIsNone(reply)

    def test_handle_event_nonce_replay_rejected(self):
        nonce = "0102030405060708090a0b0c0d0e0f10"
        mac = self._mac(f"EV|{nonce}|1|1|150")
        line = f"EV {nonce} 1 1 150 {mac}"

        reply1 = helper.handle_event(line, self.password, self.pairing_key, self.state, persist_state=False)
        self.assertIsNotNone(reply1)

        # Replay attempt
        reply2 = helper.handle_event(line, self.password, self.pairing_key, self.state, persist_state=False)
        self.assertIsNone(reply2)

    def test_handle_action_event_arm_and_act(self):
        gate = portal.TriggerGate(window_seconds=3.0)
        nonce = "11223344556677889900aabbccddeeff"
        mac = self._mac(f"EV|{nonce}|1|1|150")
        line = f"EV {nonce} 1 1 150 {mac}"

        profiles = {1: {"slot": 1, "action": {"preset": "enter", "confirm": True}}}
        secret_store = lambda _ref: b""

        # First touch -> ARMED
        reply1 = helper.handle_action_event(
            line,
            self.pairing_key,
            self.state,
            profiles.get,
            secret_store,
            gate,
            persist_state=False,
        )
        self.assertIsNotNone(reply1)
        self.assertTrue(reply1.startswith("ARM "))

        # Second touch -> ACT (encrypted action payload)
        nonce2 = "ffeeddccbbaa00998877665544332211"
        mac2 = self._mac(f"EV|{nonce2}|2|1|150")
        line2 = f"EV {nonce2} 2 1 150 {mac2}"
        reply2 = helper.handle_action_event(
            line2,
            self.pairing_key,
            self.state,
            profiles.get,
            secret_store,
            gate,
            persist_state=False,
        )
        self.assertIsNotNone(reply2)
        self.assertTrue(reply2.startswith("ACT "))


if __name__ == "__main__":
    unittest.main()
