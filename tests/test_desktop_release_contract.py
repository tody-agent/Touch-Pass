import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VERSION = "0.2.0"


class DesktopReleaseContractTests(unittest.TestCase):
    def test_desktop_version_metadata_matches_release_version(self):
        package = json.loads((ROOT / "software" / "desktop-app" / "package.json").read_text(encoding="utf-8"))
        tauri = json.loads((ROOT / "software" / "desktop-app" / "src-tauri" / "tauri.conf.json").read_text(encoding="utf-8"))
        cargo = (ROOT / "software" / "desktop-app" / "src-tauri" / "Cargo.toml").read_text(encoding="utf-8")

        self.assertEqual(package["version"], VERSION)
        self.assertEqual(tauri["version"], VERSION)
        self.assertIn(f'version = "{VERSION}"', cargo)

    def test_release_workflow_builds_all_desktop_platforms(self):
        workflow = (ROOT / ".github" / "workflows" / "release.yml").read_text(encoding="utf-8")

        for platform in ("windows-x64", "macos-arm64", "macos-x64", "linux-x64"):
            self.assertIn(f"platform: {platform}", workflow)
        self.assertIn("checksums.txt", workflow)
        self.assertIn("tag=v0.2.0", workflow)

    def test_release_documentation_links_install_and_first_use_guides(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        changelog = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")

        self.assertIn("docs/DESKTOP_APP_GUIDE.md", readme)
        self.assertIn("docs/DESKTOP_APP_GUIDE.vi.md", readme)
        self.assertIn("[0.2.0]", changelog)
        self.assertTrue((ROOT / "docs" / "DESKTOP_APP_GUIDE.md").is_file())
        self.assertTrue((ROOT / "docs" / "DESKTOP_APP_GUIDE.vi.md").is_file())
