-- SmartBus AI Virtual Lab: isolated simulation data.
-- Applied to project luvknncxtvgfwlshxtrs on 2026-10-19.
-- All simulation data is isolated from operational buses/students/attendance/alerts.
create table if not exists public.simulation_runs (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null default 'Virtual Fleet Lab',
  status text not null default 'running' check (status in ('running','paused','completed')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, college_id)
);
create table if not exists public.simulation_buses (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  college_id uuid not null,
  bus_number text not null,
  registration_number text not null,
  route_name text not null,
  driver_name text not null,
  capacity integer not null default 40 check (capacity between 1 and 100),
  status text not null default 'on_route' check (status in ('on_route','idle','delayed','offline')),
  created_at timestamptz not null default now(),
  unique (id, run_id, college_id),
  unique (run_id, bus_number),
  foreign key (run_id, college_id) references public.simulation_runs(id, college_id) on delete cascade
);
create table if not exists public.simulation_students (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  college_id uuid not null,
  student_code text not null,
  full_name text not null,
  class_section text not null default 'Demo',
  rfid_uid text not null,
  attendance_status text not null default 'not_boarded' check (attendance_status in ('not_boarded','boarded','exited')),
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, run_id, college_id),
  unique (run_id, student_code),
  unique (run_id, rfid_uid),
  foreign key (run_id, college_id) references public.simulation_runs(id, college_id) on delete cascade
);
create table if not exists public.simulation_locations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  college_id uuid not null,
  bus_id uuid not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  speed_kph numeric not null default 0 check (speed_kph between 0 and 160),
  heading numeric not null default 0 check (heading >= 0 and heading <= 360),
  recorded_at timestamptz not null default now(),
  unique (run_id, bus_id),
  foreign key (run_id, college_id) references public.simulation_runs(id, college_id) on delete cascade,
  foreign key (bus_id, run_id, college_id) references public.simulation_buses(id, run_id, college_id) on delete cascade
);
create table if not exists public.simulation_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  college_id uuid not null,
  bus_id uuid,
  student_id uuid,
  event_type text not null check (event_type in ('simulation_started','gps_update','rfid_boarding','rfid_exit','alert','bus_status')),
  source text not null default 'virtual_lab',
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  foreign key (run_id, college_id) references public.simulation_runs(id, college_id) on delete cascade,
  foreign key (bus_id, run_id, college_id) references public.simulation_buses(id, run_id, college_id) on delete cascade,
  foreign key (student_id, run_id, college_id) references public.simulation_students(id, run_id, college_id) on delete cascade
);
create index if not exists simulation_runs_college_created_idx on public.simulation_runs(college_id, created_at desc);
create index if not exists simulation_buses_run_status_idx on public.simulation_buses(run_id, status);
create index if not exists simulation_students_run_attendance_idx on public.simulation_students(run_id, attendance_status);
create index if not exists simulation_locations_college_recorded_idx on public.simulation_locations(college_id, recorded_at desc);
create index if not exists simulation_events_run_occurred_idx on public.simulation_events(run_id, occurred_at desc);
alter table public.simulation_runs enable row level security;
alter table public.simulation_buses enable row level security;
alter table public.simulation_students enable row level security;
alter table public.simulation_locations enable row level security;
alter table public.simulation_events enable row level security;
grant select, insert, update, delete on public.simulation_runs, public.simulation_buses, public.simulation_students, public.simulation_locations, public.simulation_events to authenticated;
drop policy if exists simulation_runs_college_member_access on public.simulation_runs;
drop policy if exists simulation_runs_member_read on public.simulation_runs;
drop policy if exists simulation_runs_owner_insert on public.simulation_runs;
drop policy if exists simulation_runs_owner_update on public.simulation_runs;
drop policy if exists simulation_runs_owner_delete on public.simulation_runs;
create policy simulation_runs_member_read on public.simulation_runs for select to authenticated using (private.is_college_member(college_id));
create policy simulation_runs_owner_insert on public.simulation_runs for insert to authenticated with check (private.is_college_member(college_id) and created_by = (select auth.uid()));
create policy simulation_runs_owner_update on public.simulation_runs for update to authenticated using (private.is_college_member(college_id) and created_by = (select auth.uid())) with check (private.is_college_member(college_id) and created_by = (select auth.uid()));
create policy simulation_runs_owner_delete on public.simulation_runs for delete to authenticated using (private.is_college_member(college_id) and created_by = (select auth.uid()));
drop policy if exists simulation_buses_college_member_access on public.simulation_buses;
drop policy if exists simulation_buses_owner_access on public.simulation_buses;
create policy simulation_buses_owner_access on public.simulation_buses for all to authenticated
  using (exists (select 1 from public.simulation_runs r where r.id = simulation_buses.run_id and r.created_by = (select auth.uid()) and private.is_college_member(r.college_id)))
  with check (exists (select 1 from public.simulation_runs r where r.id = simulation_buses.run_id and r.created_by = (select auth.uid()) and private.is_college_member(r.college_id)));
drop policy if exists simulation_students_college_member_access on public.simulation_students;
drop policy if exists simulation_students_owner_access on public.simulation_students;
create policy simulation_students_owner_access on public.simulation_students for all to authenticated
  using (exists (select 1 from public.simulation_runs r where r.id = simulation_students.run_id and r.created_by = (select auth.uid()) and private.is_college_member(r.college_id)))
  with check (exists (select 1 from public.simulation_runs r where r.id = simulation_students.run_id and r.created_by = (select auth.uid()) and private.is_college_member(r.college_id)));
drop policy if exists simulation_locations_college_member_access on public.simulation_locations;
drop policy if exists simulation_locations_owner_access on public.simulation_locations;
create policy simulation_locations_owner_access on public.simulation_locations for all to authenticated
  using (exists (select 1 from public.simulation_runs r where r.id = simulation_locations.run_id and r.created_by = (select auth.uid()) and private.is_college_member(r.college_id)))
  with check (exists (select 1 from public.simulation_runs r where r.id = simulation_locations.run_id and r.created_by = (select auth.uid()) and private.is_college_member(r.college_id)));
drop policy if exists simulation_events_college_member_access on public.simulation_events;
drop policy if exists simulation_events_owner_access on public.simulation_events;
create policy simulation_events_owner_access on public.simulation_events for all to authenticated
  using (exists (select 1 from public.simulation_runs r where r.id = simulation_events.run_id and r.created_by = (select auth.uid()) and private.is_college_member(r.college_id)))
  with check (exists (select 1 from public.simulation_runs r where r.id = simulation_events.run_id and r.created_by = (select auth.uid()) and private.is_college_member(r.college_id)));
comment on table public.simulation_runs is 'Isolated Virtual Lab runs; never mixed with operational fleet tables.';
comment on table public.simulation_buses is 'Synthetic buses owned by a simulation run.';
comment on table public.simulation_students is 'Synthetic student identities and non-production RFID UIDs for simulation.';
comment on table public.simulation_locations is 'Latest synthetic GPS fix per simulated bus.';
comment on table public.simulation_events is 'Simulation-only GPS, RFID and alert event trace.';
