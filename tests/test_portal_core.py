import importlib.util
import json
import tempfile
import unittest
from types import SimpleNamespace
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "tinytouch_portal",
    ROOT / "software" / "macos-helper" / "tinytouch_portal.py",
)
portal = importlib.util.module_from_spec(spec)
spec.loader.exec_module(portal)


class ActionCodecTests(unittest.TestCase):
    def test_password_preset_encodes_secret_text_and_enter(self):
        profile = {"preset": "password", "secret_ref": "slot-1"}

        payload = portal.encode_action(profile, lambda ref: b"hunter2" if ref == "slot-1" else b"")

        self.assertEqual(
            payload,
            bytes([1, 2, 1, 0, 7]) + b"hunter2" + bytes([2, 0, portal.KEY_ENTER]),
        )

    def test_accept_preset_encodes_y_and_enter(self):
        payload = portal.encode_action({"preset": "accept"}, lambda _ref: b"")

        self.assertEqual(
            payload,
            bytes([1, 2, 1, 0, 1]) + b"y" + bytes([2, 0, portal.KEY_ENTER]),
        )

    def test_custom_action_rejects_more_than_sixteen_steps(self):
        profile = {"preset": "custom", "steps": [{"type": "key", "key": "enter"}] * 17}

        with self.assertRaisesRegex(ValueError, "16 steps"):
            portal.encode_action(profile, lambda _ref: b"")

    def test_custom_action_rejects_non_ascii_text(self):
        profile = {"preset": "custom", "steps": [{"type": "text", "value": "đồng ý"}]}

        with self.assertRaisesRegex(ValueError, "ASCII"):
            portal.encode_action(profile, lambda _ref: b"")


class TriggerGateTests(unittest.TestCase):
    def test_password_executes_on_first_touch(self):
        gate = portal.TriggerGate(window_seconds=3)

        self.assertEqual(gate.touch(1, {"preset": "password"}, now=10), "execute")

    def test_accept_requires_same_slot_twice_within_window(self):
        gate = portal.TriggerGate(window_seconds=3)

        self.assertEqual(gate.touch(2, {"preset": "accept"}, now=10), "armed")
        self.assertEqual(gate.touch(2, {"preset": "accept"}, now=12.9), "execute")

    def test_expired_or_different_slot_rearms(self):
        gate = portal.TriggerGate(window_seconds=3)

        self.assertEqual(gate.touch(2, {"preset": "accept"}, now=10), "armed")
        self.assertEqual(gate.touch(3, {"preset": "enter"}, now=11), "armed")
        self.assertEqual(gate.touch(3, {"preset": "enter"}, now=15), "armed")


class FakeSecrets:
    def __init__(self):
        self.values = {}

    def set(self, reference, value):
        self.values[reference] = value

    def get(self, reference):
        return self.values[reference]

    def delete(self, reference):
        self.values.pop(reference, None)


class ProfileStoreTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tempdir.cleanup)
        self.path = Path(self.tempdir.name) / "profiles.json"
        self.secrets = FakeSecrets()
        self.store = portal.ProfileStore(self.path, self.secrets)

    def test_new_store_exposes_exactly_ten_slots(self):
        profiles = self.store.list_profiles()

        self.assertEqual([profile["slot"] for profile in profiles], list(range(1, 11)))
        self.assertTrue(all(not profile["enrolled"] for profile in profiles))

    def test_password_is_kept_out_of_json_and_marked_configured(self):
        profile = self.store.update_profile(
            1,
            {"label": "Ngón cái", "action": {"preset": "password"}, "secret": "s3cret"},
        )

        saved = json.loads(self.path.read_text(encoding="utf-8"))
        self.assertNotIn("s3cret", self.path.read_text(encoding="utf-8"))
        self.assertEqual(self.secrets.get("slot-1"), b"s3cret")
        self.assertTrue(profile["action"]["secret_configured"])
        self.assertEqual(saved["profiles"][0]["action"]["secret_ref"], "slot-1")

    def test_slot_outside_one_to_ten_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "1 and 10"):
            self.store.update_profile(11, {"label": "invalid", "action": {"preset": "enter"}})

    def test_delete_clears_profile_and_secret(self):
        self.store.update_profile(
            2,
            {"label": "Login", "action": {"preset": "password"}, "secret": "pw"},
        )

        profile = self.store.delete_profile(2)

        self.assertEqual(profile["label"], "Ngón 2")
        self.assertNotIn("slot-2", self.secrets.values)

    def test_switching_away_from_password_removes_stale_secret(self):
        self.store.update_profile(
            3,
            {"label": "Login", "action": {"preset": "password"}, "secret": "pw"},
        )

        self.store.update_profile(3, {"label": "Accept", "action": {"preset": "accept"}})

        self.assertNotIn("slot-3", self.secrets.values)


class KeychainSecretStoreTests(unittest.TestCase):
    def test_set_and_get_use_per_slot_keychain_items(self):
        commands = []

        def runner(command, **_kwargs):
            commands.append(command)
            return SimpleNamespace(stdout="secret\n", returncode=0)

        store = portal.KeychainSecretStore(device_id="BOARD123", runner=runner)
        store.set("slot-4", b"secret")
        value = store.get("slot-4")

        self.assertEqual(value, b"secret")
        self.assertIn("tinyTouch-action-BOARD123", commands[0])
        self.assertIn("slot-4", commands[0])
        self.assertEqual(commands[0][-1], "secret")


class AdminJobDeviceTests(unittest.TestCase):
    def test_enroll_routes_progress_and_completes_callback(self):
        completed = []
        device = portal.AdminJobDevice()

        job = device.start_enroll(3, lambda: completed.append(3))
        command = device.next_command(timeout=0)
        device.feed_line(f"ADMIN {job['id']} PLACE_FIRST")
        device.feed_line(f"ADMIN {job['id']} REMOVE")
        device.feed_line(f"ADMIN {job['id']} PLACE_SECOND")
        device.feed_line(f"ADMIN {job['id']} STORED")

        self.assertEqual(command, f"ADMIN ENROLL {job['id']} 3")
        self.assertEqual(device.get_job(job["id"])["state"], "stored")
        self.assertEqual(completed, [3])

    def test_only_one_admin_job_can_run_at_once(self):
        device = portal.AdminJobDevice()
        device.start_enroll(1, lambda: None)

        with self.assertRaisesRegex(RuntimeError, "already active"):
            device.start_delete(2, lambda: None)

    def test_cancel_marks_job_and_emits_cancel_command(self):
        device = portal.AdminJobDevice()
        job = device.start_enroll(1, lambda: None)
        device.next_command(timeout=0)

        cancelled = device.cancel_job(job["id"])

        self.assertEqual(cancelled["state"], "cancelled")
        self.assertEqual(device.next_command(timeout=0), f"ADMIN CANCEL {job['id']}")


if __name__ == "__main__":
    unittest.main()
