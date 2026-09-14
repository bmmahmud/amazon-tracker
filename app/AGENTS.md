# Amazon Tracker — Agent Instructions

This is an Expo-based React Native + TypeScript app (`/app`) paired with a Node/Express scraper backend (`/server`).

## Quick Start

**Run the server** (terminal 1):
```bash
cd server
npm install
npm start
```
Listens on `http://0.0.0.0:4000`.

**Run the app** (terminal 2):
```bash
cd app
npm install
npx expo start
```

## Project Structure & Key Files

| Path | Purpose |
|------|---------|
| `app/src/api.ts` | Defines `lookupProduct()` — calls backend `/api/lookup` endpoint |
| `app/src/config.ts` | `API_BASE_URL` — must point to backend LAN IP (not localhost) |
| `app/src/types.ts` | Shared types (`LookupResult`, `Product`, etc.) |
| `app/src/storage.ts` | AsyncStorage wrappers for phone data persistence |
| `app/screens/ListScreen.tsx` | "My List" tab — displays stored products |
| `app/screens/AddScreen.tsx` | "Add" tab — paste URLs, calls `lookupProduct()` |
| `server/index.js` | Express server; `POST /api/lookup` entry point |
| `server/lib/amazon.js` | Web scraper — extracts ASIN, title, price from Amazon URLs |

## Critical Notes for Development

### ⚠️ Expo Version: Read Docs First
- App uses **Expo 57.0.22** (React Native 0.86.3, React 19.2.3)
- **Always read the exact versioned docs** at https://docs.expo.dev/versions/v57.0.0/ before writing any code
- Breaking changes between Expo versions are common; check docs, not assumptions

### 🌐 Phone-to-Backend Network Setup
- **Phone and laptop must be on the same Wi-Fi network**
- `app/src/config.ts` sets `API_BASE_URL` to a detected LAN IP (e.g., `http://192.168.1.42:4000`)
- Find your laptop's IP with `ipconfig` (Windows) → look for **IPv4 Address** under your active Wi-Fi adapter (not a VPN/virtual adapter)
- If IP changes (e.g., reconnect to Wi-Fi), update `config.ts` before running the app

### 💾 Data Storage
- All product data lives in **AsyncStorage** on the phone — no server-side sync
- No auth/login yet — each phone has its own isolated list
- Data structure: `Product = { asin, url, name, price, currency, checkedAt }`

### 🔍 The Scraper (`server/lib/amazon.js`)
- **This is the only file that changes if swapping scrapers** (e.g., switching to Rainforest API, Keepa)
- Extracts ASIN from messy Amazon URLs (handles `/dp/`, `/gp/product/`, short links, tracking params)
- Parses title, price, currency from Amazon's HTML using Cheerio
- Returns: `{ asin, url, name, price, currency, checkedAt }`
- **Known issue**: Amazon's markup changes often and varies by region/A-B test — scraping can fail; backend returns clear error-per-item

### 🔄 Lookup Flow
1. **App**: User pastes URL(s) → calls `lookupProduct(url)` (api.ts)
2. **API**: `POST /api/lookup` with `{ url }` (server/index.js)
3. **Scraper**: Extract ASIN, canonicalize URL, fetch + parse Amazon page (server/lib/amazon.js)
4. **Response**: `{ asin, url, name, price, currency, checkedAt }`
5. **Storage**: App stores result in AsyncStorage, displays in ListScreen

## Build & Deploy

- **Local dev**: Both server and app run on localhost/LAN
- **Production-ready next step**: Deploy server to Render/Railway (free tier) so app works on any phone without LAN IP management
- **Same code works on macOS**: Update `API_BASE_URL` to point to deployed server (no app code changes)

## Common Tasks

| Task | Location |
|------|----------|
| Add a new screen | `app/screens/NewScreen.tsx` → import in `app/App.tsx` |
| Change backend endpoint | `server/index.js` |
| Improve price parsing | `server/lib/amazon.js` → `parsePrice()` |
| Add product fields | Update `LookupResult` in `app/src/types.ts` → propagate to screens & storage |
| Fix network errors | Check `app/src/config.ts` API_BASE_URL and Wi-Fi connectivity |
