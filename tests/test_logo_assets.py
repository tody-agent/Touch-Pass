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
        self.tauri_icons_dir = self.repo_root / "software" / "desktop-app" / "src-tauri" / "icons"
        self.web_dir = self.repo_root / "web"
        self.web_flasher_dir = self.repo_root / "web" / "flasher"

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

    def test_tauri_desktop_png_icons(self):
        png_expected_sizes = {
            "icon.png": (512, 512),
            "32x32.png": (32, 32),
            "128x128.png": (128, 128),
            "128x128@2x.png": (256, 256),
            "Square30x30Logo.png": (30, 30),
            "Square44x44Logo.png": (44, 44),
            "Square71x71Logo.png": (71, 71),
            "Square89x89Logo.png": (89, 89),
            "Square107x107Logo.png": (107, 107),
            "Square142x142Logo.png": (142, 142),
            "Square150x150Logo.png": (150, 150),
            "Square310x310Logo.png": (310, 310),
            "StoreLogo.png": (50, 50),
        }

        for filename, expected_dim in png_expected_sizes.items():
            icon_file = self.tauri_icons_dir / filename
            self.assertTrue(icon_file.exists(), f"Missing desktop icon: {filename}")
            self.assertGreater(icon_file.stat().st_size, 100, f"File too small: {filename}")

            with Image.open(icon_file) as img:
                self.assertEqual(img.format, "PNG", f"Expected PNG format for {filename}")
                self.assertEqual(img.size, expected_dim, f"Incorrect dimensions for {filename}")
                self.assertEqual(img.mode, "RGBA", f"Expected RGBA mode for {filename}")

    def test_tauri_desktop_ico_icon(self):
        ico_file = self.tauri_icons_dir / "icon.ico"
        self.assertTrue(ico_file.exists(), "Missing icon.ico in src-tauri/icons")
        self.assertGreater(ico_file.stat().st_size, 10000, "icon.ico size is too small")

        with Image.open(ico_file) as img:
            self.assertEqual(img.format, "ICO", "Expected ICO format for icon.ico")
            self.assertTrue(hasattr(img, "ico"), "Expected ICO image plugin metadata")
            sizes = img.ico.sizes()
            required_sizes = {(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)}
            for req in required_sizes:
                self.assertIn(req, sizes, f"ICO missing required size layer {req}")

    def test_tauri_desktop_icns_icon(self):
        icns_file = self.tauri_icons_dir / "icon.icns"
        self.assertTrue(icns_file.exists(), "Missing icon.icns in src-tauri/icons")
        self.assertGreater(icns_file.stat().st_size, 50000, "icon.icns size is too small")

        with Image.open(icns_file) as img:
            self.assertEqual(img.format, "ICNS", "Expected ICNS format for icon.icns")

    def test_web_favicons_png(self):
        for parent_dir in (self.web_dir, self.web_flasher_dir):
            favicon_png = parent_dir / "favicon.png"
            self.assertTrue(favicon_png.exists(), f"Missing favicon.png at {favicon_png}")
            self.assertGreater(favicon_png.stat().st_size, 100, f"Favicon PNG too small at {favicon_png}")

            with Image.open(favicon_png) as img:
                self.assertEqual(img.format, "PNG", f"Expected PNG format for {favicon_png}")
                self.assertEqual(img.size, (64, 64), f"Expected 64x64 dimensions for {favicon_png}")
                self.assertEqual(img.mode, "RGBA", f"Expected RGBA mode for {favicon_png}")

    def test_web_favicons_ico(self):
        for parent_dir in (self.web_dir, self.web_flasher_dir):
            favicon_ico = parent_dir / "favicon.ico"
            self.assertTrue(favicon_ico.exists(), f"Missing favicon.ico at {favicon_ico}")
            self.assertGreater(favicon_ico.stat().st_size, 1000, f"Favicon ICO too small at {favicon_ico}")

            with Image.open(favicon_ico) as img:
                self.assertEqual(img.format, "ICO", f"Expected ICO format for {favicon_ico}")
                self.assertTrue(hasattr(img, "ico"), f"Expected ICO metadata for {favicon_ico}")
                sizes = img.ico.sizes()
                for req in [(16, 16), (32, 32), (48, 48)]:
                    self.assertIn(req, sizes, f"Favicon ICO missing required size layer {req} in {favicon_ico}")


if __name__ == "__main__":
    unittest.main()
