-- SmartBus AI student and admin authentication
-- Existing student records must be populated with the institution-verified email before student registration.
alter table public.students add column if not exists email text;
alter table public.students add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
create unique index if not exists students_auth_user_id_unique on public.students(auth_user_id) where auth_user_id is not null;
create unique index if not exists students_email_unique on public.students(lower(email)) where email is not null;
alter table public.college_members drop constraint if exists college_members_role_check;
alter table public.college_members add constraint college_members_role_check
  check (role = any (array['college_admin','dispatcher','driver','parent','student']));

-- Authenticated students may only read their own student row and attendance.
create policy "students_read_own_profile" on public.students
  for select to authenticated using (auth_user_id = auth.uid());
create policy "students_read_own_attendance" on public.attendance
  for select to authenticated using (
    exists (select 1 from public.students s where s.id = attendance.student_id and s.auth_user_id = auth.uid())
  );
create policy "students_read_own_attendance_events" on public.attendance_events
  for select to authenticated using (
    exists (select 1 from public.students s where s.id = attendance_events.student_id and s.auth_user_id = auth.uid())
  );
create policy "students_read_own_alerts" on public.alerts
  for select to authenticated using (
    exists (select 1 from public.students s where s.id = alerts.student_id and s.auth_user_id = auth.uid())
  );
