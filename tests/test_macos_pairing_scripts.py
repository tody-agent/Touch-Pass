import re
import unittest
from pathlib import Path


class MacosPairingScriptTests(unittest.TestCase):
    def setUp(self):
        self.script_path = Path(__file__).resolve().parent.parent / "software" / "scripts" / "macos_pair_smartcard.sh"

    def test_script_exists_and_is_executable_format(self):
        self.assertTrue(self.script_path.exists())
        content = self.script_path.read_text(encoding="utf-8")
        self.assertTrue(content.startswith("#!/usr/bin/env bash"))
        self.assertIn("sc_auth identities", content)
        self.assertIn("sc_auth pair", content)

    def test_identity_regex_extraction(self):
        sample_output = """
        SmartCard: com.apple.CryptoTokenKit.pivtoken:A000000308000010000100
        1234567890ABCDEF1234567890ABCDEF12345678 PIV Authentication (TouchPass 9A)
        """
        match = re.search(r"\b([0-9a-fA-F]{40})\b", sample_output)
        self.assertIsNotNone(match)
        self.assertEqual(match.group(1), "1234567890ABCDEF1234567890ABCDEF12345678")


if __name__ == "__main__":
    unittest.main()
