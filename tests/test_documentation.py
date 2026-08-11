import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
README = ROOT / "README.md"
BUILD_GUIDE = ROOT / "docs" / "BUILD_GUIDE.md"
USER_GUIDE = ROOT / "docs" / "USER_GUIDE.md"
APPROVED_IMAGES = {
    "01-hero-showcase-v2.png",
    "02-mac-mini-claude-accept-v2.png",
    "03-login-success.png",
    "04-features.png",
    "05-exploded-view-v3.png",
}


class DocumentationTests(unittest.TestCase):
    def test_required_guides_and_images_exist(self):
        self.assertTrue(BUILD_GUIDE.is_file())
        self.assertTrue(USER_GUIDE.is_file())
        actual = {p.name for p in (ROOT / "assets" / "demo").glob("*.png")}
        self.assertEqual(actual, APPROVED_IMAGES)

    def test_user_guide_has_no_escaped_backticks(self):
        text = USER_GUIDE.read_text(encoding="utf-8")
        self.assertNotIn(r"\`", text)

    def test_readme_routes_and_credits(self):
        text = README.read_text(encoding="utf-8")
        self.assertIn("docs/BUILD_GUIDE.md", text)
        self.assertIn("docs/USER_GUIDE.md", text)
        self.assertIn("ZimengXiong/TinyTouch", text)
        self.assertIn("Give every finger a superpower", text)

    def test_local_markdown_links_resolve(self):
        for document in (README, BUILD_GUIDE, USER_GUIDE):
            text = document.read_text(encoding="utf-8")
            for target in re.findall(r"!?\[[^]]*\]\(([^)]+)\)", text):
                if target.startswith(("http://", "https://", "#")):
                    continue
                path = (document.parent / target.split("#", 1)[0]).resolve()
                self.assertTrue(path.exists(), f"broken link in {document}: {target}")

    def test_safety_limits_are_visible(self):
        combined = "\n".join(
            p.read_text(encoding="utf-8")
            for p in (README, BUILD_GUIDE, USER_GUIDE)
        ).lower()
        self.assertIn("focused", combined)
        self.assertIn("unauthenticated uart", combined)
