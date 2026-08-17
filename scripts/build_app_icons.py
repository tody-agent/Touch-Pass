#!/usr/bin/env python3
"""
TouchPass Desktop App Icon Generator
Generates all multi-resolution icon assets (ICO, ICNS, PNG) for Tauri desktop application
from the master 1024x1024 PNG logo.
"""

from pathlib import Path
from PIL import Image


def generate_app_icons(source_path: Path = None, output_dir: Path = None) -> list[Path]:
    repo_root = Path(__file__).resolve().parents[1]
    if source_path is None:
        source_path = repo_root / "assets" / "logo" / "touchpass-icon-1024.png"
    if output_dir is None:
        output_dir = repo_root / "software" / "desktop-app" / "src-tauri" / "icons"

    if not source_path.exists():
        raise FileNotFoundError(f"Master logo not found: {source_path}")

    output_dir.mkdir(parents=True, exist_ok=True)
    generated_files = []

    with Image.open(source_path) as master_img:
        master_img = master_img.convert("RGBA")

        # 1. Standard PNG sizes
        png_targets = {
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

        for filename, dimensions in png_targets.items():
            dest = output_dir / filename
            resized = master_img.resize(dimensions, Image.Resampling.LANCZOS)
            resized.save(dest, format="PNG", optimize=True)
            generated_files.append(dest)
            print(f"Generated PNG icon: {dest.name} ({dimensions[0]}x{dimensions[1]})")

        # 2. Multi-layer Windows ICO file
        ico_dest = output_dir / "icon.ico"
        ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        master_img.save(ico_dest, format="ICO", sizes=ico_sizes)
        generated_files.append(ico_dest)
        print(f"Generated ICO icon: {ico_dest.name} with sizes: {ico_sizes}")

        # 3. macOS ICNS file
        icns_dest = output_dir / "icon.icns"
        master_img.save(icns_dest, format="ICNS")
        generated_files.append(icns_dest)
        print(f"Generated ICNS icon: {icns_dest.name}")

    return generated_files


def generate_web_icons(source_path: Path = None, web_dirs: list[Path] = None) -> list[Path]:
    repo_root = Path(__file__).resolve().parents[1]
    if source_path is None:
        source_path = repo_root / "assets" / "logo" / "touchpass-icon-1024.png"
    if web_dirs is None:
        web_dirs = [
            repo_root / "web",
            repo_root / "web" / "flasher",
        ]

    if not source_path.exists():
        raise FileNotFoundError(f"Master logo not found: {source_path}")

    generated_files = []

    with Image.open(source_path) as master_img:
        master_img = master_img.convert("RGBA")

        for web_dir in web_dirs:
            web_dir.mkdir(parents=True, exist_ok=True)

            # 1. Web favicon.png (64x64)
            png_dest = web_dir / "favicon.png"
            resized = master_img.resize((64, 64), Image.Resampling.LANCZOS)
            resized.save(png_dest, format="PNG", optimize=True)
            generated_files.append(png_dest)
            print(f"Generated Web Favicon PNG: {png_dest.relative_to(repo_root)} (64x64)")

            # 2. Multi-layer favicon.ico (16, 32, 48)
            ico_dest = web_dir / "favicon.ico"
            ico_sizes = [(16, 16), (32, 32), (48, 48)]
            master_img.save(ico_dest, format="ICO", sizes=ico_sizes)
            generated_files.append(ico_dest)
            print(f"Generated Web Favicon ICO: {ico_dest.relative_to(repo_root)} with sizes: {ico_sizes}")

    return generated_files


def main():
    print("Building TouchPass Tauri desktop application icon set...")
    desktop_files = generate_app_icons()
    print(f"Successfully generated {len(desktop_files)} desktop icon assets.\n")

    print("Building TouchPass Web favicons...")
    web_files = generate_web_icons()
    print(f"Successfully generated {len(web_files)} web icon assets.")


if __name__ == "__main__":
    main()
