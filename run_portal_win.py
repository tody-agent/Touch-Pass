import argparse
import sys
from pathlib import Path

# Add software/macos-helper path
HELPER_DIR = Path("software/macos-helper").resolve()
if str(HELPER_DIR) not in sys.path:
    sys.path.insert(0, str(HELPER_DIR))

from tinytouch_helper import PREFERRED_SERIAL, run_portal


def main():
    parser = argparse.ArgumentParser(description="TouchPass Web Portal Runner (Windows & Cross-Platform)")
    parser.add_argument("--port", help="Explicit serial COM port (e.g. COM3)")
    parser.add_argument("--device-id", default=PREFERRED_SERIAL, help="Device serial identifier")
    parser.add_argument("--host", default="127.0.0.1", help="Portal host address")
    parser.add_argument("--portal-port", type=int, default=8787, help="Portal HTTP port")
    args = parser.parse_args()

    print(f"Starting TouchPass Web Portal & Hardware Helper Service at http://{args.host}:{args.portal_port}/ ...")
    run_portal(args.port, args.device_id, args.host, args.portal_port)


if __name__ == "__main__":
    main()
