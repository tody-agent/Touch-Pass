import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class UnifiedFirmwareReleaseContractTests(unittest.TestCase):
    def test_cdc_tx_fifo_fits_complete_status_and_event_lines(self):
        defaults = (ROOT / "firmware" / "tiny_touch_smartcard" / "sdkconfig.defaults").read_text(
            encoding="utf-8"
        )
        self.assertIn("CONFIG_TINYUSB_CDC_TX_BUFSIZE=512", defaults)

    def test_unified_firmware_uses_touchout_and_uart_autodetection(self):
        source = (ROOT / "firmware" / "tiny_touch_smartcard" / "main" / "fingerprint.c").read_text(
            encoding="utf-8"
        )
        self.assertIn("FP_UART_CANDIDATES", source)
        self.assertIn("fp_autodetect_uart", source)
        self.assertRegex(source, r"FP_INT_PIN\s*=\s*2\s*;")

    def test_guides_separate_unified_and_legacy_pin_mappings(self):
        for guide in (ROOT / "docs" / "BUILD_GUIDE.md", ROOT / "docs" / "BUILD_GUIDE.vi.md"):
            text = guide.read_text(encoding="utf-8")
            self.assertIn("GPIO43/44", text, guide)
            self.assertIn("GPIO42/41", text, guide)
            self.assertIn("GPIO2", text, guide)
            self.assertIn("legacy", text.lower(), guide)

    def test_firmware_ci_pins_idf_and_publishes_flash_artifacts(self):
        workflow = (ROOT / ".github" / "workflows" / "firmware.yml").read_text(encoding="utf-8")
        self.assertIn("espressif/idf:v5.3", workflow)
        self.assertIn("bootloader.bin", workflow)
        self.assertIn("partition-table.bin", workflow)
        self.assertIn("tiny_touch_smartcard.bin", workflow)
        self.assertIn("SHA256SUMS", workflow)


if __name__ == "__main__":
    unittest.main()
