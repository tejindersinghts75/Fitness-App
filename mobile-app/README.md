# Fitora Mobile

Standalone Expo + React Native frontend. This folder is intentionally separate from the website in the parent directory.

## Run

```bash
cd mobile-app
cp .env.example .env
npm install
npm start
```

Press `i` for the iOS simulator, `a` for Android, or scan the Expo QR code on a device.

Authentication and shared profiles use Supabase when `.env` is configured. See `SUPABASE_SETUP.md` and run the included SQL migration first. Subscriptions, content entitlements, videos, and payments remain mock UI flows for later phases.
