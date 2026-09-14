# Amazon Price Tracker

- `app/` — Expo (React Native + TypeScript) app. Run with Expo Go on your iPhone today; same code runs on a Mac later.
- `server/` — Node/Express backend that scrapes an Amazon product page for title + price, given a URL.

## Run it (Windows + iPhone via Expo Go)

**1. Start the backend** (in one terminal):
```
cd server
npm install
npm start
```
It listens on `http://0.0.0.0:4000`.

**2. Point the app at your backend:**
Edit `app/src/config.ts` and set `API_BASE_URL` to `http://<your-laptop-LAN-IP>:4000`.
Find your IP with `ipconfig` (look for the IPv4 address of your active Wi-Fi adapter — not a VPN one). It's already set to a detected IP; double check it matches your Wi-Fi adapter.

Your iPhone and laptop must be on the **same Wi-Fi network**.

**3. Start the app** (in another terminal):
```
cd app
npm install
npx expo start
```
Scan the QR code with the iPhone Camera app or Expo Go app.

## Using it

1. Go to the **Add** tab, paste one or more Amazon product URLs (one per line), tap **Add to list**.
2. Go to **My List** to see each product's name and latest known price.
3. Tap **Refresh** on an item (or **Refresh all prices**) to re-check the current price.
4. Tap a product name to open it in Safari/Amazon app.

Data is stored locally on-device (AsyncStorage) — no account/login yet.

## Known limitations / next steps

- Amazon's page markup changes often and varies by region/A-B test; scraping may occasionally fail to find a price. The backend returns a clear error per-item in that case.
- No scheduled/background price checks or push notifications yet — refresh is manual. A natural next feature: a cron job on the backend + push notifications when price drops.
- No auth/sync across devices yet — list lives only on the phone it was added from.
- For production-grade reliability, consider swapping the scraper for a paid product-data API (e.g. Rainforest API, Keepa) later — `server/lib/amazon.js` is the only file that would need to change.

## Later, on a Mac

Same repo, no code changes:
```
cd server && npm install && npm start
cd app && npm install && npx expo start
```
Update `API_BASE_URL` if the Mac's IP differs, or deploy the backend somewhere reachable (Render/Railway free tier) so you don't need to keep updating IPs.
