#!/usr/bin/env python3
"""
TouchPass Desktop App & Web Icon Generator
Processes master raw logos (crops white background/borders with subpixel edge matting)
and generates all multi-resolution icon assets (ICO, ICNS, PNG) for macOS, Windows, Linux,
Tray, and Web applications.
"""

from pathlib import Path
from PIL import Image
import numpy as np
import scipy.ndimage as ndi


def extract_and_crop_master(
    raw_source_path: Path,
    target_master_path: Path,
    target_size: tuple[int, int] = (1024, 1024)
) -> Path:
    """
    Extracts the foreground app icon from a raw image by removing the connected outer
    white/near-white background and border, applying anti-aliased alpha matting on the edges
    to eliminate color fringing, and tightly centering in a square master canvas.
    """
    if not raw_source_path.exists():
        raise FileNotFoundError(f"Raw source image not found: {raw_source_path}")

    target_master_path.parent.mkdir(parents=True, exist_ok=True)

    img = Image.open(raw_source_path).convert("RGBA")
    arr = np.array(img, dtype=float)

    # 1. Background segmentation via border-connected flood fill
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    dist_from_white = np.sqrt((255.0 - r) ** 2 + (255.0 - g) ** 2 + (255.0 - b) ** 2)

    # High-confidence background seed connected to image borders
    seed_bg = dist_from_white < 20.0
    labeled, _ = ndi.label(seed_bg)
    borders = np.concatenate([labeled[0, :], labeled[-1, :], labeled[:, 0], labeled[:, -1]])
    border_labels = set(np.unique(borders))
    border_labels.discard(0)

    outer_bg = np.isin(labeled, list(border_labels))

    # 2. Dilate outer background by 3 pixels to find the anti-aliased edge transition zone
    struct = ndi.generate_binary_structure(2, 2)
    outer_bg_dilated = ndi.binary_dilation(outer_bg, structure=struct, iterations=3)
    edge_zone = outer_bg_dilated & (~outer_bg)

    # 3. Calculate continuous alpha and de-fringe colors against white
    alpha = np.ones((arr.shape[0], arr.shape[1]), dtype=float)
    alpha[outer_bg] = 0.0

    result_arr = arr.copy()

    for y, x in zip(*np.where(edge_zone)):
        pix = arr[y, x, :3]
        dist = dist_from_white[y, x]
        if dist < 6.0:
            a = 0.0
        elif dist < 25.0:
            a = ((dist - 6.0) / 19.0) ** 1.3 * 0.35
        else:
            a = np.clip(1.0 - np.min(pix) / 255.0, 0.0, 1.0)

        alpha[y, x] = a
        if a > 0.05:
            # Un-premultiply color against white (255, 255, 255) to remove halo
            unmixed = (pix - 255.0 * (1.0 - a)) / a
            result_arr[y, x, :3] = np.clip(unmixed, 0, 255)
        else:
            alpha[y, x] = 0.0

    result_arr[:, :, 3] = np.clip(alpha * 255.0, 0, 255)
    uint_arr = result_arr.astype(np.uint8)

    # 4. Find bounding box of non-zero alpha pixels
    nz_y, nz_x = np.where(uint_arr[:, :, 3] > 0)
    if len(nz_y) == 0:
        raise ValueError("No non-background pixels found in raw source image.")

    min_y, max_y = nz_y.min(), nz_y.max()
    min_x, max_x = nz_x.min(), nz_x.max()

    # 5. Tight crop and center on square transparent canvas
    cropped = Image.fromarray(uint_arr[min_y : max_y + 1, min_x : max_x + 1], "RGBA")
    w, h = cropped.size
    dim = max(w, h)

    square_icon = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    square_icon.paste(cropped, ((dim - w) // 2, (dim - h) // 2))

    # 6. Resize to master resolution with Lanczos resampling
    master_img = square_icon.resize(target_size, Image.Resampling.LANCZOS)
    master_img.save(target_master_path, format="PNG", optimize=True)
    print(f"Master icon successfully created: {target_master_path} ({target_size[0]}x{target_size[1]})")

    return target_master_path


def generate_app_icons(source_path: Path = None, output_dir: Path = None) -> list[Path]:
    """Generates all standard macOS, Windows, and Linux desktop icons."""
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

        # 1. Standard PNG sizes for Linux, macOS, Windows AppX/MSIX & Taskbar
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

        # 2. Multi-layer Windows ICO file (16x16 to 256x256)
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


def generate_tray_icons(source_path: Path = None, logo_dir: Path = None) -> list[Path]:
    """Generates 16x16 and 32x32 tray icons for Windows system tray and macOS menu bar."""
    repo_root = Path(__file__).resolve().parents[1]
    if source_path is None:
        source_path = repo_root / "assets" / "logo" / "touchpass-icon-1024.png"
    if logo_dir is None:
        logo_dir = repo_root / "assets" / "logo"

    if not source_path.exists():
        raise FileNotFoundError(f"Master logo not found: {source_path}")

    generated_files = []
    with Image.open(source_path) as master_img:
        master_img = master_img.convert("RGBA")

        tray_targets = {
            "touchpass-tray-32.png": (32, 32),
            "touchpass-tray-16.png": (16, 16),
        }

        for filename, dimensions in tray_targets.items():
            dest = logo_dir / filename
            resized = master_img.resize(dimensions, Image.Resampling.LANCZOS)
            resized.save(dest, format="PNG", optimize=True)
            generated_files.append(dest)
            print(f"Generated Tray Icon: {dest.name} ({dimensions[0]}x{dimensions[1]})")

    return generated_files


def generate_web_icons(source_path: Path = None, web_dirs: list[Path] = None) -> list[Path]:
    """Generates web and web flasher favicon assets."""
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
    repo_root = Path(__file__).resolve().parents[1]
    raw_source = repo_root / "assets" / "logo" / "newlogo.png.png"
    master_icon = repo_root / "assets" / "logo" / "touchpass-icon-1024.png"

    if raw_source.exists():
        print("Extracting and cropping master 1024x1024 icon from newlogo.png.png...")
        extract_and_crop_master(raw_source, master_icon)
    else:
        print("Using existing master 1024x1024 icon...")

    print("\nBuilding TouchPass Tauri desktop application icon set (macOS, Windows, Linux)...")
    desktop_files = generate_app_icons(master_icon)
    print(f"Successfully generated {len(desktop_files)} desktop icon assets.\n")

    print("Building TouchPass Tray icons (16x16, 32x32)...")
    tray_files = generate_tray_icons(master_icon)
    print(f"Successfully generated {len(tray_files)} tray icon assets.\n")

    print("Building TouchPass Web favicons...")
    web_files = generate_web_icons(master_icon)
    print(f"Successfully generated {len(web_files)} web icon assets.\n")

    print("All app icon assets generated successfully!")


if __name__ == "__main__":
    main()
