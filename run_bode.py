import subprocess
import webbrowser
import time
import os
import sys

# CONFIGURATION
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
BACKEND_DIR = os.path.join(BASE_DIR, "source")
FRONTEND_URL = "http://localhost:3000"

BACKEND_CMD = [sys.executable, "-m", "uvicorn", "main:app", "--reload"]
FRONTEND_CMD = ["npm", "run", "dev"]

def run():
    try:
        # Start FastAPI backend
        print("[+] Starting FastAPI backend...")
        backend_proc = subprocess.Popen(BACKEND_CMD, cwd=BACKEND_DIR)

        # Start React frontend
        print("[+] Starting frontend...")
        frontend_proc = subprocess.Popen(FRONTEND_CMD, cwd=FRONTEND_DIR, shell=True)

        # Wait and open browser
        time.sleep(3)
        print(f"[+] Opening browser at {FRONTEND_URL}")
        webbrowser.open(FRONTEND_URL)

        # Keep alive
        backend_proc.wait()
        frontend_proc.wait()

    except KeyboardInterrupt:
        print("\n[!] Shutting down...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("[x] Servers terminated.")

if __name__ == "__main__":
    run()
