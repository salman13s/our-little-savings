import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const authHeader = req.headers.get("Authorization") || "";

  try {
    const body = await req.json();
    const action = body?.action;

    if (action === "request") {
      const email = String(body.email || "").trim().toLowerCase();
      const name = String(body.name || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !name || name.length > 80) {
        return json({ error: "Please provide a valid email address and name." }, 400);
      }
      const { data, error } = await admin.from("access_requests").insert({ email, name }).select("id").single();
      if (error) {
        if (error.code === "23505") return json({ error: "There is already a pending request for this email address." }, 409);
        console.error("Request insert failed", error);
        return json({ error: "We couldn't submit your request. Please try again later." }, 500);
      }

      const resendKey = Deno.env.get("RESEND_API_KEY");
      const adminEmail = Deno.env.get("ADMIN_EMAIL");
      const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
      if (resendKey && adminEmail && fromEmail) {
        const mail = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: fromEmail,
            to: [adminEmail],
            subject: "New private-site access request",
            text: `A new access request was submitted.\n\nName: ${name}\nEmail: ${email}\n\nSign in to your private site as admin to approve or decline it.`,
          }),
        });
        if (!mail.ok) console.error("Resend notification failed", await mail.text());
      } else {
        console.warn("Email notification not configured. Set RESEND_API_KEY, ADMIN_EMAIL and RESEND_FROM_EMAIL.");
      }
      return json({ ok: true, request_id: data.id });
    }

    // All actions below require the signed-in administrator.
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Sign-in required." }, 401);
    const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
    const { data: userData, error: userError } = await caller.auth.getUser(token);
    if (userError || userData.user?.app_metadata?.role !== "admin") return json({ error: "Administrator access required." }, 403);

    if (action === "list") {
      const { data, error } = await admin.from("access_requests").select("id,email,name,status,created_at,decided_at").order("created_at", { ascending: false }).limit(50);
      if (error) return json({ error: "Could not load access requests." }, 500);
      return json({ requests: data || [] });
    }

    if (action === "approve" || action === "decline") {
      const requestId = String(body.request_id || "");
      const { data: request, error: requestError } = await admin.from("access_requests").select("*").eq("id", requestId).single();
      if (requestError || !request) return json({ error: "Access request not found." }, 404);
      if (request.status !== "pending") return json({ error: "This request has already been decided." }, 409);

      // Approval records the decision only. The administrator creates the
      // approved user's account manually in Supabase; no email is sent.
      const { error: updateError } = await admin.from("access_requests").update({ status: action === "approve" ? "approved" : "declined", decided_at: new Date().toISOString() }).eq("id", requestId);
      if (updateError) return json({ error: "The request was processed, but its status could not be updated. Please refresh and check the request." }, 500);
      return json({ ok: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: "Unexpected server error." }, 500);
  }
});
