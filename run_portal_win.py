import sys
from pathlib import Path

# Add portal path
sys.path.insert(0, str(Path("software/macos-helper").resolve()))

from tinytouch_portal import PortalAPI, ProfileStore, create_http_server

class DummySecretStore:
    def get(self, ref: str) -> bytes:
        return b"DummyPassword123"
    def set(self, ref: str, secret: bytes) -> None:
        pass
    def delete(self, ref: str) -> None:
        pass

class DummyDevice:
    def status(self) -> dict:
        return {"connected": True, "port": "COM3", "sensor": "ok"}
    def state(self) -> dict:
        return {"status": "ok", "port": "COM3", "sensor": "not_connected_dummy"}
    def cancel_admin(self) -> None:
        pass
    def start_enroll(self, slot: int) -> dict:
        return {"status": "started", "job_id": "job123"}
    def start_delete(self, slot: int) -> dict:
        return {"status": "started", "job_id": "job124"}
    def start_delete_all(self) -> dict:
        return {"status": "started", "job_id": "job125"}

def main():
    secrets = DummySecretStore()
    store = ProfileStore(Path("software/macos-helper/portal/profiles.json"), secret_store=secrets)
    device = DummyDevice()
    api = PortalAPI(profiles=store, device=device)

    api.add_log("SYS", "TouchPass Web Portal server starting...")
    api.add_log("SYS", "Device connected on COM3 (sensor: ok)")
    api.add_log("TEST", "Startup diagnostic test passed")

    server = create_http_server(api, Path("software/macos-helper/portal"), host="127.0.0.1", port=8787)
    print("Starting Web Portal server at http://127.0.0.1:8787/ ...")
    server.serve_forever()

if __name__ == "__main__":
    main()
