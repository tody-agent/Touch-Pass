import os
import sys
import subprocess
import shutil

project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dist_dir = os.path.join(project_dir, "dist")
rust_dir = os.path.join(project_dir, "software", "rust-helper")
cargo_toml = os.path.join(rust_dir, "Cargo.toml")

print(f"[TouchPass] Building high-performance native Rust executable for Windows...")
print(f"Project directory: {project_dir}")

cmd = ["cargo", "build", "--release", "--manifest-path", cargo_toml]
res = subprocess.run(cmd, cwd=project_dir)
if res.returncode != 0:
    print("[ERROR] Cargo build failed!")
    sys.exit(1)

release_exe = os.path.join(rust_dir, "target", "release", "touchpass-helper.exe")
if not os.path.exists(release_exe):
    print(f"[ERROR] Compiled executable not found at {release_exe}")
    sys.exit(1)

os.makedirs(dist_dir, exist_ok=True)
target_exe = os.path.join(dist_dir, "TouchPass.exe")
shutil.copy2(release_exe, target_exe)

size_mb = os.path.getsize(target_exe) / (1024 * 1024)
print(f"[SUCCESS] Standalone Rust executable generated at: {target_exe}")
print(f"[METRICS] Final Binary Size: {size_mb:.2f} MB")
