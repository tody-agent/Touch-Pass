#!/usr/bin/env python3
"""TouchPass Automated Test Gate Runner."""

from __future__ import annotations

import json
import importlib.util
import py_compile
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent
TESTS_DIR = ROOT / "tests"


def log_stage(stage_num: int, title: str) -> None:
    print(f"\n==================================================")
    print(f"[STAGE {stage_num}] {title}")
    print(f"==================================================")


def check_syntax() -> bool:
    log_stage(1, "Python Source Syntax & Compilation Gate")
    py_files = list(ROOT.glob("*.py")) + list((ROOT / "software").rglob("*.py")) + list(TESTS_DIR.glob("*.py"))
    failed = []
    for file in py_files:
        try:
            py_compile.compile(str(file), doraise=True)
            print(f"  [OK] Syntax check passed: {file.relative_to(ROOT)}")
        except py_compile.PyCompileError as exc:
            print(f"  [ERR] Syntax compile error in {file}: {exc}")
            failed.append(file)
    if failed:
        print(f"\n[FAIL] Syntax Gate failed for {len(failed)} files.")
        return False
    print(f"\n[PASS] Stage 1 Syntax Gate passed cleanly ({len(py_files)} files verified).")
    return True


def unit_test_command() -> list[str]:
    if importlib.util.find_spec("pytest") is not None:
        return [sys.executable, "-m", "pytest", str(TESTS_DIR)]
    return [sys.executable, "-m", "unittest", "discover", "-s", str(TESTS_DIR)]


def run_unit_tests() -> bool:
    log_stage(2, "Unit Test Suite Gate")
    cmd = unit_test_command()
    print(f"Running unit test command: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=str(ROOT))
    if result.returncode != 0:
        print("\n[FAIL] Stage 2 Unit Test Gate failed.")
        return False
    print("\n[PASS] Stage 2 Unit Test Gate passed cleanly.")
    return True


def test_live_api() -> bool:
    log_stage(3, "Live Web Portal & Security API Gate")
    test_port = 8788
    proc = subprocess.Popen(
        [sys.executable, "run_portal_win.py", "--portal-port", str(test_port)],
        cwd=str(ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    time.sleep(2.0)
    try:
        # 1. Fetch /api/status
        req = urllib.request.Request(f"http://127.0.0.1:{test_port}/api/status")
        with urllib.request.urlopen(req, timeout=5) as res:
            status_data = json.loads(res.read().decode("utf-8"))
            csrf_token = status_data.get("csrf_token")
            assert csrf_token is not None, "CSRF token missing"
            print(f"  [OK] /api/status -> connected: {status_data.get('device', {}).get('connected')}")

        # 2. Fetch /api/fingers
        req = urllib.request.Request(f"http://127.0.0.1:{test_port}/api/fingers")
        with urllib.request.urlopen(req, timeout=5) as res:
            fingers_data = json.loads(res.read().decode("utf-8"))
            assert len(fingers_data.get("fingers", [])) == 10, "Fingers count mismatch"
            print(f"  [OK] /api/fingers -> 10 finger slots verified")

        # 3. Fetch /api/logs
        req = urllib.request.Request(f"http://127.0.0.1:{test_port}/api/logs")
        with urllib.request.urlopen(req, timeout=5) as res:
            logs_data = json.loads(res.read().decode("utf-8"))
            print(f"  [OK] /api/logs -> {len(logs_data.get('logs', []))} log entries verified")

        # 4. POST /api/test with CSRF Token
        test_body = json.dumps({"action": "type_test"}).encode("utf-8")
        req_post = urllib.request.Request(
            f"http://127.0.0.1:{test_port}/api/test",
            data=test_body,
            headers={"Content-Type": "application/json", "X-CSRF-Token": csrf_token},
            method="POST",
        )
        with urllib.request.urlopen(req_post, timeout=5) as res:
            test_res = json.loads(res.read().decode("utf-8"))
            assert test_res.get("status") == "ok", "API test status not ok"
            print(f"  [OK] POST /api/test -> action: {test_res.get('action')}")

    except Exception as exc:
        print(f"\n[FAIL] Live API Gate failed: {exc}")
        proc.terminate()
        return False
    finally:
        proc.terminate()
        proc.wait(timeout=3)

    print("\n[PASS] Stage 3 Live Web Portal & API Gate passed cleanly.")
    return True


def test_cli_sanity() -> bool:
    log_stage(4, "CLI Sanity Gate")
    result = subprocess.run([sys.executable, "tinytouch", "--help"], cwd=str(ROOT), capture_output=True, text=True)
    if result.returncode != 0:
        print(f"\n[FAIL] CLI Sanity Gate failed: {result.stderr}")
        return False
    print("  [OK] tinytouch --help executed successfully")
    print("\n[PASS] Stage 4 CLI Sanity Gate passed cleanly.")
    return True


def main() -> None:
    print("==================================================")
    print("[GATE] TouchPass Automated Quality Gate Starting...")
    print("==================================================")

    stages = [
        ("Syntax Gate", check_syntax),
        ("Unit Test Suite Gate", run_unit_tests),
        ("Live API Gate", test_live_api),
        ("CLI Sanity Gate", test_cli_sanity),
    ]

    for name, gate_func in stages:
        if not gate_func():
            print("\n" + "=" * 50)
            print(f"[FAIL] TouchPass Quality Gate FAILED at: {name}")
            print("=" * 50)
            sys.exit(1)

    print("\n" + "=" * 50)
    print("[SUCCESS] ALL TEST GATES PASSED PERFECTLY! Project is release-ready.")
    print("=" * 50)
    sys.exit(0)


if __name__ == "__main__":
    main()
