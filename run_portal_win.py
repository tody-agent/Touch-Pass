import argparse
import sys
import threading
import webbrowser
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
    parser.add_argument("--no-browser", action="store_true", default=False, help="Do not auto-open browser")
    args = parser.parse_args()

    portal_url = f"http://{args.host}:{args.portal_port}/"
    print(f"TouchPass Portal running at {portal_url}")

    if not args.no_browser:
        timer = threading.Timer(1.0, webbrowser.open, args=[portal_url])
        timer.daemon = True
        timer.start()

    run_portal(args.port, args.device_id, args.host, args.portal_port)


if __name__ == "__main__":
    main()

