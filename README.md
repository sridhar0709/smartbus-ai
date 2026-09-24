# SmartBus AI

A responsive college fleet intelligence dashboard for bus tracking, attendance operations, and parent notifications.

## Stack
- Next.js 15, React 19, TypeScript
- Tailwind CSS 4
- Supabase Postgres and JavaScript client
- MapLibre GL (live map integration planned)
- Vercel

## Run locally
```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local
npm run dev
```

Open http://localhost:3000.

## Supabase
The project has the core schema for colleges, routes, drivers, buses, students, GPS positions, attendance, and alerts. `lib/supabase.ts` creates a browser-safe Supabase client using the publishable key and includes a typed fleet snapshot query.

RLS is enabled. Add reviewed, role/college-scoped RLS policies before enabling authenticated users to read or write operational data. Do not use the service-role key in browser code. Configure the same two public environment variables in Vercel to connect the deployed frontend.

## Current limitations
Dashboard visualizations and fleet markers are still sample UI. Live GPS ingestion, staff authentication and RLS policies, wiring live query results into dashboard components, and parent SMS/WhatsApp delivery remain to be implemented and tested. Do not use for real transport operations until those controls are in place.
