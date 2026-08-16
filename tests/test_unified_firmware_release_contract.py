import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class UnifiedFirmwareReleaseContractTests(unittest.TestCase):
    def test_guides_separate_unified_and_legacy_pin_mappings(self):
        for guide in (ROOT / "docs" / "BUILD_GUIDE.md", ROOT / "docs" / "BUILD_GUIDE.vi.md"):
            text = guide.read_text(encoding="utf-8")
            self.assertIn("GPIO43", text, guide)
            self.assertIn("GPIO44", text, guide)
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
