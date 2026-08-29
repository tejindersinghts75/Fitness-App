# Fitora: Supabase + Brevo email confirmation setup

This setup uses one shared Supabase Auth account for the mobile app and future website. Brevo is only the SMTP delivery provider; Supabase still creates users, signs confirmation links, verifies emails, and manages sessions.

## Before starting

You need:

- A Supabase account and project.
- A Brevo account with the Transactional Email platform activated.
- Preferably a domain you own, such as `yourdomain.com`.
- A sender address such as `no-reply@auth.yourdomain.com` or `no-reply@yourdomain.com`.

Do not put the Brevo SMTP key in `.env` or inside the Expo app. It belongs only in Supabase’s server-side SMTP settings.

## Part 1 — Create the Supabase project

1. Sign in at `https://supabase.com/dashboard`.
2. Select **New project**.
3. Choose your organization.
4. Enter a project name such as `fitora-production`.
5. Generate and securely save the database password.
6. Choose the region closest to your users. For an India-focused app, select the nearest available region appropriate to your latency and data requirements.
7. Create the project and wait until provisioning finishes.

## Part 2 — Create the shared profiles database

1. Open the Supabase project.
2. Go to **SQL Editor**.
3. Select **New query**.
4. Open `supabase/migrations/202608260001_phase1_auth_profiles.sql` from this project.
5. Paste the complete SQL into the editor.
6. Click **Run**.
7. Open **Table Editor → profiles** and confirm that the table exists.
8. Open **Authentication → Policies** or the profiles table policy view and confirm RLS is enabled.

The migration creates profiles automatically for any Supabase Auth user, regardless of whether signup comes from mobile, the future website, or an administrative process.

## Part 3 — Get the safe mobile credentials

1. In Supabase, open **Project Settings → API**.
2. Copy the **Project URL**.
3. Copy the **anon** or **publishable** key intended for client applications.
4. Never copy the `service_role` or secret key into Expo.
5. In `mobile-app`, copy `.env.example` to `.env`.
6. Fill in:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
EXPO_PUBLIC_EMAIL_CONFIRMATION_URL=fitora://auth/confirmed
EXPO_PUBLIC_PASSWORD_RESET_URL=fitora://auth/reset-password
```

7. Restart Expo after saving:

```bash
npm start -- --clear
```

## Part 4 — Require email confirmation

1. In Supabase, open **Authentication → Providers**.
2. Open the **Email** provider.
3. Ensure Email provider/signups are enabled.
4. Enable **Confirm email**. Do not enable automatic confirmation.
5. Save the settings.
6. Phone authentication can remain disabled because this flow does not use SMS OTP.

With confirmation enabled, registration creates the Auth user and profile, but `signUp()` returns no active session. The existing app displays “Check your email” and asks the user to confirm before logging in.

## Part 5 — Configure authentication URLs

1. Open **Authentication → URL Configuration**.
2. For development before the website exists, set the Site URL to a stable page you control if available. The Site URL is the fallback destination.
3. Under **Redirect URLs**, add:

```text
fitora://auth/confirmed
fitora://auth/reset-password
```

4. Save the configuration.
5. For a production native build, the `fitora` scheme is already declared in `app.json`.
6. Expo Go does not behave exactly like a standalone native build for custom schemes. Test final deep links using a development build or production build.
7. When the website is created, add URLs such as:

```text
https://app.yourdomain.com/auth/confirmed
https://app.yourdomain.com/reset-password
```

Then you may point both mobile and web flows to the same hosted confirmation/result pages.

## Part 6 — Create and authenticate the Brevo sender domain

1. Sign in to Brevo.
2. Go to **Settings → Senders, Domains & Dedicated IPs → Domains**. The wording may appear as **Senders, Domains, IPs** depending on the account UI.
3. Click **Add a domain**.
4. Enter the domain you own. A dedicated authentication subdomain such as `auth.yourdomain.com` is recommended for separating authentication reputation from future marketing mail.
5. Use Brevo’s automatic domain authentication if it supports your DNS provider, or select manual setup.
6. For manual setup, copy every DNS record shown by Brevo into your DNS provider.
7. Add the Brevo verification record, DKIM record(s), and DMARC record/instructions shown for your account.
8. Do not create multiple DMARC records. If one already exists, update it according to Brevo’s instructions.
9. Wait for DNS propagation, then click **Authenticate** or **Verify** in Brevo.
10. Do not continue with production sending until Brevo shows the domain as authenticated.

## Part 7 — Create the Brevo sender

1. In Brevo, go to **Settings → Senders, Domains & Dedicated IPs → Senders**.
2. Create a sender such as:

```text
From name: Fitora
From email: no-reply@auth.yourdomain.com
```

3. Verify the sender if Brevo requests it.
4. The sender email must match the address later entered in Supabase.

## Part 8 — Generate a Brevo SMTP key

1. In Brevo, open **Settings → SMTP & API**.
2. Select the **SMTP** tab—not API Keys.
3. Copy the displayed **SMTP login**. It may look like `xxxx@smtp-brevo.com`; it is not necessarily your Brevo account email.
4. Click **Generate a new SMTP key**.
5. Name it `Supabase Auth Production`.
6. Choose the standard SMTP key.
7. Copy the full key immediately and store it in a password manager. Brevo displays it only once.
8. Do not use your Brevo account password or a Brevo API key.

Brevo SMTP values for Supabase:

```text
Host: smtp-relay.brevo.com
Port: 587
Username: your Brevo SMTP login
Password: your generated Brevo SMTP key
Sender email: no-reply@auth.yourdomain.com
Sender name: Fitora
```

Port `587` is the normal starting choice. Brevo also supports `465` and `2525`, but use one port and encryption mode consistently.

## Part 9 — Connect Brevo SMTP to Supabase

1. Return to the Supabase dashboard.
2. Open **Project Settings → Authentication** or **Authentication → SMTP Settings**, depending on the current dashboard navigation.
3. Find **Custom SMTP** and enable it.
4. Enter:

```text
Sender name: Fitora
Sender email: no-reply@auth.yourdomain.com
Host: smtp-relay.brevo.com
Port: 587
Username: [Brevo SMTP login]
Password: [Brevo SMTP key]
```

5. Save the SMTP configuration.
6. Do not paste these credentials into Expo, Git, `.env`, Slack, screenshots, or documentation.
7. In Supabase **Authentication → Rate Limits**, review the email sending limit. Supabase applies its own Auth email rate limit even when Brevo has a larger daily allowance.

## Part 10 — Configure the confirmation email template

1. In Supabase, open **Authentication → Email Templates**.
2. Select **Confirm signup**.
3. Use a subject such as:

```text
Confirm your Fitora account
```

4. Copy the HTML from `supabase/templates/confirm-signup.html` into the template editor.
5. Keep the button URL exactly as `{{ .ConfirmationURL }}`. Supabase generates and verifies this signed link.
6. Save the template.
7. In Brevo, disable click/open tracking for these SMTP authentication messages if tracking is enabled. Link rewriting can break Supabase confirmation links.

## Part 11 — Test the complete registration flow

Use a new email address that has never registered before:

1. Start the app with `npm start -- --clear`.
2. Open **Create account**.
3. Enter full name, email, phone, password, and confirmation password.
4. Accept the terms and submit.
5. The app should display **Check your email** rather than entering the main app.
6. Open the Brevo **Transactional → Logs** area and confirm the email was accepted/sent.
7. Open the email inbox and click **Confirm email address**.
8. In Supabase **Authentication → Users**, confirm that the user has a confirmation timestamp.
9. In Supabase **Table Editor → profiles**, confirm the profile has the same UUID and contains full name, email, and phone.
10. Return to the app and log in with the registered email and password.
11. Close and reopen the app to verify session persistence.
12. Edit the full name or phone from Profile and confirm the shared profile row changes.
13. Log out and verify the app returns to Welcome.

## Common problems

### Email address not authorized

The Supabase default SMTP server is still being used. Enable and save the Brevo custom SMTP settings.

### Brevo 535 authentication error

- Use the SMTP login shown by Brevo, not `smtp-relay.brevo.com` as the username.
- Use an SMTP key, not the Brevo password or API key.
- Remove spaces or line breaks accidentally copied with the key.

### Sender rejected

The sender address in Supabase must be verified in Brevo or covered by an authenticated Brevo domain.

### Confirmation opens the wrong page

- Confirm the destination is listed under Supabase Redirect URLs.
- Confirm `.env` matches the allowed URL exactly.
- Restart Expo after changing `.env`.
- Test custom schemes with a development/production build rather than relying only on Expo Go.

### Confirmation link is expired or invalid before the user clicks

Disable email link tracking and security/link rewriting in the SMTP provider. If corporate inbox prefetching remains a problem, a later phase can use Supabase’s email OTP/token-hash flow instead.

### Email goes to spam

- Finish Brevo domain authentication and DKIM/DMARC setup.
- Use a professional sender domain rather than Gmail/Yahoo.
- Keep authentication email separate from marketing campaigns.
- Avoid spam-heavy wording and excessive images.

## Important security notes

- Supabase is the source of truth; Brevo only transports email.
- Supabase Auth stores and validates passwords. Brevo never receives passwords.
- The mobile app contains only the public Supabase URL and anon/publishable key.
- The Brevo SMTP key stays in Supabase’s encrypted server configuration.
- Do not enable phone OTP unless you intentionally add SMS authentication later.
- Do not manually mark users confirmed from the client.
