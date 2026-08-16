import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "firmware" / "tiny_touch_keyboard" / "tiny_touch_keyboard.ino"


class ArduinoFirmwareContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = SOURCE.read_text(encoding="utf-8")

    def test_uses_the_current_esp32_s3_super_mini_wiring(self):
        self.assertRegex(self.source, r"FP_TX_PIN\s*=\s*43\s*;")
        self.assertRegex(self.source, r"FP_RX_PIN\s*=\s*44\s*;")
        self.assertRegex(self.source, r"FP_INT_PIN\s*=\s*2\s*;")

    def test_desktop_admin_flow_can_unlock_before_enrollment(self):
        self.assertIn('command == "CONFIG_UNLOCK"', self.source)
        self.assertIn("requireConfigAuthorization()", self.source)
        self.assertIn('"OK CONFIG_UNLOCK first_setup seconds=120"', self.source)

    def test_enrollment_uses_uart_image_state_instead_of_touch_irq(self):
        enroll = re.search(
            r"static bool enrollFingerprint\(.*?\n\}", self.source, re.DOTALL
        )
        self.assertIsNotNone(enroll)
        body = enroll.group(0)
        self.assertIn("waitForImageState(true", body)
        self.assertIn("waitForImageState(false", body)
        self.assertNotIn("waitForFingerState", body)

    def test_status_matches_the_desktop_parser(self):
        self.assertIn(
            'OK STATUS firmware=unified mode=hid sensor=ok fingerprints=%d',
            self.source,
        )
        self.assertIn("hid_key=configured", self.source)

    def test_tinyusb_runtime_uses_the_touchpass_pid(self):
        self.assertIn("USB.VID(0x303A)", self.source)
        self.assertIn("USB.PID(0x4001)", self.source)
        self.assertIn("#define Serial USBSerial", self.source)

    def test_uart_parser_finishes_from_the_single_ack_payload(self):
        self.assertIn("actualDataLen = respLen - 3", self.source)
        self.assertIn("receivedChecksum", self.source)
        self.assertNotIn("postAckUntil", self.source)

    def test_template_count_falls_back_to_the_storage_bitmap(self):
        self.assertIn("static int fingerprintCountFromStorageMap()", self.source)
        self.assertIn("fpCommand(0x1f", self.source)
        count_body = re.search(
            r"static int fingerprintCount\(\).*?\n\}", self.source, re.S
        )
        self.assertIsNotNone(count_body)
        self.assertIn("return fingerprintCountFromStorageMap();", count_body.group(0))


if __name__ == "__main__":
    unittest.main()
