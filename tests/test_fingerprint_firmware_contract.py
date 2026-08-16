import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "firmware" / "tiny_touch_smartcard" / "main" / "fingerprint.c"
HEADER = ROOT / "firmware" / "tiny_touch_smartcard" / "main" / "fingerprint.h"


class FingerprintFirmwareContractTests(unittest.TestCase):
    def test_unified_firmware_supports_all_ten_product_slots(self):
        source = SOURCE.read_text(encoding="utf-8")
        self.assertRegex(source, r"END_SLOT\s*=\s*10\s*;")

    def test_enrollment_uses_uart_image_state_instead_of_touchout_gate(self):
        source = SOURCE.read_text(encoding="utf-8")
        enrollment = source[source.index("bool fingerprint_enroll"):]
        self.assertIn("wait_for_image_state", enrollment)
        self.assertNotIn("wait_finger_state", enrollment)

    def test_match_result_exposes_template_slot_and_score(self):
        header = HEADER.read_text(encoding="utf-8")
        self.assertRegex(header, r"typedef\s+struct\s*\{[^}]*uint16_t\s+slot;[^}]*uint16_t\s+score;[^}]*\}\s*fingerprint_match_t", re.S)
        self.assertIn("fingerprint_authorize_poll_once(fingerprint_match_t *match)", header)


if __name__ == "__main__":
    unittest.main()
