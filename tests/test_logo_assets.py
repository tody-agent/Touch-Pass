from pathlib import Path
import unittest
import xml.etree.ElementTree as ET
from PIL import Image


class LogoAssetsTests(unittest.TestCase):
    def setUp(self):
        self.repo_root = Path(__file__).resolve().parents[1]
        self.logo_dir = self.repo_root / "assets" / "logo"
        self.master_icon_path = self.logo_dir / "touchpass-icon-1024.png"
        self.svg_icon_path = self.logo_dir / "touchpass-icon.svg"
        self.svg_mono_path = self.logo_dir / "touchpass-monochrome.svg"
        self.tray_32_path = self.logo_dir / "touchpass-tray-32.png"
        self.tray_16_path = self.logo_dir / "touchpass-tray-16.png"

    def test_master_icon_exists_and_valid(self):
        self.assertTrue(self.master_icon_path.exists(), f"Missing master icon at {self.master_icon_path}")
        self.assertGreater(self.master_icon_path.stat().st_size, 10000, "Master icon file size is too small")

        with Image.open(self.master_icon_path) as img:
            self.assertEqual(img.format, "PNG", "Master icon must be in PNG format")
            self.assertEqual(img.size, (1024, 1024), "Master icon dimensions must be exactly 1024x1024")
            self.assertEqual(img.mode, "RGBA", "Master icon color mode must be RGBA")

    def test_svg_icon_exists_and_valid(self):
        self.assertTrue(self.svg_icon_path.exists(), f"Missing vector SVG icon at {self.svg_icon_path}")
        self.assertGreater(self.svg_icon_path.stat().st_size, 500, "Vector SVG icon file size is too small")

        tree = ET.parse(self.svg_icon_path)
        root = tree.getroot()
        self.assertTrue(root.tag.endswith("svg"), "Root element must be <svg>")
        self.assertIn("viewBox", root.attrib, "SVG must have a viewBox attribute")
        
        # Verify definitions and gradients exist
        svg_content = self.svg_icon_path.read_text(encoding="utf-8")
        self.assertIn("<linearGradient", svg_content, "SVG icon must contain linearGradient definitions")
        self.assertIn("<radialGradient", svg_content, "SVG icon must contain radialGradient definitions")
        self.assertIn("<path", svg_content, "SVG icon must contain path geometry")

    def test_svg_monochrome_exists_and_valid(self):
        self.assertTrue(self.svg_mono_path.exists(), f"Missing monochrome SVG icon at {self.svg_mono_path}")
        self.assertGreater(self.svg_mono_path.stat().st_size, 200, "Monochrome SVG icon file size is too small")

        tree = ET.parse(self.svg_mono_path)
        root = tree.getroot()
        self.assertTrue(root.tag.endswith("svg"), "Root element must be <svg>")
        self.assertIn("viewBox", root.attrib, "SVG must have a viewBox attribute")

        svg_content = self.svg_mono_path.read_text(encoding="utf-8")
        self.assertIn("<path", svg_content, "Monochrome SVG must contain path geometry")

    def test_tray_icon_32_exists_and_valid(self):
        self.assertTrue(self.tray_32_path.exists(), f"Missing 32x32 tray icon at {self.tray_32_path}")

        with Image.open(self.tray_32_path) as img:
            self.assertEqual(img.format, "PNG", "Tray icon 32 must be in PNG format")
            self.assertEqual(img.size, (32, 32), "Tray icon 32 dimensions must be 32x32")
            self.assertEqual(img.mode, "RGBA", "Tray icon 32 color mode must be RGBA")
            
            # Check transparency / non-empty alpha
            alpha_extrema = img.getextrema()[3]
            self.assertGreater(alpha_extrema[1], 0, "Tray icon 32 must have non-transparent pixels")

    def test_tray_icon_16_exists_and_valid(self):
        self.assertTrue(self.tray_16_path.exists(), f"Missing 16x16 tray icon at {self.tray_16_path}")

        with Image.open(self.tray_16_path) as img:
            self.assertEqual(img.format, "PNG", "Tray icon 16 must be in PNG format")
            self.assertEqual(img.size, (16, 16), "Tray icon 16 dimensions must be 16x16")
            self.assertEqual(img.mode, "RGBA", "Tray icon 16 color mode must be RGBA")

            # Check transparency / non-empty alpha
            alpha_extrema = img.getextrema()[3]
            self.assertGreater(alpha_extrema[1], 0, "Tray icon 16 must have non-transparent pixels")


if __name__ == "__main__":
    unittest.main()
