# Student and Admin Authentication Setup

## Important deployment order
This feature branch is not production-ready until the database migration and Edge Function are deployed and verified. Do not merge to production before completing these steps in a Supabase development branch and Vercel Preview.

## Student onboarding
1. A college administrator must import/maintain each active student in `public.students` with a unique `student_code` and the student's verified college `email`.
2. Deploy migration `supabase/migrations/202609250001_student_admin_auth.sql` to a Supabase development branch first.
3. The student enters the roster ID and the same verified email. The Edge Function checks the roster server-side before account creation.
4. Supabase Auth email OTP must be enabled and configured with a working email provider.

## Admin onboarding
1. Set `ADMIN_INVITATION_CODE` as a Supabase Edge Function secret. Use a long, randomly generated value; never expose it in a NEXT_PUBLIC variable or frontend source.
2. Set `APP_ORIGIN` to the exact Vercel Preview origin for CORS. Avoid wildcard origins in deployed environments.
3. Only people holding the invitation code can create an admin account. Existing admin login is checked against `college_members.role = 'college_admin'` server-side.

## Edge Function secrets
Set on the Supabase development project:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side secret only; never in browser or Vercel NEXT_PUBLIC variables)
- `ADMIN_INVITATION_CODE`
- `APP_ORIGIN`

Deploy `supabase/functions/auth-portal/index.ts` as the `auth-portal` function to the development project.

## Validation gate
- Confirm student ID + roster email mismatch is rejected.
- Confirm inactive/unlisted students are rejected.
- Confirm student OTP succeeds only after server-side roster validation.
- Confirm invalid admin invitation code and non-admin email are rejected.
- Confirm service-role key and invitation code do not appear in client bundles or logs.
- Confirm RLS prevents a student from reading other students' data or admin-only tables.
- Test all flows using Vercel Preview and a Supabase development project before any production deployment.

The Edge Function provisions accounts with email confirmation disabled and then relies on Supabase Auth OTP verification for the actual session. Configure Auth email OTP and rate limits before testing.
