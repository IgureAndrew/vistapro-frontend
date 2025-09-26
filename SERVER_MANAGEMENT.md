# Vistapro Server Management System

This document describes the permanent solution for managing Vistapro development servers.

## 🚀 Quick Start

### Option 1: Simple Commands
```powershell
# Start both servers
.\server-manager.ps1 start

# Stop all servers
.\server-manager.ps1 stop

# Restart servers
.\server-manager.ps1 restart

# Check server status
.\server-manager.ps1 status

# Clean start (recommended for troubleshooting)
.\server-manager.ps1 clean
```

### Option 2: Advanced Commands
```powershell
# Start both servers with full control
.\start-servers.ps1

# Clean start (kill all processes first)
.\start-servers.ps1 -Clean

# Start only backend
.\start-servers.ps1 -BackendOnly

# Start only frontend
.\start-servers.ps1 -FrontendOnly
```

## 🔧 What This System Fixes

### Previous Issues:
- ❌ Port conflicts (EADDRINUSE errors)
- ❌ Multiple server instances running
- ❌ Nodemon restarting too frequently
- ❌ No graceful shutdown handling
- ❌ Manual process killing required
- ❌ Inconsistent environment variables

### New Solutions:
- ✅ Automatic port conflict resolution
- ✅ Process management and cleanup
- ✅ Optimized nodemon configuration
- ✅ Graceful shutdown handling
- ✅ Unified environment configuration
- ✅ Health checks and status monitoring

## 📁 Files Created

1. **`start-servers.ps1`** - Main startup script with full control
2. **`server-manager.ps1`** - Simple command interface
3. **`backend/nodemon.json`** - Optimized nodemon configuration
4. **`backend/start-dev-enhanced.js`** - Enhanced server startup with error handling
5. **`config.env`** - Unified environment configuration

## 🛠️ Technical Details

### Nodemon Configuration
- **Watches**: Only `src/**/*`, `server.js`, `start-dev.js`
- **Ignores**: `node_modules`, `frontend`, `logs`, `migrations`
- **Delay**: 2 seconds between restarts
- **Signal**: SIGTERM for graceful shutdown

### Port Management
- **Backend**: Port 5005
- **Frontend**: Port 5173
- **Automatic**: Port conflict detection and resolution
- **Timeout**: 30 seconds maximum wait time

### Environment Variables
- **Unified**: Single configuration file
- **Fallbacks**: Default values for all variables
- **Security**: JWT_SECRET and MASTER_ADMIN_SECRET_KEY included

## 🚨 Troubleshooting

### If servers won't start:
1. Run `.\server-manager.ps1 clean`
2. Check if Docker is running (for database)
3. Verify ports 5005 and 5173 are free

### If you get port conflicts:
1. Run `.\server-manager.ps1 stop`
2. Wait 5 seconds
3. Run `.\server-manager.ps1 start`

### If nodemon keeps restarting:
1. Check `backend/nodemon.json` configuration
2. Ensure you're not editing files in ignored directories
3. Use `.\server-manager.ps1 status` to check server health

## 📊 Server Status

The system provides real-time status information:
- ✅ **Running**: Server is active and responding
- ❌ **Not running**: Server is not active
- ⚠️ **Warning**: Server has issues but is running

## 🔄 Migration from Old System

To migrate from the old system:

1. **Stop old servers**: `taskkill /F /IM node.exe`
2. **Use new commands**: `.\server-manager.ps1 start`
3. **Update your workflow**: Use the new commands instead of `npm run dev`

## 🎯 Benefits

- **Reliability**: Servers start consistently every time
- **Speed**: Faster startup with optimized configuration
- **Debugging**: Better error messages and status information
- **Maintenance**: Automatic cleanup and process management
- **User Experience**: Simple commands for all operations

## 📝 Notes

- The system automatically handles environment variables
- No need to manually set PowerShell environment variables
- All servers run in separate PowerShell windows for better visibility
- The system is designed to work with the existing codebase without modifications
