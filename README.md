# Maintenance App — Supabase Week 4 Learning Build

React + Supabase + PostgreSQL with Auth, role-based RLS, and Storage photos.

## Included

- Email/password sign in, session restore, logout
- `profiles` role model: `store / viewer / admin`
- Permission-aware UI
- RLS-ready data flow
- Store user locked to assigned store
- Viewer read-all + create
- Admin full CRUD
- Private Supabase Storage photo upload + signed URLs
- `ticket_photos` metadata table
- Dashboard from live Supabase data
- Loading / Error / Empty states

## Setup

1. Keep the existing `.env` values for your Supabase project.
2. Run `supabase-week4-setup.sql` in Supabase SQL Editor.
3. Follow `WEEK4_SETUP.md` for the 3 learning users and smoke test.
4. Install dependencies:

```bash
npm ci
```

5. Start Vite:

```bash
npm run dev
```

## Architecture

```text
Supabase Auth
   ↓
Profile (role + store_id)
   ↓
RLS permission
   ↓
React → Service Layer → Supabase → PostgreSQL / Storage
```

This build intentionally keeps Realtime, OAuth, password reset, and advanced production auth out of scope.
