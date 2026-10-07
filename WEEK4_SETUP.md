# Week 4 — Auth + RLS + Storage Setup

The React code in this folder is already wired for Week 4. The only manual work left is Supabase configuration and test users.

## A. Run the Week 4 SQL once

Supabase Dashboard → SQL Editor → New query → paste/run `supabase-week4-setup.sql`.

This creates:
- `profiles` (role + store assignment)
- `ticket_photos` metadata
- private Storage bucket `maintenance-photos`
- RLS policies for `store / viewer / admin`
- DB-generated ticket codes
- profile row for `admin@test.com` if that Auth user already exists

## B. Test Admin first

You already created `admin@test.com` in Authentication → Users. After the SQL succeeds:

1. `npm ci`
2. `npm run dev`
3. Sign in with `admin@test.com`
4. Confirm you can read, create, update, delete, upload photos, refresh, and log out.

## C. Create the other two learning users

Authentication → Users → Add user:
- `viewer@test.com`
- `store@test.com`

Use test passwords and auto-confirm them for this learning project.

Then run the **profile seed block at the bottom of `supabase-week4-setup.sql` again**.

Default test assignment:
- admin@test.com → `admin`
- viewer@test.com → `viewer`
- store@test.com → `store`, `store_id = 1`

If you want a different store, edit the final Store Test insert from `1` to the desired `store_id`.

## D. Expected permissions

| Role | Read | Create | Update | Delete |
|---|---|---|---|---|
| store | own store | own store | no | no |
| viewer | all stores | yes | no | no |
| admin | all stores | yes | yes | yes |

UI restrictions are included, but **RLS is the real security layer**.

## E. Photo flow

1. User chooses image(s) on New Request.
2. Ticket is inserted first.
3. Image file is uploaded to private Storage.
4. `ticket_photos` stores the file path + ticket relationship.
5. App creates a signed URL when displaying the image.

This keeps binary files in Storage and relational metadata in PostgreSQL.

## F. Minimum Week 4 smoke test

- Admin: CRUD works + photo upload/open/reload.
- Viewer: all requests visible; Create works; Edit/Delete buttons absent; direct DB Update/Delete blocked by RLS.
- Store: only assigned store data visible; store selection locked; Create own-store request works; Edit/Delete blocked.
- Logout → Login as another role → permissions change.
- Refresh browser → session remains.

Realtime remains intentionally out of scope.
