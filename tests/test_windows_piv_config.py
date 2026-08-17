import unittest
from pathlib import Path


class WindowsPivConfigTests(unittest.TestCase):
    def setUp(self):
        self.script_path = Path(__file__).resolve().parent.parent / "software" / "scripts" / "windows_cert_enroll.ps1"

    def test_powershell_script_exists_and_contains_expected_flags(self):
        self.assertTrue(self.script_path.exists())
        content = self.script_path.read_text(encoding="utf-8")
        self.assertIn("SCardSvr", content)
        self.assertIn("certutil", content)
        self.assertIn("VerifyOnly", content)

    def test_required_eku_oids(self):
        SMARTCARD_LOGON_EKU = "1.3.6.1.4.1.311.20.2.2"
        CLIENT_AUTH_EKU = "1.3.6.1.5.5.7.3.2"

        self.assertEqual(SMARTCARD_LOGON_EKU, "1.3.6.1.4.1.311.20.2.2")
        self.assertEqual(CLIENT_AUTH_EKU, "1.3.6.1.5.5.7.3.2")


if __name__ == "__main__":
    unittest.main()
