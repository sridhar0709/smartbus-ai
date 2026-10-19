# SmartBus AI Virtual Lab

The Virtual Lab is integrated into the existing dashboard navigation. It simulates GPS, RFID boarding/exit, buses, students, and parent-alert previews without connecting hardware.

## Isolation and security

The Virtual Lab writes only to these dedicated Supabase tables:

- `simulation_runs`
- `simulation_buses`
- `simulation_students`
- `simulation_locations`
- `simulation_events`

It does not write to operational `buses`, `students`, `bus_locations`, `attendance`, or `alerts`. All five simulation tables have RLS enabled. Runs require a current authenticated user and college membership. Each run and its child records are scoped to the run creator and college membership. Simulation RFID IDs are synthetic and are not real card credentials.

## Use it

1. Sign in to SmartBus AI with an authorized college account.
2. Open **Virtual Lab** in the left navigation.
3. Select **Initialize virtual fleet**. This creates one simulation run with three demo buses, six synthetic students, initial GPS fixes, and a start event.
4. Select a student and bus, then click **Simulate RFID tap**. Each tap toggles the student's state between boarded and exited and writes an event plus a notification preview.
5. Click **Advance GPS** to move virtual bus coordinates and update each bus's latest fix.
6. Click **Generate alert preview** to create a simulation-only warning.
7. Pause and resume the run as needed. Create a fresh run to reset the demo data without deleting previous runs.

No real SMS, WhatsApp, email, GPS hardware, RFID hardware, or parent notification is contacted. All alerts are previews stored in `simulation_events`.

## Deployment

The dashboard route is part of the existing Next.js app. The migration is in `supabase/migrations/20261019170000_virtual_lab.sql`. The live schema was applied through the Supabase management connection and verified. Keep the migration in source control so the schema is documented and can be reproduced in another environment.

Run `npm run lint` and `npm run build` before merging. Verify the Virtual Lab with a signed-in staff user. If the menu does not appear, confirm the deployment is built from the branch/commit containing the Virtual Lab navigation change.
