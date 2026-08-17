from pathlib import Path
import unittest
from PIL import Image


class LogoAssetsTests(unittest.TestCase):
    def setUp(self):
        self.repo_root = Path(__file__).resolve().parents[1]
        self.master_icon_path = self.repo_root / "assets" / "logo" / "touchpass-icon-1024.png"

    def test_master_icon_exists_and_valid(self):
        self.assertTrue(self.master_icon_path.exists(), f"Missing master icon at {self.master_icon_path}")
        self.assertGreater(self.master_icon_path.stat().st_size, 10000, "Master icon file size is too small")

        with Image.open(self.master_icon_path) as img:
            self.assertEqual(img.format, "PNG", "Master icon must be in PNG format")
            self.assertEqual(img.size, (1024, 1024), "Master icon dimensions must be exactly 1024x1024")
            self.assertEqual(img.mode, "RGBA", "Master icon color mode must be RGBA")


if __name__ == "__main__":
    unittest.main()
