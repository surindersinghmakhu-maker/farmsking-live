import sys
import os
import urllib.request
import zipfile

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def download_jdk17():
    jdk_dir = r"d:\FarmsKing\scratch\jdk17"
    os.makedirs(jdk_dir, exist_ok=True)
    zip_path = os.path.join(r"d:\FarmsKing\scratch", "jdk17.zip")

    url = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.10_7.zip"
    
    java_exe = os.path.join(jdk_dir, "jdk-17.0.10+7", "bin", "java.exe")
    if os.path.exists(java_exe):
        print(f"JDK 17 already exists at: {java_exe}")
        return java_exe

    print(f"Downloading OpenJDK 17 from {url} ...")
    try:
        urllib.request.urlretrieve(url, zip_path)
        print("Extracting OpenJDK 17 zip...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(jdk_dir)
        print(f"[SUCCESS] JDK 17 extracted to {jdk_dir}")
        if os.path.exists(zip_path):
            os.remove(zip_path)
        return java_exe
    except Exception as e:
        print(f"Error downloading JDK 17: {e}")
        return None

if __name__ == "__main__":
    download_jdk17()
