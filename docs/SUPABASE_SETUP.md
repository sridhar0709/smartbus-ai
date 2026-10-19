# SmartBus AI: Supabase database setup

This guide connects the existing Next.js dashboard to a Supabase project without exposing privileged credentials.

## 1. Configure environment variables

Set these variables in `.env.local` for local development and in **Vercel → Project → Settings → Environment Variables** for Preview and Production:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Use the URL and publishable key from the same Supabase project. The repository's `.env.example` contains a project URL, but verify that it is the intended active project before deploying. Do not put a service-role or secret key in a `NEXT_PUBLIC_*` variable or commit credentials.

## 2. Verify the database schema

The dashboard expects these tables and columns (exact names matter):

- `buses`: `id, bus_number, registration_number, capacity, status, route_id, driver_id`
- `routes`: `id, name, direction, active`
- `drivers`: `id, name, active`
- `bus_locations`: `bus_id, trip_id, latitude, longitude, speed_kph, heading, recorded_at`
- `trips`: `id, bus_id, route_id, driver_id, started_at, ended_at, status`
- `attendance`: `id, attendance_date`
- `alerts`: `id, alert_type, message, delivery_status, created_at`

This repository does not currently include a schema migration for those tables. Verify the actual Supabase schema before applying any migration. Do not blindly create duplicate tables in a project that already has operational data.

## 3. Apply authorization before real use

The browser client uses the public publishable key. That is expected, but **RLS must be enabled and suitable policies must be installed on every exposed table**. Create a membership model linking authenticated users to a college, then scope every SELECT/INSERT/UPDATE/DELETE policy through that membership. Never solve an empty dashboard by disabling RLS or allowing all authenticated users to read every college's data.

Do not apply generic permissive policies to real student, GPS, driver, or attendance data. Policy design depends on the existing table definitions and membership model; inspect both before writing production policies.

## 4. Enable email sign-in

In Supabase Authentication settings, enable the intended email OTP/magic-link provider and configure the site's URL and allowed redirect URLs. Add the deployed Vercel domain and localhost only for development. Test sign-in, link expiry, sign-out, and access after sign-out.

## 5. Deploy and verify

After adding environment variables, redeploy Vercel so the build receives them. Test using an authorized staff account:

1. Missing environment variables show the setup message.
2. Signed-out users see the sign-in form, not operational data.
3. Authorized users see only their college's records.
4. The dashboard refreshes and reports query errors rather than hiding them.
5. An account from another college cannot read or modify this college's records.
6. No service-role key is present in browser bundles, Git history, or public environment variables.

## Current implementation status

`lib/supabase.ts` uses the Supabase SSR browser client, validates the current user with `auth.getUser()`, runs the dashboard's existing live queries, and derives the latest GPS point per bus. This is client-side session-aware data access, **not** a substitute for RLS. A production-ready launch remains blocked until the real schema, college membership model, RLS policies, and Vercel environment variables are verified and tested.
