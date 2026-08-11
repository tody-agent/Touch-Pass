import importlib.util
import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "tinytouch_portal_http",
    ROOT / "software" / "macos-helper" / "tinytouch_portal.py",
)
portal = importlib.util.module_from_spec(spec)
spec.loader.exec_module(portal)


class StubAPI:
    def dispatch(self, method, path, body, headers):
        if method == "POST" and headers.get("X-CSRF-Token") != "ok":
            return 403, {"error": "request rejected"}
        return 200, {"method": method, "path": path, "body": body}


class PortalHTTPTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tempdir.cleanup)
        assets = Path(self.tempdir.name)
        (assets / "index.html").write_text("<h1>tinyTouch</h1>", encoding="utf-8")
        self.server = portal.create_http_server(StubAPI(), assets, port=0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def test_serves_assets_with_security_headers(self):
        with urllib.request.urlopen(self.base + "/") as response:
            body = response.read().decode()

        self.assertIn("tinyTouch", body)
        self.assertIn("default-src 'self'", response.headers["Content-Security-Policy"])
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    def test_routes_json_api_and_rejects_missing_csrf(self):
        with urllib.request.urlopen(self.base + "/api/status") as response:
            payload = json.loads(response.read())
        self.assertEqual(payload["path"], "/api/status")

        request = urllib.request.Request(
            self.base + "/api/fingers/1/enroll",
            data=b"{}",
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with self.assertRaises(urllib.error.HTTPError) as context:
            urllib.request.urlopen(request)
        self.assertEqual(context.exception.code, 403)
        context.exception.close()


if __name__ == "__main__":
    unittest.main()
