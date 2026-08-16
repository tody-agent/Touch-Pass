import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "firmware" / "tiny_touch_smartcard" / "main" / "fingerprint.c"
HEADER = ROOT / "firmware" / "tiny_touch_smartcard" / "main" / "fingerprint.h"
CONSOLE = ROOT / "firmware" / "tiny_touch_smartcard" / "main" / "config_console.c"
TOUCH_HID = ROOT / "firmware" / "tiny_touch_smartcard" / "main" / "touch_pin_hid.c"


class FingerprintFirmwareContractTests(unittest.TestCase):
    def test_status_exposes_uart_confirm_diagnostics(self):
        console = CONSOLE.read_text(encoding="utf-8")
        self.assertIn("verify_confirm=0x%02x", console)
        self.assertIn("count_transport=%d", console)
        self.assertIn("count_confirm=0x%02x", console)
        self.assertIn("count_len=%d", console)

    def test_uart_autodetect_covers_known_s3_mini_silkscreen_mappings(self):
        source = SOURCE.read_text(encoding="utf-8")
        self.assertIn("{43, 44}", source)
        self.assertIn("{42, 41}", source)
        self.assertIn("{1, 3}", source)

    def test_template_count_reprobes_uart_after_transport_failure(self):
        source = SOURCE.read_text(encoding="utf-8")
        count = source[source.index("int fingerprint_count"):source.index("static bool wait_for_image_state")]
        self.assertIn("fp_autodetect_uart", count)

    def test_unified_firmware_supports_all_ten_product_slots(self):
        source = SOURCE.read_text(encoding="utf-8")
        self.assertRegex(source, r"END_SLOT\s*=\s*10\s*;")

    def test_enrollment_uses_uart_image_state_instead_of_touchout_gate(self):
        source = SOURCE.read_text(encoding="utf-8")
        enrollment = source[source.index("bool fingerprint_enroll"):]
        self.assertIn("wait_for_image_state", enrollment)
        self.assertNotIn("wait_finger_state", enrollment)

    def test_image_capture_uses_get_image_with_delayed_ack_protection(self):
        source = SOURCE.read_text(encoding="utf-8")
        helper = source[source.index("static bool fp_get_image"):source.index("static bool fingerprint_match_captured")]
        self.assertIn("FP_GET_IMAGE", helper)
        self.assertNotIn("FP_GET_ENROLL_IMAGE", helper)
        self.assertIn("response_data_length", helper)
        self.assertRegex(helper, r"response_data_length\s*!=\s*0")

        polling = source[source.index("bool fingerprint_authorize_poll_once"):]
        self.assertNotIn("fp_command(0x01", polling)
        poll_call = re.search(r"fp_get_image\(&confirm,\s*(\d+)\)", polling)
        self.assertIsNotNone(poll_call)
        self.assertGreaterEqual(int(poll_call.group(1)), 2000)

    def test_uart_timeout_resynchronizes_before_next_command(self):
        source = SOURCE.read_text(encoding="utf-8")
        command = source[source.index("static bool fp_command"):source.index("static bool fp_take")]
        self.assertIn("fp_resync_uart", command)
        self.assertRegex(command, r"fp_resync_uart\([^;]+\);\s*return false;")

    def test_continuous_touch_requires_lift_before_another_match(self):
        source = SOURCE.read_text(encoding="utf-8")
        polling = source[source.index("bool fingerprint_authorize_poll_once"):source.index("void fingerprint_init")]
        self.assertIn("auth_waiting_for_lift", source)
        self.assertIn("FP_IMAGE_ABSENT", polling)
        self.assertRegex(polling, r"FP_IMAGE_ABSENT[\s\S]*auth_waiting_for_lift\s*=\s*false")
        self.assertRegex(polling, r"if\s*\([^)]*auth_waiting_for_lift[^)]*\)\s*\{[\s\S]*?return false")
        self.assertRegex(polling, r"if\s*\(ok\)\s*auth_waiting_for_lift\s*=\s*true")

    def test_experimental_enroll_image_opcode_is_not_exposed(self):
        source = SOURCE.read_text(encoding="utf-8")
        console = CONSOLE.read_text(encoding="utf-8")
        self.assertNotIn("FP_GET_ENROLL_IMAGE", source)
        self.assertNotIn('strcmp(command, "FP_DIAG")', console)

    def test_boot_resynchronizes_uart_and_polling_requires_ready_sensor(self):
        source = SOURCE.read_text(encoding="utf-8")
        init = source[source.index("void fingerprint_init"):source.index("bool fingerprint_authorize_once")]
        self.assertRegex(init, r"uart_set_pin\([^;]+\);[\s\S]*fp_resync_uart\([^;]+\);[\s\S]*fp_autodetect_uart")
        polling = source[source.index("bool fingerprint_authorize_poll_once"):source.index("void fingerprint_init")]
        self.assertRegex(polling, r"if\s*\(!sensor_ready\)\s*return false")

    def test_count_shape_mismatch_resynchronizes_before_reprobe(self):
        source = SOURCE.read_text(encoding="utf-8")
        count = source[source.index("int fingerprint_count"):source.index("int fingerprint_uart_tx_pin")]
        self.assertRegex(count, r"if\s*\(!ok\)\s*\{[\s\S]*fp_resync_uart\([^;]+\);[\s\S]*fp_autodetect_uart")

    def test_match_result_exposes_template_slot_and_score(self):
        header = HEADER.read_text(encoding="utf-8")
        self.assertRegex(header, r"typedef\s+struct\s*\{[^}]*uint16_t\s+slot;[^}]*uint16_t\s+score;[^}]*\}\s*fingerprint_match_t", re.S)
        self.assertIn("fingerprint_authorize_poll_once(fingerprint_match_t *match)", header)

    def test_unconfigured_piv_match_never_types_dummy_pin(self):
        source = TOUCH_HID.read_text(encoding="utf-8")
        task = source[source.index("static void touch_hid_task"):source.index("void touch_pin_hid_start")]
        self.assertIn("piv_uses_provisioned_keys()", task)
        self.assertRegex(
            task,
            r"if\s*\(!piv_uses_provisioned_keys\(\)\)\s*\{"
            r"[\s\S]*?notify_unconfigured\(&match,\s*\"piv\",\s*\"keys\"\)"
            r"[\s\S]*?\}\s*else\s*\{[\s\S]*?type_dummy_pin\(\)",
        )

    def test_unconfigured_event_reports_real_match_and_reason(self):
        source = TOUCH_HID.read_text(encoding="utf-8")
        self.assertIn(
            '"EV UNCONFIGURED slot=%u score=%u mode=%s reason=%s"',
            source,
        )
        self.assertIn("match->slot, match->score, mode, reason", source)
        self.assertIn("fingerprint_led_unconfigured()", source)

    def test_background_match_defers_led_until_action_outcome(self):
        source = SOURCE.read_text(encoding="utf-8")
        header = HEADER.read_text(encoding="utf-8")
        self.assertRegex(source, r"FP_LED_YELLOW\s*=\s*0x06")
        self.assertIn("void fingerprint_led_action_result(bool ok)", source)
        self.assertIn("void fingerprint_led_unconfigured(void)", source)
        self.assertIn("fingerprint_led_action_result(bool ok);", header)
        self.assertIn("fingerprint_led_unconfigured(void);", header)
        matching = source[
            source.index("static bool fingerprint_match_captured"):
            source.index("bool fingerprint_authorize_poll_once")
        ]
        self.assertNotIn("if (!quiet || ok) show_result(ok);", matching)
        self.assertIn("if (!quiet) show_result(ok);", matching)


if __name__ == "__main__":
    unittest.main()
