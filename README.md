# Flood Damage Assessment (Madison County, NC)

Mobile-friendly flood damage assessment app for chicken farms with **offline-first capture** (limited field connectivity) and **later sync** when internet is available.

## Business requirements (from assignment)

For each site, capture:
- Latitude / Longitude
- Address
- Condition (Good / Moderate / Bad)
- Total number of chickens
- Photos of the farm

## What this implementation does

- **Frontend**: React + Vite (`flood-assessment.client`)
  - Uses **browser geolocation** to capture latitude/longitude
  - Stores assessments **offline in IndexedDB**
  - Captures **multiple photos** and stores them as Base64 strings
  - Provides **Sync** button to post offline records to the backend later
  - Registers a small **service worker** so the UI can load again offline after first visit

- **Backend**: ASP.NET Core (.NET 8) Web API (`Flood-Assessment.Server`)
  - `POST /api/assessment` to accept synced assessments
  - `GET /api/assessment` to list all received assessments
  - Uses an **in-memory repository** (demo-friendly; can be replaced with a database)

## Setup / run instructions

### Prerequisites
- .NET SDK 8
- Node.js (18+ recommended) + npm

### Run backend

```bash
dotnet run --project Flood-Assessment.Server
```

API is available on the URLs shown in the console (by default includes `http://localhost:5113` and `https://localhost:7210`).

### Run frontend

```bash
cd flood-assessment.client
npm ci
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`).

The dev server proxies `/api/*` requests to `http://localhost:5113` (see `flood-assessment.client/vite.config.js`).

## Offline-first flow (how to demo)

1. Open the app once while online.
2. Fill Address, Condition, Chicken Count, add Photos.
3. Click **Save Offline** (record is saved to IndexedDB).
4. Turn off internet (or use DevTools offline), continue saving more records.
5. When back online, click **Sync** to POST all saved records to the backend.

## Assumptions made

- Device/browser can grant **geolocation permission** (lat/long).
- Address is **entered manually** (could be enhanced with reverse-geocoding when online).
- Photos are stored as **Base64** for simplicity (good for demo; large photos may need resizing/compression in production).
- Backend storage is **in-memory** (persistence not required for the assignment demo).
- No authentication/authorization required for the demo scenario.

## Architecture & design decisions

- **Offline queue**: assessments are persisted client-side in **IndexedDB** so field teams can continue work without reliable connectivity.
- **Explicit sync**: a manual **Sync** button makes the workflow predictable for interview/demo.
- **Simple API**: ASP.NET Core controller accepts the payload and stores it via a repository interface (easy to swap in EF Core / SQL later).

## Notes / future enhancements (optional)

- Show a list of **pending offline records** with status and retry counts.
- Automatic sync on `online` event + conflict handling.
- Server-side storage (SQLite/Postgres) and photo storage (blob store) instead of Base64.

