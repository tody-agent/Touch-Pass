import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Root docs
README = ROOT / "README.md"
README_VI = ROOT / "README.vi.md"
README_ZH = ROOT / "README.zh.md"
README_RU = ROOT / "README.ru.md"

SECURITY = ROOT / "SECURITY.md"
SECURITY_VI = ROOT / "SECURITY.vi.md"
SECURITY_ZH = ROOT / "SECURITY.zh.md"
SECURITY_RU = ROOT / "SECURITY.ru.md"

# Guides in docs/
BUILD_GUIDE = ROOT / "docs" / "BUILD_GUIDE.md"
BUILD_GUIDE_VI = ROOT / "docs" / "BUILD_GUIDE.vi.md"
BUILD_GUIDE_ZH = ROOT / "docs" / "BUILD_GUIDE.zh.md"
BUILD_GUIDE_RU = ROOT / "docs" / "BUILD_GUIDE.ru.md"

USER_GUIDE = ROOT / "docs" / "USER_GUIDE.md"
USER_GUIDE_VI = ROOT / "docs" / "USER_GUIDE.vi.md"
USER_GUIDE_ZH = ROOT / "docs" / "USER_GUIDE.zh.md"
USER_GUIDE_RU = ROOT / "docs" / "USER_GUIDE.ru.md"

AI_AGENT_PROMPT = ROOT / "docs" / "AI_AGENT_PROMPT.md"
AI_AGENT_PROMPT_VI = ROOT / "docs" / "AI_AGENT_PROMPT.vi.md"
AI_AGENT_PROMPT_ZH = ROOT / "docs" / "AI_AGENT_PROMPT.zh.md"
AI_AGENT_PROMPT_RU = ROOT / "docs" / "AI_AGENT_PROMPT.ru.md"

ALL_DOCS = [
    README, README_VI, README_ZH, README_RU,
    SECURITY, SECURITY_VI, SECURITY_ZH, SECURITY_RU,
    BUILD_GUIDE, BUILD_GUIDE_VI, BUILD_GUIDE_ZH, BUILD_GUIDE_RU,
    USER_GUIDE, USER_GUIDE_VI, USER_GUIDE_ZH, USER_GUIDE_RU,
    AI_AGENT_PROMPT, AI_AGENT_PROMPT_VI, AI_AGENT_PROMPT_ZH, AI_AGENT_PROMPT_RU
]

APPROVED_IMAGES = {
    "01-hero-showcase-v2.png",
    "02-mac-mini-claude-accept-v2.png",
    "03-login-success.png",
    "04-features.png",
    "05-exploded-view-v3.png",
}


class DocumentationTests(unittest.TestCase):
    def test_all_16_multilingual_docs_exist(self):
        for doc in ALL_DOCS:
            with self.subTest(doc=doc.name):
                self.assertTrue(doc.is_file(), f"Missing required document: {doc}")

        actual_images = {p.name for p in (ROOT / "assets" / "demo").glob("*.png")}
        self.assertEqual(actual_images, APPROVED_IMAGES)

    def test_user_guide_has_no_escaped_backticks(self):
        text = USER_GUIDE.read_text(encoding="utf-8")
        self.assertNotIn(r"\`", text)

    def test_readme_routes_and_credits(self):
        for readme_file in (README, README_VI, README_ZH, README_RU):
            with self.subTest(readme=readme_file.name):
                text = readme_file.read_text(encoding="utf-8")
                self.assertIn("BUILD_GUIDE", text)
                self.assertIn("USER_GUIDE", text)
                self.assertIn("Zimeng", text)
                self.assertIn("TinyTouch", text)

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

    def test_build_guide_marks_render_conceptual_and_covers_enclosure(self):
        text = BUILD_GUIDE.read_text(encoding="utf-8").lower()
        self.assertIn("conceptual", text)
        self.assertRegex(text, r"80\s*[x×]\s*50\s*[x×]\s*32\s*mm")

    def test_local_markdown_links_resolve(self):
        for document in ALL_DOCS:
            text = document.read_text(encoding="utf-8")
            for target in re.findall(r"!?\[[^]]*\]\(([^)]+)\)", text):
                if target.startswith(("http://", "https://", "#")):
                    continue
                path = (document.parent / target.split("#", 1)[0]).resolve()
                self.assertTrue(path.exists(), f"broken link in {document.name}: {target}")

    def test_security_md_multilingual_contents(self):
        for sec_file in (SECURITY, SECURITY_VI, SECURITY_ZH, SECURITY_RU):
            with self.subTest(security_file=sec_file.name):
                text = sec_file.read_text(encoding="utf-8")
                self.assertIn("HMAC-SHA256", text)
                self.assertIn("TinyTouch", text)
                self.assertIn("Zimeng Xiong", text)

    def test_disclaimer_embedded_in_docs(self):
        for doc_path in (README, README_VI, README_ZH, README_RU, USER_GUIDE, USER_GUIDE_VI, USER_GUIDE_ZH, USER_GUIDE_RU):
            with self.subTest(doc=doc_path.name):
                text = doc_path.read_text(encoding="utf-8")
                self.assertTrue(
                    "AS IS" in text or "NGUYÊN TRẠNG" in text or "原样" in text or "как есть" in text.lower(),
                    f"Disclaimer missing in {doc_path.name}"
                )

    def test_ai_agent_prompt_docs_contents(self):
        for prompt_file in (AI_AGENT_PROMPT, AI_AGENT_PROMPT_VI, AI_AGENT_PROMPT_ZH, AI_AGENT_PROMPT_RU):
            with self.subTest(prompt_file=prompt_file.name):
                text = prompt_file.read_text(encoding="utf-8")
                self.assertIn("Claude Code", text)
                self.assertIn("Cursor", text)
                self.assertIn("Antigravity", text)
                self.assertIn("https://tody-agent.github.io/Touch-Pass/web/flasher/", text)
                self.assertIn("http://127.0.0.1:8787/", text)
