import sys
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path

# Add helper path
HELPER_DIR = Path(__file__).resolve().parent.parent / "software" / "macos-helper"
if str(HELPER_DIR) not in sys.path:
    sys.path.insert(0, str(HELPER_DIR))

import tinytouch_helper as helper


class WindowsSerialDetectionTests(unittest.TestCase):
    @patch("tinytouch_helper.platform.system", return_value="Windows")
    @patch("serial.tools.list_ports.comports")
    def test_detect_esp32_by_vid(self, mock_comports, _mock_platform):
        p1 = MagicMock()
        p1.device = "COM3"
        p1.vid = 0x303A
        p1.description = "USB Serial Device"

        p2 = MagicMock()
        p2.device = "COM1"
        p2.vid = 0x8086
        p2.description = "Standard Serial Port"

        mock_comports.return_value = [p1, p2]
        ports = helper.device_ports()
        self.assertIn("COM3", ports)

    @patch("tinytouch_helper.platform.system", return_value="Windows")
    @patch("serial.tools.list_ports.comports")
    def test_detect_com_fallback_excluding_com1(self, mock_comports, _mock_platform):
        p1 = MagicMock()
        p1.device = "COM1"
        p1.vid = None
        p1.description = "Communications Port"

        p2 = MagicMock()
        p2.device = "COM4"
        p2.vid = None
        p2.description = "Serial Device"

        mock_comports.return_value = [p1, p2]
        ports = helper.device_ports()
        self.assertEqual(ports, ["COM4"])

    def test_select_device_port_explicit(self):
        port = helper.select_device_port("COM5", available_ports=["COM3", "COM5"])
        self.assertEqual(port, "COM5")

    def test_select_device_port_single(self):
        port = helper.select_device_port(None, available_ports=["COM3"])
        self.assertEqual(port, "COM3")

    def test_select_device_port_empty_raises(self):
        with self.assertRaises(RuntimeError):
            helper.select_device_port(None, available_ports=[])

    def test_select_device_port_multiple_raises(self):
        with self.assertRaises(RuntimeError):
            helper.select_device_port(None, available_ports=["COM3", "COM4"])

    @patch("tinytouch_helper.platform.system", return_value="Windows")
    @patch("serial.tools.list_ports.comports")
    def test_excludes_bluetooth_and_communications_ports_when_unplugged(self, mock_comports, _mock_platform):
        p1 = MagicMock()
        p1.device = "COM1"
        p1.vid = None
        p1.description = "Communications Port (COM1)"
        p1.hwid = "ACPI\\PNP0501\\1"

        p2 = MagicMock()
        p2.device = "COM3"
        p2.vid = None
        p2.description = "Standard Serial over Bluetooth link (COM3)"
        p2.hwid = "BTHENUM\\{00001101-0000-1000-8000-00805F9B34FB}_LOCALMFG&0000\\7&3A53549&0&000000000000_00000000"

        mock_comports.return_value = [p1, p2]
        ports = helper.device_ports()
        self.assertEqual(ports, [])


if __name__ == "__main__":
    unittest.main()

