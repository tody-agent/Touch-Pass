import sys
import unittest
from pathlib import Path

# Add helper path
HELPER_DIR = Path(__file__).resolve().parent.parent / "software" / "macos-helper"
if str(HELPER_DIR) not in sys.path:
    sys.path.insert(0, str(HELPER_DIR))

import tinytouch_helper as helper
import tinytouch_portal as portal


class KeyringSecretStoreTests(unittest.TestCase):
    def setUp(self):
        self.store = portal.KeychainSecretStore(device_id="TEST_DEVICE_123")

    def test_set_get_and_delete_secret(self):
        ref = "slot-1"
        secret = b"Password123!"
        self.store.set(ref, secret)
        retrieved = self.store.get(ref)
        self.assertEqual(retrieved, secret)

        self.store.delete(ref)
        with self.assertRaises((KeyError, Exception)):
            self.store.get(ref)

    def test_non_ascii_secret_rejection(self):
        store = portal.ProfileStore(Path("scratch/test_profiles.json"), secret_store=self.store)
        with self.assertRaises(ValueError):
            store.update_profile(1, {"action": {"preset": "password"}, "secret": "MatKhauViet123\u0111"})

    def test_keychain_helper_functions(self):
        device_id = "TEST_DEVICE_ABC"
        helper.keychain_set("MySecretPass", device_id=device_id)
        get_val = helper.keychain_get(device_id=device_id)
        self.assertEqual(get_val, b"MySecretPass")

        key_hex = "00" * 32
        helper.pairing_keychain_set(key_hex, device_id=device_id)
        pairing_val = helper.pairing_keychain_get(device_id=device_id)
        self.assertEqual(pairing_val, bytes.fromhex(key_hex))

        self.assertTrue(helper.credentials_exist(device_id=device_id))

    def test_invalid_pairing_key_length_raises(self):
        with self.assertRaises(SystemExit):
            helper.parse_pairing_key("1234567890")


if __name__ == "__main__":
    unittest.main()
