import importlib.util
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "tinytouch_portal_api",
    ROOT / "software" / "macos-helper" / "tinytouch_portal.py",
)
portal = importlib.util.module_from_spec(spec)
spec.loader.exec_module(portal)


class FakeSecrets:
    def __init__(self):
        self.values = {}

    def set(self, reference, value):
        self.values[reference] = value

    def get(self, reference):
        return self.values[reference]

    def delete(self, reference):
        self.values.pop(reference, None)


class FakeDevice:
    def __init__(self):
        self.jobs = {}

    def status(self):
        return {"connected": True, "sensor": "ok", "port": "/dev/cu.usbmodem1"}

    def start_enroll(self, slot, on_success):
        job = {"id": "enroll-1", "kind": "enroll", "slot": slot, "state": "stored"}
        self.jobs[job["id"]] = job
        on_success()
        return job

    def start_delete(self, slot, on_success):
        job = {"id": "delete-1", "kind": "delete", "slot": slot, "state": "deleted"}
        self.jobs[job["id"]] = job
        on_success()
        return job

    def get_job(self, job_id):
        return self.jobs.get(job_id)

    def cancel_job(self, job_id):
        job = self.jobs[job_id]
        job["state"] = "cancelled"
        return job


class PortalAPITests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tempdir.cleanup)
        self.store = portal.ProfileStore(
            Path(self.tempdir.name) / "profiles.json",
            FakeSecrets(),
        )
        self.device = FakeDevice()
        self.api = portal.PortalAPI(self.store, self.device, csrf_token="test-token")
        self.host = {"Host": "127.0.0.1:8787"}
        self.write_headers = {**self.host, "X-CSRF-Token": "test-token"}

    def test_lists_exactly_ten_finger_slots(self):
        status, payload = self.api.dispatch("GET", "/api/fingers", {}, self.host)

        self.assertEqual(status, 200)
        self.assertEqual(len(payload["fingers"]), 10)

    def test_mutation_requires_valid_host_and_csrf(self):
        body = {"label": "Codex", "action": {"preset": "accept"}}

        self.assertEqual(self.api.dispatch("PUT", "/api/fingers/1", body, self.host)[0], 403)
        hostile = {"Host": "evil.example", "X-CSRF-Token": "test-token"}
        self.assertEqual(self.api.dispatch("PUT", "/api/fingers/1", body, hostile)[0], 403)

    def test_updates_profile_and_enrolls_slot(self):
        update_status, updated = self.api.dispatch(
            "PUT",
            "/api/fingers/1",
            {"label": "Codex Accept", "action": {"preset": "accept"}},
            self.write_headers,
        )
        enroll_status, job = self.api.dispatch(
            "POST", "/api/fingers/1/enroll", {}, self.write_headers
        )

        self.assertEqual(update_status, 200)
        self.assertEqual(updated["finger"]["label"], "Codex Accept")
        self.assertEqual(enroll_status, 202)
        self.assertEqual(job["job"]["state"], "stored")
        self.assertTrue(self.store.list_profiles()[0]["enrolled"])

    def test_delete_clears_sensor_and_profile(self):
        self.store.update_profile(2, {"label": "Claude", "action": {"preset": "enter"}})
        self.store.set_enrolled(2, True)

        status, payload = self.api.dispatch(
            "DELETE", "/api/fingers/2", {}, self.write_headers
        )

        self.assertEqual(status, 202)
        self.assertEqual(payload["job"]["state"], "deleted")
        self.assertFalse(self.store.list_profiles()[1]["enrolled"])

    def test_second_admin_job_returns_conflict(self):
        self.device.start_enroll = lambda _slot, _callback: (_ for _ in ()).throw(
            RuntimeError("an admin job is already active")
        )

        status, payload = self.api.dispatch(
            "POST", "/api/fingers/2/enroll", {}, self.write_headers
        )

        self.assertEqual(status, 409)
        self.assertIn("already active", payload["error"])


if __name__ == "__main__":
    unittest.main()
