# Flood Assessment App - Developer Setup Guide

## Prerequisites

### Required
- **.NET SDK 8.0** or later
  - Download from: https://dotnet.microsoft.com/download
  - Verify installation: `dotnet --version`
- **Node.js 18+** with npm
  - Download from: https://nodejs.org/
  - Verify installation: `node --version` and `npm --version`
- **Git** (for version control)
- **VS Code** (recommended) or any text/IDE editor

### System Requirements
- Windows 10+, macOS, or Linux
- At least 2GB free disk space
- Modern browser (Chrome, Edge, Firefox, Safari)

---

## Initial Setup

### 1. Clone / Open the Repository
```bash
# Navigate to the project root
cd "\References\Flood-Assessment"
```

### 2. Backend Setup (.NET Server)

#### Install Dependencies
```bash
# The .NET SDK automatically restores NuGet packages
cd Flood-Assessment.Server
```

#### Configure (Optional)
- **Development settings**: Review `Flood-Assessment.Server/appsettings.Development.json`
- **CORS settings**: API port defaults to `http://localhost:5113` (HTTP) and `https://localhost:7210` (HTTPS)

---

## Running the Application

### Option A: Run Both Backend & Frontend Together (Recommended)

#### Terminal 1 - Start Backend
```bash
cd Flood-Assessment.Server
dotnet run
```

**Expected output:**
```
Building...
info: Microsoft.AspNetCore.Hosting.Diagnostics[1]
      Now listening on: https://localhost:7210
      Now listening on: http://localhost:5113
      Application started. Press Ctrl+C to exit.
```

Leave this terminal running.

#### Terminal 2 - Start Frontend
```bash
cd flood-assessment.client
npm ci                    # Clean install (installs exact versions from package-lock.json)
npm run dev               # Start Vite dev server
```

**Expected output:**
```
VITE v<version> ready in <time> ms

➜  Local:   http://localhost:5173/
➜  Press h to show help
```

#### Open in Browser
- Open **http://localhost:5173** in your browser
- The app should load successfully

---

### Option B: Run Backend Only (API Testing)

```bash
cd Flood-Assessment.Server
dotnet run
```

API endpoints:
- `GET /api/assessment` - Retrieve all assessments
- `POST /api/assessment` - Submit assessment records

Test with tools like:
- **cURL**: `curl http://localhost:5113/api/assessment`
- **Postman**: Import the API URL
- **VS Code REST Client**: Create `.http` files with requests

---

### Option C: Run Frontend Only (Static Testing)

```bash
cd flood-assessment.client
npm ci
npm run dev
```

Note: Sync operations will fail if backend is not running, but offline functionality works.

---

## Build for Production

### Build Backend
```bash
cd Flood-Assessment.Server
dotnet build --configuration Release
```

Output: `Flood-Assessment.Server/bin/Release/net8.0/`

### Build Frontend
```bash
cd flood-assessment.client
npm run build
```

Output: `flood-assessment.client/dist/`

---

## Common Tasks

### Install a New NPM Package
```bash
cd flood-assessment.client
npm install <package-name>
```

### Restore NuGet Packages Manually
```bash
cd Flood-Assessment.Server
dotnet restore
```

### Run Tests (if configured)
```bash
dotnet test Flood-Assessment.Server
```

### Clean Build Artifacts
```bash
# .NET
cd Flood-Assessment.Server
dotnet clean

# Node
cd flood-assessment.client
rm -r node_modules dist
```

---

## Troubleshooting

### Backend won't start
- **Port already in use**: Change port in `launchSettings.json` or kill the process using the port
- **HTTPS certificate error**: Trust the .NET development certificate:
  ```bash
  dotnet dev-certs https --trust
  ```
- **NuGet restore fails**: Check internet connection and `NuGet.Config`

### Frontend won't start
- **npm ci fails**: Delete `node_modules` and `package-lock.json`, then run `npm install`
- **Port 5173 in use**: Vite will automatically use 5174+ if 5173 is taken
- **API requests fail**: Ensure backend is running on `http://localhost:5113`

### CORS or Proxy Issues
- Frontend proxies API calls via `vite.config.js`
- Verify proxy configuration points to correct backend URL
- Check browser console for network errors

### Geolocation not working
- App requires HTTPS or localhost to request geolocation
- Ensure "Allow location access" permission is granted in browser
- Firefox: Check `about:config` → `geo.enabled`

---

## Project Structure

```
Flood-Assessment/
├── Flood-Assessment.Server/          # ASP.NET Core backend
│   ├── Controllers/
│   ├── Services/
│   ├── Repositories/
│   ├── DTOs/
│   ├── Model/
│   ├── Program.cs
│   └── appsettings.json
├── flood-assessment.client/          # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js                    # API service layer
│   │   ├── db.js                     # IndexedDB management
│   │   ├── location.js               # Geolocation service
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── README.md                         # Project overview
└── SETUP.md                          # This file
```

---

## Key Configuration Files

### Backend: `appsettings.json`
- Database connection strings (if applicable)
- Logging level
- CORS policy settings

### Frontend: `vite.config.js`
- API proxy configuration
- Dev server port
- Build output directory

### Frontend: `package.json`
- npm dependencies
- Scripts: `dev`, `build`, `preview`

---

## First-Time Demo Flow

1. **Start backend** (Terminal 1)
2. **Start frontend** (Terminal 2)
3. **Open browser** at `http://localhost:5173`
4. **Fill in form**:
   - Grant location permission
   - Enter address, condition, chicken count
   - Add photos (camera or upload)
5. **Click "Save Offline"** to store locally
6. **Simulate offline** (DevTools → Network → Offline)
7. **Add more records** while offline
8. **Go online** and **click "Sync"** to upload records

---

## Next Steps

- Review [README.md](README.md) for architecture overview
- Check backend code: `Flood-Assessment.Server/Controllers/AssessmentController.cs`
- Check frontend code: `flood-assessment.client/src/App.jsx`
- Explore offline storage: `flood-assessment.client/src/db.js`

---

## Need Help?

- **npm issues**: `npm cache clean --force` then reinstall
- **dotnet issues**: `dotnet nuget locals all --clear`
- **Port conflicts**: Find and kill processes on ports 5113 or 5173
- **Documentation**: See README.md for architecture and business context
