# SmartBus AI

A responsive college fleet intelligence dashboard for bus tracking, attendance operations, parent notification previews, and a hardware-free Virtual Lab.

## Stack
- Next.js 15, React 19, TypeScript
- Tailwind CSS 4
- Supabase Postgres and JavaScript client
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
The app uses the `smartbus-ai` Supabase project in `ap-south-1`. Use the project's URL and publishable key in `.env.local` and Vercel. The publishable key is intended for browser clients; never expose a service-role or secret key in client code or any `NEXT_PUBLIC_*` variable.

The live dashboard reads operational buses, routes, drivers, locations, trips, attendance and alerts through Supabase Auth. Access depends on the project's college-scoped Row Level Security (RLS) policies.

## Virtual Lab
Open **Virtual Lab** in the dashboard navigation to simulate three buses, six synthetic students, GPS movement, RFID boarding/exit, and parent-alert previews. The Virtual Lab writes only to the isolated `simulation_runs`, `simulation_buses`, `simulation_students`, `simulation_locations`, and `simulation_events` tables. It does not send real messages or write to operational attendance, fleet, or alert tables.

See [`docs/VIRTUAL_LAB.md`](docs/VIRTUAL_LAB.md) for usage and [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) for configuration and deployment checks.

## Validation
A Vercel preview build for the Virtual Lab branch passed Next.js compilation and TypeScript validation. Before merging, test the Virtual Lab using an authenticated college member and confirm that simulation rows remain isolated from operational data. Do not use the system for real transport operations until production authentication, RLS, and end-to-end workflows have been fully verified.
