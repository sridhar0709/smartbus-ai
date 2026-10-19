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
# Confirm the intended Supabase project URL and publishable key in .env.local
npm run dev
```

Open http://localhost:3000.

## Supabase
The application is configured for the `smartbus-ai` Supabase project in `ap-south-1`. `.env.example` contains the project URL and its publishable key; these are client-side settings and never a service-role/secret key.

The dashboard expects tables for colleges, routes, drivers, buses, GPS positions, trips, attendance, and alerts. It queries existing operational data via Supabase Auth and relies on database Row Level Security (RLS) to restrict each staff member to their college. See [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) for the expected table/column contract, authentication settings, security requirements, and verification checklist.

**Important:** The connected Supabase project was inactive and is currently restoring. Database connectivity and the real schema could not yet be verified because database connections timed out/refused during restoration. Do not assume the dashboard is live until the schema and RLS checks pass. Never disable RLS or expose the service-role key to make the dashboard load.

## Current limitations
Dashboard visualizations and fleet markers include sample UI styling. Live GPS ingestion, college-membership authentication and RLS policies, operational data validation, and parent SMS/WhatsApp delivery remain to be implemented and tested. Do not use for real transport operations until those controls are verified.
