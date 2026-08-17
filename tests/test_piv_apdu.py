import unittest

# Constants for NIST SP 800-73-4 PIV APDU testing
PIV_AID = bytes([0xA0, 0x00, 0x00, 0x03, 0x08, 0x00, 0x00, 0x10, 0x00])
PIV_AID_VERSIONED = bytes([0xA0, 0x00, 0x00, 0x03, 0x08, 0x00, 0x00, 0x10, 0x00, 0x01, 0x00])

SW_SUCCESS = (0x90, 0x00)
SW_SECURITY_STATUS_NOT_SATISFIED = (0x69, 0x82)
SW_WRONG_LENGTH = (0x67, 0x00)
SW_FILE_NOT_FOUND = (0x6A, 0x82)
SW_INCORRECT_PARAMETERS = (0x6A, 0x86)
SW_DATA_NOT_FOUND = (0x6A, 0x88)


class PivApduMockDispatcher:
    """Mock dispatcher modeling the ESP32-S3 piv.c NIST SP 800-73-4 behavior for verification."""

    def __init__(self):
        self.pin_verified = False
        self.user_presence = False
        self.pairing_mode = False
        self.cert_9a = b"MOCK_CERT_9A_X509_DER_DATA"
        self.cert_9d = b""

    def set_user_presence(self, present: bool = True):
        self.user_presence = present

    def handle_apdu(self, apdu: bytes) -> tuple[bytes, tuple[int, int]]:
        if len(apdu) < 4:
            return b"", SW_WRONG_LENGTH

        cla, ins, p1, p2 = apdu[0], apdu[1], apdu[2], apdu[3]

        # SELECT
        if ins == 0xA4 and p1 == 0x04 and p2 == 0x00:
            lc = apdu[4] if len(apdu) > 4 else 0
            data = apdu[5 : 5 + lc]
            if data == PIV_AID or data == PIV_AID_VERSIONED:
                # Return FCI
                fci = bytes(
                    [
                        0x61,
                        0x11,
                        0x4F,
                        0x06,
                        0x00,
                        0x00,
                        0x10,
                        0x00,
                        0x01,
                        0x00,
                        0x79,
                        0x07,
                        0x4F,
                        0x05,
                        0xA0,
                        0x00,
                        0x00,
                        0x03,
                        0x08,
                    ]
                )
                return fci, SW_SUCCESS
            return b"", SW_FILE_NOT_FOUND

        # GET DATA
        if ins == 0xCB and p1 == 0x3F and p2 == 0xFF:
            if len(apdu) < 5:
                return b"", SW_WRONG_LENGTH
            lc = apdu[4]
            data = apdu[5 : 5 + lc]

            # Discovery Object: 5C 01 7E
            if data == bytes([0x5C, 0x01, 0x7E]):
                discovery = bytes([0x7E, 0x05, 0x4F, 0x03, 0xA0, 0x00, 0x00])
                return discovery, SW_SUCCESS

            # Card Capability Container (CCC): 5C 03 5F C1 07
            if data == bytes([0x5C, 0x03, 0x5F, 0xC1, 0x07]):
                ccc = bytes([0x53, 0x08, 0xF0, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
                return ccc, SW_SUCCESS

            # CHUID: 5C 03 5F C1 02
            if data == bytes([0x5C, 0x03, 0x5F, 0xC1, 0x02]):
                chuid = bytes([0x53, 0x06, 0x30, 0x04, 0x01, 0x02, 0x03, 0x04])
                return chuid, SW_SUCCESS

            # Cert 9A: 5C 03 5F C1 05
            if data == bytes([0x5C, 0x03, 0x5F, 0xC1, 0x05]):
                if not self.cert_9a:
                    return b"", SW_DATA_NOT_FOUND
                cert_obj = bytes([0x53, len(self.cert_9a) + 2, 0x70, len(self.cert_9a)]) + self.cert_9a
                return cert_obj, SW_SUCCESS

            return b"", SW_DATA_NOT_FOUND

        # VERIFY PIN
        if ins == 0x20 and p1 == 0x00 and p2 == 0x80:
            self.pin_verified = True
            return b"", SW_SUCCESS

        # GENERAL AUTHENTICATE
        if ins == 0x87:
            alg, slot = p1, p2
            if alg != 0x07 or slot not in (0x9A, 0x9D):
                return b"", SW_INCORRECT_PARAMETERS
            if not self.pin_verified:
                return b"", SW_SECURITY_STATUS_NOT_SATISFIED

            if slot == 0x9A:
                if not self.user_presence and not self.pairing_mode:
                    self.pin_verified = False
                    return b"", SW_SECURITY_STATUS_NOT_SATISFIED
                # Single-use consumption
                self.user_presence = False

            self.pin_verified = False
            # Return signed challenge mock
            mock_signature = b"\xaa" * 256
            sig_obj = bytes([0x7C, 0x82, 0x01, 0x04, 0x82, 0x82, 0x01, 0x00]) + mock_signature
            return sig_obj, SW_SUCCESS

        return b"", SW_INCORRECT_PARAMETERS


class PivApduTests(unittest.TestCase):
    def setUp(self):
        self.piv = PivApduMockDispatcher()

    def test_select_piv_aid_success(self):
        apdu = bytes([0x00, 0xA4, 0x04, 0x00, len(PIV_AID)]) + PIV_AID
        resp, sw = self.piv.handle_apdu(apdu)
        self.assertEqual(sw, SW_SUCCESS)
        self.assertTrue(len(resp) > 0)
        self.assertEqual(resp[0], 0x61)  # Application template

    def test_get_data_chuid_and_ccc(self):
        # Request CCC
        ccc_req = bytes([0x00, 0xCB, 0x3F, 0xFF, 0x05, 0x5C, 0x03, 0x5F, 0xC1, 0x07])
        resp, sw = self.piv.handle_apdu(ccc_req)
        self.assertEqual(sw, SW_SUCCESS)
        self.assertTrue(resp.startswith(b"\x53"))

        # Request CHUID
        chuid_req = bytes([0x00, 0xCB, 0x3F, 0xFF, 0x05, 0x5C, 0x03, 0x5F, 0xC1, 0x02])
        resp, sw = self.piv.handle_apdu(chuid_req)
        self.assertEqual(sw, SW_SUCCESS)
        self.assertTrue(resp.startswith(b"\x53"))

    def test_general_authenticate_requires_pin_and_presence(self):
        # GENERAL AUTHENTICATE APDU for Slot 9A
        challenge_tlv = bytes([0x7C, 0x05, 0x81, 0x03, 0x01, 0x02, 0x03])
        auth_apdu = bytes([0x00, 0x87, 0x07, 0x9A, len(challenge_tlv)]) + challenge_tlv

        # 1. Without PIN verification -> fails
        resp, sw = self.piv.handle_apdu(auth_apdu)
        self.assertEqual(sw, SW_SECURITY_STATUS_NOT_SATISFIED)

        # 2. With PIN verification but NO user biometric presence -> fails
        pin_apdu = bytes([0x00, 0x20, 0x00, 0x80, 0x08, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0xFF, 0xFF])
        _, pin_sw = self.piv.handle_apdu(pin_apdu)
        self.assertEqual(pin_sw, SW_SUCCESS)

        resp, sw = self.piv.handle_apdu(auth_apdu)
        self.assertEqual(sw, SW_SECURITY_STATUS_NOT_SATISFIED)

        # 3. With PIN and User Biometric Presence -> succeeds
        _, pin_sw = self.piv.handle_apdu(pin_apdu)
        self.assertEqual(pin_sw, SW_SUCCESS)
        self.piv.set_user_presence(True)

        resp, sw = self.piv.handle_apdu(auth_apdu)
        self.assertEqual(sw, SW_SUCCESS)
        self.assertTrue(resp.startswith(b"\x7C"))

        # 4. Immediate second attempt without new presence -> fails (single-use)
        _, pin_sw = self.piv.handle_apdu(pin_apdu)
        resp, sw = self.piv.handle_apdu(auth_apdu)
        self.assertEqual(sw, SW_SECURITY_STATUS_NOT_SATISFIED)


if __name__ == "__main__":
    unittest.main()
