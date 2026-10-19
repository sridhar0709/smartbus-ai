-- SmartBus AI dashboard compatibility migration.
-- Applied to Supabase project luvknncxtvgfwlshxtrs on 2026-10-19.
-- Safe to re-run: columns, constraints, indexes, and policies are guarded.
-- Existing data is preserved.

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='buses' and column_name='route_id') then
    alter table public.buses add column route_id uuid;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='buses' and column_name='driver_id') then
    alter table public.buses add column driver_id uuid;
  end if;
  if not exists (select 1 from pg_constraint where conname='routes_id_college_id_key' and conrelid='public.routes'::regclass) then
    alter table public.routes add constraint routes_id_college_id_key unique (id, college_id);
  end if;
  if not exists (select 1 from pg_constraint where conname='drivers_id_college_id_key' and conrelid='public.drivers'::regclass) then
    alter table public.drivers add constraint drivers_id_college_id_key unique (id, college_id);
  end if;
  if not exists (select 1 from pg_constraint where conname='buses_route_college_fkey' and conrelid='public.buses'::regclass) then
    alter table public.buses add constraint buses_route_college_fkey
      foreign key (route_id, college_id) references public.routes(id, college_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='buses_driver_college_fkey' and conrelid='public.buses'::regclass) then
    alter table public.buses add constraint buses_driver_college_fkey
      foreign key (driver_id, college_id) references public.drivers(id, college_id) on delete restrict;
  end if;
end $$;

create index if not exists buses_route_id_idx on public.buses(route_id);
create index if not exists buses_driver_id_idx on public.buses(driver_id);
create index if not exists alerts_college_created_at_idx on public.alerts(college_id, created_at desc);
create index if not exists attendance_college_date_idx on public.attendance(college_id, attendance_date);
create index if not exists gps_positions_bus_recorded_at_idx on public.gps_positions(bus_id, recorded_at desc);

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='alerts' and policyname='alerts_college_member_read') then
    create policy alerts_college_member_read on public.alerts
      for select to authenticated using (private.is_college_member(college_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='attendance' and policyname='attendance_college_member_read') then
    create policy attendance_college_member_read on public.attendance
      for select to authenticated using (private.is_college_member(college_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='gps_positions' and policyname='gps_positions_college_member_read') then
    create policy gps_positions_college_member_read on public.gps_positions
      for select to authenticated using (
        exists (
          select 1 from public.buses b
          where b.id = gps_positions.bus_id
            and private.is_college_member(b.college_id)
        )
      );
  end if;
end $$;
