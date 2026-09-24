# SmartBus AI

A responsive college fleet intelligence dashboard for bus tracking, attendance operations, and parent notifications.

## Stack
- Next.js 15, React 19, TypeScript
- Tailwind CSS 4
- Supabase (backend integration planned)
- MapLibre GL (live map integration planned)
- Vercel

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Dashboard included
- Responsive dark fleet command center
- Fleet KPIs and system health panels
- Selectable sample bus markers and fleet status list
- Search/filter vehicles
- Recent activity feed and responsive mobile navigation

## Integration status
The current map and fleet data are sample UI data. Connect Supabase authentication/database and a trusted GPS ingestion service before using this for real transport operations. Parent alerts and attendance syncing are not yet wired to live services.

Never commit Supabase service-role keys or other secrets. Use environment variables.
