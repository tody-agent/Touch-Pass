import os
import sys
import subprocess
import shutil

project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dist_dir = os.path.join(project_dir, "dist")
portal_dir = os.path.join(project_dir, "software", "macos-helper", "portal")

print(f"Building standalone Windows binary for TouchPass...")
print(f"Project dir: {project_dir}")

cmd = [
    sys.executable, "-m", "PyInstaller",
    "--noconfirm",
    "--clean",
    "--onefile",
    "--name", "TouchPass",
    "--add-data", f"{portal_dir};software/macos-helper/portal",
    "--paths", os.path.join(project_dir, "software", "macos-helper"),
    os.path.join(project_dir, "run_portal_win.py")
]

subprocess.run([sys.executable, "-m", "pip", "install", "-q", "pyinstaller"], check=True)
subprocess.run(cmd, check=True)

exe_path = os.path.join(dist_dir, "TouchPass.exe")
if os.path.exists(exe_path):
    print(f"Successfully built standalone executable at: {exe_path}")
else:
    print(f"Build failed, executable not found at: {exe_path}")
    sys.exit(1)
