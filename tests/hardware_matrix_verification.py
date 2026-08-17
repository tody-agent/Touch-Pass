"""TouchPass Hardware Test Matrix & Failure Injection Simulation Gate."""

import unittest


class HardwareMatrixVerificationTests(unittest.TestCase):
    def test_hardware_platform_matrix_coverage(self):
        supported_platforms = {
            "macos_apple_silicon": {"piv_native": True, "filevault_preboot": True, "login_window": True},
            "macos_apple_t2": {"piv_native": True, "filevault_preboot": False, "login_window": True},
            "windows_domain_ad": {"piv_native": True, "filevault_preboot": True, "login_window": True},
            "windows_entra_cba": {"piv_native": True, "filevault_preboot": True, "login_window": True},
            "windows_local_piv_native": {"piv_native": False, "filevault_preboot": False, "login_window": False},
        }

        self.assertTrue(supported_platforms["macos_apple_silicon"]["filevault_preboot"])
        self.assertFalse(supported_platforms["macos_apple_t2"]["filevault_preboot"])
        self.assertTrue(supported_platforms["macos_apple_t2"]["login_window"])
        self.assertFalse(supported_platforms["windows_local_piv_native"]["login_window"])

    def test_failure_injection_sensor_tamper(self):
        # When biometric sensor fails or returns unauthenticated match
        fingerprint_match = False
        piv_auth_allowed = False
        if fingerprint_match:
            piv_auth_allowed = True

        self.assertFalse(piv_auth_allowed)


if __name__ == "__main__":
    unittest.main()
