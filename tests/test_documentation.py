import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
README = ROOT / "README.md"
BUILD_GUIDE = ROOT / "docs" / "BUILD_GUIDE.md"
USER_GUIDE = ROOT / "docs" / "USER_GUIDE.md"
SECURITY = ROOT / "SECURITY.md"
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

    def test_readme_only_promises_supported_keyboard_actions(self):
        text = README.read_text(encoding="utf-8").lower()
        self.assertNotIn("focus switch", text)
        self.assertNotRegex(text, r"\bopen(?:ing)? (?:a |the )?(?:tool|project)\b")
        for action_word in ("text", "key", "delay", "enter", "escape"):
            with self.subTest(action_word=action_word):
                self.assertRegex(text, rf"\b{action_word}\b")

    def test_readme_claude_example_explains_accept_limit(self):
        text = README.read_text(encoding="utf-8")
        image = "02-mac-mini-claude-accept-v2.png"
        self.assertIn(image, text)
        nearby = text[text.index(image) : text.index(image) + 700].lower()
        self.assertRegex(nearby, r"`?y`?\s*(?:\+|followed by|then)\s*(?:return|enter)")
        self.assertRegex(nearby, r"terminal(?:-style)? prompt")
        self.assertRegex(
            nearby,
            r"cannot (?:click|press|activate)[\s\S]{0,40}gui button",
        )

    def test_build_guide_marks_render_conceptual_and_covers_enclosure(self):
        text = BUILD_GUIDE.read_text(encoding="utf-8").lower()
        self.assertIn("conceptual", text)
        self.assertRegex(text, r"80\s*[x×]\s*50\s*[x×]\s*32\s*mm")
        self.assertRegex(text, r"(?:no|not|does not).{0,100}\bcad\b")
        self.assertRegex(text, r"(?:3v3|3\.3 v).{0,100}(?:fan[- ]out|junction|split)")

    def test_build_guide_pairing_setup_is_no_clobber_and_rotation_safe(self):
        text = BUILD_GUIDE.read_text(encoding="utf-8")
        lower = text.lower()
        self.assertIn("first-time only", lower)
        self.assertIn("security find-generic-password", text)
        self.assertIn("B8F862FB478C", text)
        self.assertIn("tinyTouch-pairing", text)
        self.assertRegex(text, r"\bcp\s+-n\b")
        self.assertIn("unset pairing_key", text)
        self.assertRegex(
            lower,
            r"rotat(?:e|ion)[\s\S]{0,500}keychain[\s\S]{0,500}"
            r"secrets\.h[\s\S]{0,500}reflash",
        )

    def test_user_guide_limits_session_unlock_to_logged_in_user(self):
        text = USER_GUIDE.read_text(encoding="utf-8").lower()
        self.assertNotIn("mac login", text)
        self.assertIn("session unlock", text)
        self.assertIn("filevault", text)
        self.assertIn("cold boot", text)
        self.assertIn("after logout", text)
        self.assertRegex(text, r"per-user[\s\S]{0,180}helper[\s\S]{0,180}keychain")

    def test_user_guide_explains_encoded_action_save_limit(self):
        text = USER_GUIDE.read_text(encoding="utf-8").lower()
        self.assertRegex(text, r"16\s+steps")
        self.assertRegex(text, r"256[- ]byte|256 encoded bytes")
        self.assertRegex(text, r"save[\s\S]{0,180}(?:fails|error|reject)")

    def test_local_markdown_links_resolve(self):
        for document in (README, BUILD_GUIDE, USER_GUIDE, SECURITY):
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

    def test_security_md_contents(self):
        security_file = ROOT / "SECURITY.md"
        self.assertTrue(security_file.is_file())
        text = security_file.read_text(encoding="utf-8")
        self.assertIn("Hardware Biometrics", text)
        self.assertIn("HMAC-SHA256", text)
        self.assertIn("OS Credential Store", text)
        self.assertIn("Supported Versions", text)
        self.assertIn("Reporting a Vulnerability", text)
        self.assertIn("AS IS", text)
        self.assertIn("NGUYÊN TRẠNG", text)

