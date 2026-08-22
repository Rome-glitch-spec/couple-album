# Our Memories — a private album for two

A private, single-couple photo & video album. There is no public sign-up —
only two authorized accounts can ever access it. Built with Next.js (App
Router, TypeScript), Tailwind CSS, and Supabase (Auth, Postgres, Storage),
with every table and the storage bucket protected by Row Level Security.

## Features

- Email/password login only — no public registration
- Upload photos & videos (drag-drop, progress, retry, captions, albums/collections)
- Full-screen viewer with pinch/wheel/double-click zoom, swipe navigation
- Favorites shared between both partners
- Albums and Collections (create, rename, archive, delete, cover images)
- Chronological timeline grouped by month, with search & filters
- Automatic monthly slideshow presentation
- Monthsary reminder banner every configured day of the month (default: 22nd)
- Archive and Trash (30-day soft delete) with restore / permanent delete
- Built-in collage maker (multiple layouts, saved as a new private photo)
- ZIP download for albums/collections via a signed, authenticated API route
- Responsive: sidebar nav on desktop, bottom nav + sheet menu on mobile
- Light/dark/system theme

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Project Settings → API**, copy the **Project URL**, **anon public
   key**, and **service_role key** (keep the service role key secret).

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- `NEXT_PUBLIC_*` variables are bundled into browser JS. This is fine — they
  only grant what Row Level Security allows, which is "nothing, unless you
  are one of the two authorized profiles."
- `SUPABASE_SERVICE_ROLE_KEY` must **never** be prefixed with `NEXT_PUBLIC_`
  and must never be imported by any client component. It is only read by
  `lib/supabase/server.ts`'s `createAdminClient()` (server-only) and by the
  local `scripts/create-accounts.mjs` setup script. `.env*` is already
  git-ignored.

## 3. Create the database

Open the Supabase SQL editor and run the entire contents of
[`supabase/schema.sql`](./supabase/schema.sql). This creates:

- Tables: `profiles`, `media`, `albums`, `album_media`, `collections`,
  `collection_media`, `collages`, `reminders`, `app_settings`
- Indexes for common queries (timeline order, favorites, trash, archive)
- A trigger that auto-creates a `profiles` row whenever an `auth.users` row
  is created
- Row Level Security enabled on every table, with policies that only allow
  access to users who already have a `profiles` row (i.e. the two accounts
  you create in the next step) — everyone else, including other
  authenticated Supabase users, gets zero rows back
- A **private** Storage bucket named `couple-media` with matching storage
  policies

## 4. Configure Storage

The SQL script already creates the `couple-media` bucket as **private**
(`public: false`) and adds `select`/`insert`/`update`/`delete` policies
scoped to authorized partners only. Nothing further to do — just confirm in
**Storage** in the dashboard that the bucket shows a "Private" badge.

## 5. Create the two accounts

This app has **no public sign-up**. Create exactly two accounts via the
included admin script, which uses the service role key:

```bash
npm install
node --env-file=.env.local scripts/create-accounts.mjs \
  "you@example.com" "Your Name" \
  "partner@example.com" "Partner Name"
```

This prints a temporary password for each account. Sign in with them and
immediately change your password from **Settings → Account**.

(If your Node version doesn't support `--env-file`, export the two
variables from `.env.local` into your shell first, then run
`node scripts/create-accounts.mjs ...`.)

## 6. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`.

## 7. Build

```bash
npm run build
npm start
```

## 8. Deploy

Deploy like any Next.js app (Vercel, etc.). Set the same three environment
variables in your hosting provider's dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (mark as a "secret"/server-only env var — most
  platforms have a way to do this; make sure it's never exposed to a client
  bundle)

## Security model

- **No public sign-up.** The only way an account is created is via
  `scripts/create-accounts.mjs`, run locally with the service role key.
- **Row Level Security everywhere.** Every table's policies check
  `public.is_authorized_partner()`, which is true only for a signed-in user
  who has a row in `profiles`. A signed-in user without a `profiles` row
  (which shouldn't be possible outside the setup script, but defense in
  depth matters) gets zero access to any table.
- **Private storage.** The `couple-media` bucket is not public. All reads go
  through signed URLs (`storage.createSignedUrl`), which are short-lived and
  only issued to a client already authenticated as an authorized partner —
  itself gated by the bucket's storage policies.
- **Defense in depth in the app layer too:** `middleware.ts` redirects
  unauthenticated requests to `/login` and signs out + redirects any
  authenticated-but-unauthorized session; `app/(app)/layout.tsx` re-checks
  server-side before rendering any private page.
- **File validation** (`lib/utils.ts` → `validateFile`) enforces allowed
  MIME types and per-type size limits (25MB photos / 500MB videos) before
  any upload begins.
- **The service role key is never sent to the browser.** It's only used in
  `lib/supabase/server.ts`'s `createAdminClient()` (guarded by the
  `server-only` package, which throws a build error if ever imported from
  client code) and in the standalone `scripts/create-accounts.mjs`.
- **No search-engine indexing:** `robots: { index: false, follow: false }`
  is set in `app/layout.tsx`.
- **Soft delete:** deleting a photo/video moves it to Trash (`is_deleted`)
  rather than destroying it; permanent deletion requires a second, explicit
  confirmation.

## Security checklist

- [x] No service role key in any client component or bundle
- [x] `.env*` git-ignored (`.env.example` is the only tracked env file)
- [x] Row Level Security enabled on every table
- [x] Storage bucket `couple-media` is private, with matching policies
- [x] Authentication required for every route except `/login`
- [x] Protected routes enforced in middleware **and** in the server layout
- [x] File type + size validation on every upload
- [x] All media access goes through short-lived signed URLs — no public URLs
- [x] No public sign-up route exists anywhere in the app

## Project structure

```
app/
  login/                  public login page
  (app)/                  protected app shell (redirects to /login if unauthenticated)
    dashboard/  memories/  albums/  collections/
    favorites/  archive/   trash/   monthly/  collage/  settings/
  api/download/           authenticated ZIP export route
components/               UI building blocks (viewer, grid, upload modal, etc.)
lib/
  supabase/               browser / server / middleware Supabase clients
  media-service.ts        upload, favorite, trash, restore, archive, signed URLs
  collection-service.ts   album/collection CRUD
  settings-service.ts     couple settings, reminders, account settings
  utils.ts                formatting, validation, date helpers
supabase/schema.sql       full DB schema + RLS + storage policies
scripts/create-accounts.mjs  one-time admin script to create the two accounts
```
