import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKETCH_DIR = ROOT / "firmware" / "zw101_hardware_test"
SKETCH = SKETCH_DIR / "zw101_hardware_test.ino"
README = SKETCH_DIR / "README.md"


class ZW101HardwareTestSketchTests(unittest.TestCase):
    def test_is_a_standalone_arduino_ide_sketch(self):
        self.assertTrue(SKETCH.exists(), "missing standalone Arduino sketch")
        self.assertEqual(SKETCH.stem, SKETCH_DIR.name)
        self.assertTrue(README.exists(), "missing Arduino IDE instructions")

    def test_autodetects_supported_uart_mappings(self):
        source = SKETCH.read_text(encoding="utf-8")
        self.assertRegex(source, r"UART_BAUD\s*=\s*57600")
        for tx_pin, rx_pin in ((43, 44), (42, 41), (1, 3)):
            self.assertRegex(source, rf"\{{\s*{tx_pin}\s*,\s*{rx_pin}\s*\}}")
        self.assertRegex(source, r"TOUCH_PIN\s*=\s*2")

    def test_only_uses_read_only_sensor_commands(self):
        source = SKETCH.read_text(encoding="utf-8")
        self.assertRegex(source, r"VERIFY_PASSWORD\s*=\s*0x13")
        self.assertRegex(source, r"TEMPLATE_COUNT\s*=\s*0x1[Dd]")
        self.assertRegex(source, r"GET_IMAGE\s*=\s*0x01")
        self.assertRegex(source, r"GET_ENROLL_IMAGE\s*=\s*0x29")

        destructive_names = (
            "STORE_TEMPLATE",
            "DELETE_TEMPLATE",
            "EMPTY_LIBRARY",
            "ENROLL",
        )
        for name in destructive_names:
            self.assertNotRegex(source, rf"\b{name}\b")

    def test_documents_safe_wiring_and_arduino_ide_settings(self):
        readme = README.read_text(encoding="utf-8")
        self.assertIn("3.3V", readme)
        self.assertIn("GPIO2", readme)
        self.assertIn("ESP32S3 Dev Module", readme)
        self.assertIn("115200", readme)
        self.assertRegex(readme, re.compile(r"TX.*RX|RX.*TX", re.IGNORECASE))


if __name__ == "__main__":
    unittest.main()

