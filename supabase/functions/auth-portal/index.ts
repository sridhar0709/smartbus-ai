import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { action, studentId, email, invitationCode } = await req.json();
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return json({ error: "Enter a valid college email address." }, 400);
    }
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: colleges, error: collegeError } = await admin.from("colleges").select("id").limit(1);
    if (collegeError || !colleges?.length) return json({ error: "College workspace is not configured." }, 500);
    const collegeId = colleges[0].id;

    if (action === "student_register" || action === "student_login") {
      const code = String(studentId ?? "").trim();
      if (!code) return json({ error: "Enter your student ID." }, 400);
      const { data: student, error } = await admin.from("students")
        .select("id,college_id,email,active,auth_user_id")
        .eq("college_id", collegeId).ilike("student_code", code).maybeSingle();
      if (error || !student || !student.active || !student.email ||
          student.email.toLowerCase() !== normalizedEmail) {
        return json({ error: "Student ID and registered college email did not match an active roster record." }, 403);
      }
      if (action === "student_login" && !student.auth_user_id) return json({ error: "Register your student account first." }, 403);
      if (action === "student_register") {
        if (student.auth_user_id) return json({ error: "This student ID is already registered. Use Student login." }, 409);
        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email: normalizedEmail, email_confirm: false,
          user_metadata: { role: "student", student_id: student.id, college_id: collegeId },
        });
        if (createError || !created.user) return json({ error: "Could not create student account. If already registered, use Student login or contact college admin." }, 400);
        const { error: updateError } = await admin.from("students").update({ auth_user_id: created.user.id }).eq("id", student.id);
        if (updateError) {
          await admin.auth.admin.deleteUser(created.user.id);
          return json({ error: "Could not link student account to roster." }, 500);
        }
        const { error: memberError } = await admin.from("college_members").insert({
          college_id: collegeId, user_id: created.user.id, role: "student",
        });
        if (memberError) {
          await admin.from("students").update({ auth_user_id: null }).eq("id", student.id);
          await admin.auth.admin.deleteUser(created.user.id);
          return json({ error: "Could not assign student access." }, 500);
        }
      }
      return json({ email: normalizedEmail, message: "Roster verified. Requesting a one-time code." });
    }

    if (action === "admin_login") {
      const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (usersError) return json({ error: "Could not verify admin access." }, 500);
      const account = users.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
      if (!account) return json({ error: "No authorized admin account found for this email." }, 403);
      const { data: membership, error: memberError } = await admin.from("college_members")
        .select("role").eq("college_id", collegeId).eq("user_id", account.id).maybeSingle();
      if (memberError || membership?.role !== "college_admin") {
        return json({ error: "This email is not assigned the college admin role." }, 403);
      }
      return json({ email: normalizedEmail, message: "Admin access verified." });
    }

    if (action === "admin_register") {
      const expected = Deno.env.get("ADMIN_INVITATION_CODE");
      if (!expected || !invitationCode || invitationCode !== expected) {
        return json({ error: "The admin invitation code is invalid." }, 403);
      }
      const { data: created, error } = await admin.auth.admin.createUser({
        email: normalizedEmail, email_confirm: false,
        user_metadata: { role: "college_admin", college_id: collegeId },
      });
      if (error || !created.user) return json({ error: "Could not create admin account. If the email is already registered, contact the super admin." }, 400);
      const { error: memberError } = await admin.from("college_members").insert({
        college_id: collegeId, user_id: created.user.id, role: "college_admin",
      });
      if (memberError) {
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: "Could not assign admin membership." }, 500);
      }
      return json({ email: normalizedEmail, message: "Invitation accepted. Requesting a one-time code." });
    }
    return json({ error: "Unsupported authentication action." }, 400);
  } catch {
    return json({ error: "Invalid request or authentication service unavailable." }, 400);
  }
});
