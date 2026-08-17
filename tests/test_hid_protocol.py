import hashlib
import hmac
import sys
import unittest
from pathlib import Path

# Add helper directory
HELPER_DIR = Path(__file__).resolve().parent.parent / "software" / "macos-helper"
if str(HELPER_DIR) not in sys.path:
    sys.path.insert(0, str(HELPER_DIR))

import tinytouch_helper as helper
import tinytouch_portal as portal


class HidProtocolArmActTests(unittest.TestCase):
    def setUp(self):
        self.pairing_key = b"\x01\x23\x45\x67\x89\xab\xcd\xef" * 4  # 32 bytes
        self.state = {"seen_nonces": []}
        self.gate = portal.TriggerGate(window_seconds=3.0)

    def _generate_ev_line(self, nonce: str, counter: int, slot: int, score: int = 150) -> str:
        msg = f"EV|{nonce}|{counter}|{slot}|{score}"
        mac = hmac.new(self.pairing_key, msg.encode("ascii"), hashlib.sha256).hexdigest()
        return f"EV {nonce} {counter} {slot} {score} {mac}"

    def test_arm_and_act_full_lifecycle(self):
        profiles = {
            1: {
                "slot": 1,
                "label": "Login Action",
                "action": {"preset": "enter", "confirm": True},
            }
        }
        secret_store = lambda _ref: b"Secret123"

        # 1. First touch with confirm=True produces ARM command
        nonce1 = "a1b2c3d4e5f60718293a4b5c6d7e8f90"
        line1 = self._generate_ev_line(nonce1, 1, 1)

        arm_reply = helper.handle_action_event(
            line1,
            self.pairing_key,
            self.state,
            profiles.get,
            secret_store,
            self.gate,
            persist_state=False,
        )
        self.assertIsNotNone(arm_reply)
        self.assertTrue(arm_reply.startswith("ARM "))
        arm_parts = arm_reply.strip().split()
        # Protocol: ARM <nonce> <slot> <expires_ms> <reply_mac>
        self.assertEqual(len(arm_parts), 5)
        self.assertEqual(arm_parts[1], nonce1)
        self.assertEqual(arm_parts[2], "1")
        self.assertEqual(arm_parts[3], "3000")

        # 2. Second touch within window produces ACT command
        nonce2 = "09f8e7d6c5b4a39281706f5e4d3c2b1a"
        line2 = self._generate_ev_line(nonce2, 2, 1)

        act_reply = helper.handle_action_event(
            line2,
            self.pairing_key,
            self.state,
            profiles.get,
            secret_store,
            self.gate,
            persist_state=False,
        )
        self.assertIsNotNone(act_reply)
        self.assertTrue(act_reply.startswith("ACT "))
        act_parts = act_reply.strip().split()
        # Protocol: ACT <nonce> <iv_hex> <ciphertext_hex> <reply_mac>
        self.assertEqual(len(act_parts), 5)
        self.assertEqual(act_parts[1], nonce2)

    def test_direct_execution_when_confirm_is_false(self):
        profiles = {
            2: {
                "slot": 2,
                "label": "Instant Macro",
                "action": {"preset": "enter", "confirm": False},
            }
        }
        secret_store = lambda _ref: b""

        nonce = "11112222333344445555666677778888"
        line = self._generate_ev_line(nonce, 1, 2)

        reply = helper.handle_action_event(
            line,
            self.pairing_key,
            self.state,
            profiles.get,
            secret_store,
            self.gate,
            persist_state=False,
        )
        self.assertIsNotNone(reply)
        self.assertTrue(reply.startswith("ACT "))
        act_parts = reply.strip().split()
        self.assertEqual(len(act_parts), 5)
        self.assertEqual(act_parts[1], nonce)

    def test_invalid_hmac_rejected(self):
        nonce = "ffffffffffffffffffffffffffffffff"
        bad_line = f"EV {nonce} 1 1 150 00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"

        reply = helper.handle_action_event(
            bad_line,
            self.pairing_key,
            self.state,
            lambda _slot: None,
            lambda _ref: b"",
            self.gate,
            persist_state=False,
        )
        self.assertIsNone(reply)


if __name__ == "__main__":
    unittest.main()
