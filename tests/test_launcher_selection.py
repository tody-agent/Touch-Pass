from pathlib import Path
import unittest


class WindowsLauncherSelectionTests(unittest.TestCase):
    launcher = (Path(__file__).resolve().parents[1] / "start_touchpass.bat").read_text(
        encoding="utf-8"
    ).lower()

    def test_native_tauri_binary_is_selected_before_legacy_paths(self):
        release = self.launcher.index(
            "software\\desktop-app\\src-tauri\\target\\release\\touchpass-desktop.exe"
        )
        debug = self.launcher.index(
            "software\\desktop-app\\src-tauri\\target\\debug\\touchpass-desktop.exe"
        )
        self.assertLess(release, debug)

    def test_default_launcher_does_not_start_legacy_web_portal(self):
        self.assertNotIn("run_portal_win.py", self.launcher)
        self.assertNotIn("dist\\touchpass.exe", self.launcher)


if __name__ == "__main__":
    unittest.main()
