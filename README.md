# CYBERNOIR

CYBERNOIR is a Next.js + Supabase cybersecurity blogging platform with:

- email/password auth
- Google sign-in
- admin panel
- blogs, comments, likes, bookmarks
- newsletter collection
- admin MFA
- audit log support

## Stack

- Next.js 15
- React 19
- Supabase
- NextAuth
- TypeScript

## Local Setup

1. Install dependencies

```powershell
npm install
```

2. Create `.env` from `.env.example`

3. Start the dev server

```powershell
npm run dev
```

## Environment Variables

Use these values in local `.env` and in Vercel Project Settings.

```env
NEXTAUTH_URL=
NEXTAUTH_SECRET=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

ADMIN_USERNAME=
ADMIN_PASSWORD=
ADMIN_EMAIL=
ADMIN_TOTP_SECRET=

NEXT_PUBLIC_SITE_NAME=CyberNoir
```

## Supabase Setup

1. Create a Supabase project
2. Open SQL Editor
3. Run `supabase/schema.sql`

Important:
- if you are using audit logs, also make sure the `audit_logs` table exists in Supabase
- if you add new schema features later, rerun the updated SQL

## Google OAuth Setup

1. Open Google Cloud Console
2. Create or select a project
3. Open Google Auth Platform / OAuth setup
4. Configure the consent screen
5. Create OAuth credentials for a `Web application`

For local development add:

- Authorized JavaScript origin:
  - `http://localhost:3000`
- Authorized redirect URI:
  - `http://localhost:3000/api/auth/callback/google`

For production add:

- Authorized JavaScript origin:
  - `https://YOUR_DOMAIN`
- Authorized redirect URI:
  - `https://YOUR_DOMAIN/api/auth/callback/google`

Then copy:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Admin MFA Setup

1. Generate a Base32 secret
2. Put it in:

```env
ADMIN_TOTP_SECRET=
```

3. Restart the app
4. Open `/admin/security`
5. Copy the setup key or `otpauth://` URL into Google Authenticator

Use Google Authenticator:

- Add account
- Enter a setup key
- Name: `CyberNoir Admin`
- Key: your `ADMIN_TOTP_SECRET`
- Type: `Time based`

## Git Safety Before Push

Before pushing:

1. Do not commit `.env`
2. Do not commit `.vercel`
3. Make sure secrets are only in local env or Vercel env settings
4. Rotate secrets if they were ever exposed anywhere

Recommended to rotate before production:

- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `ADMIN_PASSWORD`
- `ADMIN_TOTP_SECRET`

## Vercel Deployment

1. Push the project to GitHub
2. Import the repo into Vercel
3. In Vercel, open:
   - Project
   - Settings
   - Environment Variables
4. Add all variables from `.env.example`
5. Set:

```env
NEXTAUTH_URL=https://YOUR_DOMAIN
```

6. Deploy

After deploy:

1. Update Google OAuth production redirect URI
2. Test:
   - signup
   - login
   - Google login
   - admin login
   - likes/bookmarks/comments
   - newsletter
   - admin logs

## Performance Notes

The project is already optimized better than before for liked/bookmarked pages, but for production you should still:

- keep Supabase in a nearby region
- avoid huge images
- prefer Supabase Storage over Google Drive images
- add DB indexes as data grows

## Build

```powershell
npm run build
```

## Official References

- Vercel environment variables: [Vercel Docs](https://vercel.com/docs/environment-variables)
- Auth.js / NextAuth providers: [Auth.js Docs](https://authjs.dev/getting-started/authentication/oauth)
- Google Auth Platform setup: [Google Cloud Help](https://support.google.com/cloud/answer/15544987?hl=en)
