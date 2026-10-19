# SmartBus AI: Supabase connection and deployment

## Connected Supabase project

- Project: `smartbus-ai`
- Project ref: `luvknncxtvgfwlshxtrs`
- Region: `ap-south-1`
- API URL: `https://luvknncxtvgfwlshxtrs.supabase.co`
- Existing migration: `20260924173435_smartbus_core_schema`

The live project already contained the SmartBus schema. Do not create duplicate tables or replace its existing schema with a generic starter schema. The dashboard compatibility migration is tracked at `supabase/migrations/20261019150000_dashboard_compatibility.sql`.

## Dashboard tables and expected columns

The Next.js dashboard reads these tables through the publishable key and the signed-in user's session:

- `buses`: `id, bus_number, registration_number, capacity, status, route_id, driver_id`
- `routes`: `id, name, direction, active`
- `drivers`: `id, name, active`
- `bus_locations`: `bus_id, trip_id, latitude, longitude, speed_kph, heading, recorded_at`
- `trips`: `id, bus_id, route_id, driver_id, started_at, ended_at, status`
- `attendance`: `id, attendance_date`
- `alerts`: `id, alert_type, message, delivery_status, created_at`

The dashboard compatibility migration adds the missing `buses.route_id` and `buses.driver_id` references with college-scoped foreign keys, adds query indexes, and adds member-scoped SELECT policies for `alerts`, `attendance`, and `gps_positions`. It does not delete or seed data.

## Environment variables

Vercel project `smartbus-ai` has these variables configured for Production, Preview, and Development:

```env
NEXT_PUBLIC_SUPABASE_URL=https://luvknncxtvgfwlshxtrs.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... # use the stored Vercel value
```

The URL and publishable key are public-client credentials, not admin secrets. Never put a service-role or secret key in any `NEXT_PUBLIC_*` variable or commit credentials to Git.

For local development, copy the same two values from Supabase Project Settings into `.env.local`. Do not copy a real key into `.env.example`.

## Authentication and authorization

The app checks the current user with `supabase.auth.getUser()` before querying operational data. The database has RLS enabled and uses the existing `private.is_college_member(...)` / `private.has_college_role(...)` helpers. The compatibility migration adds scoped read policies for the three dashboard tables identified by the security advisor. Re-run the Supabase security advisor after schema changes and review its results.

In Supabase Authentication settings, ensure email OTP/magic-link sign-in is enabled and the deployed site's URL plus allowed redirect URLs are configured. Verify sign-in, sign-out, expired links, and a user without a college membership. Do not disable RLS to make an empty dashboard display data.

## Deploy and verify

1. Review the GitHub pull request for the client-code and documentation changes.
2. Run `npm run lint` and `npm run build` in the repository.
3. Merge the reviewed PR to `main` to trigger the production Git deployment.
4. If Vercel has not automatically deployed the merged commit, trigger a deployment manually.
5. Test using an authorized staff account: verify fleet, routes, drivers, current GPS positions, today's attendance count, and recent alerts.
6. Confirm an unauthenticated user sees no operational data and a member of another college cannot read this college's rows.
7. Check the Vercel build/runtime logs and Supabase security advisor if any table query fails.

## Verified live state

On 2026-10-19, the Supabase project was reachable, its existing tables and RLS policies were inspected, and the compatibility SQL ran successfully. The Supabase security advisor no longer reported the previously missing SELECT policies for `alerts`, `attendance`, and `gps_positions`; it still reported leaked-password protection disabled. Vercel environment variables were updated for all three deployment environments. The GitHub application changes remain in draft PR review and the production website has not been verified end-to-end with an authenticated staff account.
