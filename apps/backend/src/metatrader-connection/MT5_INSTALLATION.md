# MetaTrader5 Installation Guide

## Problem
MetaTrader5 Python package is not compatible with Python 3.14.

## Solutions

### Option 1: Continue Development without MT5 (Current Setup) ✅

The code has been modified to work without MetaTrader5 installed:
- MT5 verification will return an informative error message
- MT4 TCP verification works normally
- You can develop and test the rest of the system

**Test MT4 verification:**
- Use platform: "mt4"
- Provide host/port of any MT4 broker server
- This will check server reachability

### Option 2: Install Compatible Python for MT5 Production

**Requirements:**
- Windows 64-bit
- Python 3.8, 3.9, 3.10, 3.11, or 3.12 (NOT 3.13 or 3.14)
- MetaTrader 5 Terminal installed

**Steps:**

1. **Download Python 3.12:**
   - Visit: https://www.python.org/downloads/release/python-3120/
   - Download "Windows installer (64-bit)"

2. **Install Python 3.12:**
   - Check "Add Python 3.12 to PATH"
   - Choose "Customize installation"
   - Install for all users (optional)

3. **Create Virtual Environment:**
   ```bash
   # Navigate to project
   cd "c:\Users\LENOVO\Documents\Harestech\Script copy trading"
   
   # Create venv with Python 3.12
   py -3.12 -m venv venv-mt5
   
   # Activate
   .\venv-mt5\Scripts\Activate.ps1
   
   # Install MetaTrader5
   pip install MetaTrader5
   ```

4. **Update Backend to Use Virtual Environment:**
   Modify `mt5-adapter.service.ts` to use the venv Python:
   ```typescript
   const pythonProcess = spawn('C:\\Users\\LENOVO\\Documents\\Harestech\\Script copy trading\\venv-mt5\\Scripts\\python.exe', [
       scriptPath,
       // ...
   ]);
   ```

### Option 3: Use pyenv for Multiple Python Versions

Install pyenv-win to manage multiple Python versions:
```bash
# Install pyenv-win
Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/pyenv-win/pyenv-win/master/pyenv-win/install-pyenv-win.ps1" -OutFile "./install-pyenv-win.ps1"; &"./install-pyenv-win.ps1"

# Install Python 3.12
pyenv install 3.12.0

# Use Python 3.12 for this project
cd "c:\Users\LENOVO\Documents\Harestech\Script copy trading"
pyenv local 3.12.0

# Install MetaTrader5
pip install MetaTrader5
```

## Current Status ✅

Your system is now configured to:
- ✅ Work without MetaTrader5 (development mode)
- ✅ Show informative error messages when MT5 is not available
- ✅ Support MT4 verification (TCP check)
- ✅ Allow easy upgrade to MT5 when compatible Python is installed

## Testing

### Test MT4 Verification (Works Now):
1. Go to http://localhost:5173
2. Create a Master/Slave with MetaTrader
3. Select "MetaTrader 4" as platform
4. Fill in:
   - Login: any number
   - Password: any password
   - Server: any server name
   - Host: any broker server (e.g., "demo.broker.com")
   - Port: 443
5. Click "Test Connection"
6. Should verify server reachability

### Test MT5 Verification (When MT5 is installed):
1. Install Python 3.8-3.12
2. Install MetaTrader5 package
3. Use "MetaTrader 5" as platform
4. Use real MT5 demo credentials
5. Should perform full authentication

## Recommended Approach for Your Project

**For Development:** 
- Continue with current setup (Python 3.14)
- Test MT4 TCP verification
- Develop other features

**For Production:**
- Install Python 3.12 in a virtual environment
- Install MetaTrader5 package
- Configure backend to use the venv Python
- Test with real MT5 demo accounts
