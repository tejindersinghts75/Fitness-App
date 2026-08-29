# Fitora

One GitHub repository containing two applications and one shared backend definition.

```text
Fitness-App/
├── website/       # Customer website and /admin portal (Vercel)
├── mobile-app/    # React Native + Expo application (EAS/App Stores)
└── supabase/      # Shared database migrations and email templates
```

## Website

```bash
cd website
npm install
npm run dev
```

- Customer website: `/`
- Admin portal: `/admin`
- Mux webhook: `/api/mux/webhook`

When importing this repository into Vercel, set **Root Directory** to `website`.

## Mobile app

```bash
cd mobile-app
npm install
npm start
```

Vercel ignores the mobile application because the Vercel project builds only the `website` folder. Build the mobile app with Expo EAS for Google Play and the App Store.

## Shared backend

Both applications use the same Supabase project. Never commit `.env` files or server secrets. Configure website secrets in Vercel and mobile public values through Expo environment configuration.
