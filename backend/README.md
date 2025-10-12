# Vistapro - Local Development Setup

## Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Set Up Local Database
```bash
# Start PostgreSQL database
npm run db:start

# Set up database with production schema and data
npm run db:setup
```

### 3. Set Up Environment Files

**Backend** (create `backend/.env`):
```env
DATABASE_URL=your_production_database_url_here
USE_LOCAL_DB=true
LOCAL_DATABASE_URL=postgresql://vistapro_user:vistapro_password@localhost:5433/vistapro_dev
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
COPY_PRODUCTION_DATA=true
# ... other variables as needed
```

**Frontend** (create `frontend/.env.local`):
```env
VITE_API_URL=http://localhost:5000
```

### 4. Start Development
```bash
# Start both services
npm run dev

# Or start individually:
npm run dev:backend    # Backend on port 5000
npm run dev:frontend   # Frontend on port 3000
```

## What This Setup Provides

- ✅ **Local Backend**: Runs on `http://localhost:5000`
- ✅ **Local Frontend**: Runs on `http://localhost:3000`  
- ✅ **Local Database**: PostgreSQL running in Docker with production data copy
- ✅ **PgAdmin Interface**: Web-based database management at `http://localhost:8080`
- ✅ **Hot Reload**: Both services auto-restart on changes
- ✅ **CORS Configured**: Frontend can communicate with backend
- ✅ **Environment Isolation**: Local configs don't affect production
- ✅ **Safe Development**: Work with production data copy without affecting live app

## Important Notes

✅ **SAFE DEVELOPMENT**: You're working with a **LOCAL DATABASE COPY**.
- All changes are isolated to your local environment
- Production database remains completely unaffected
- You can freely experiment with data modifications
- Test migrations and bulk operations safely

## File Structure

```
vistapro/
├── backend/          # Node.js/Express backend
├── frontend/         # React/Vite frontend  
├── docker-compose.yml    # PostgreSQL and PgAdmin setup
├── package.json      # Root package.json for convenience
├── start-local-dev.bat    # Windows batch file
├── start-local-dev.ps1    # PowerShell script
└── LOCAL_DEVELOPMENT_SETUP.md  # Detailed setup guide
```

## Database Management

```bash
# Start local database
npm run db:start

# Stop local database  
npm run db:stop

# Reset database (fresh start)
npm run db:reset

# View database logs
npm run db:logs

# Set up with production data
npm run db:setup
```

## Troubleshooting

- **Port conflicts**: Change ports in environment files
- **Database connection**: Ensure Docker is running and database is started
- **CORS errors**: Check CORS configuration in backend
- **Dependencies**: Run `npm run install:all` to reinstall
- **Database issues**: Use `npm run db:reset` to start fresh

## Development Safety

- Test migrations locally before applying to production
- Experiment freely with data modifications
- Use transactions for complex operations
- Reset database when needed with `npm run db:reset`
- Backup local data if you have important test data

For detailed setup instructions, see [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md)
