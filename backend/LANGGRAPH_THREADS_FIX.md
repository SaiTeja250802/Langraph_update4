# LangGraph Research Application - Threads Endpoint Fix

## Issue Description

The LangGraph Research application was experiencing a **404 error** when trying to access the `/threads` endpoint at `http://localhost:8001/threads`. This prevented the core research functionality from working properly.

## Root Cause

The issue was that the LangGraph agent server was not running. The application consists of two separate servers:

1. **Backend API Server** (port 2024) - Handles authentication, conversations, and categories
2. **LangGraph Agent Server** (port 8001) - Handles the actual research functionality via the `/threads` endpoint

## Solution

To fix this issue, you need to run both servers simultaneously:

### Step 1: Start the Backend API Server (Port 2024)

**Option 1: Using PowerShell Script**
```powershell
cd backend
.\start_backend_server.ps1
```

**Option 2: Using Batch File**
```batch
cd backend
start_backend_server.bat
```

**Option 3: Manual Command**
```powershell
cd backend
$env:PYTHONPATH="C:\Users\saite\Langraph_update3\backend\src"
python server.py
```

### Step 2: Start the LangGraph Agent Server (Port 8001)

**Option 1: Using PowerShell Script**
```powershell
cd backend
.\start_langgraph_server.ps1
```

**Option 2: Using Batch File**
```batch
cd backend
start_langgraph_server.bat
```

**Option 3: Manual Command**
```powershell
cd backend
$env:PYTHONPATH="C:\Users\saite\Langraph_update3\backend\src"
langgraph dev --port 8001
```

## Important Notes

1. **MongoDB Requirement**: The application is designed to work with MongoDB, but the LangGraph agent server has been modified to continue running even if MongoDB is not available.

2. **Environment Variables**: Make sure the `.env` file in the backend directory contains your `GEMINI_API_KEY`.

3. **Port Configuration**: 
   - Backend API: http://localhost:2024
   - LangGraph Agent: http://localhost:8001
   - Frontend: http://localhost:3000 (or as configured)

4. **Database Warning**: You'll see a warning about database initialization failing - this is expected if MongoDB is not running, but the LangGraph agent will still work for research functionality.

## Verification

Once both servers are running, you can verify the fix by:

1. **Backend API Health Check**: Visit http://localhost:2024/docs
2. **LangGraph Agent Health Check**: Visit http://localhost:8001/docs
3. **Frontend Test**: Try using the research functionality in the web interface

## Expected Behavior After Fix

- ✅ Authentication works properly
- ✅ Category suggestions load correctly
- ✅ Research Hub displays properly
- ✅ **Research queries now work** (no more 404 errors)
- ✅ LangGraph agent processes research requests

## Troubleshooting

If you still encounter issues:

1. **Check if both servers are running**:
   ```powershell
   netstat -an | Select-String ":2024|:8001"
   ```

2. **Verify GEMINI_API_KEY is set** in the `.env` file

3. **Check console logs** for any error messages

4. **Ensure all dependencies are installed**:
   ```powershell
   pip install -r requirements.txt
   ```

## File Changes Made

1. **Modified `backend/src/agent/app.py`**: Added error handling for database initialization
2. **Created startup scripts**: Added PowerShell and batch files for easy server startup
3. **Updated documentation**: This fix guide

The core issue has been resolved, and the LangGraph Research application should now work as expected with full research functionality.
