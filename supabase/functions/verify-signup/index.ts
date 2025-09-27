import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RECAPTCHA_SECRET_KEY = Deno.env.get("RECAPTCHA_SECRET_KEY")!;

// Allowed origins (add your production + local dev URLs here)
const allowedOrigins = [
  "http://localhost:5173",   // Vite
  "http://localhost:3000",   // CRA / Next.js
  "https://yourfrontend.com" // Production frontend
];

function getCorsHeaders(origin: string | null) {
  const allowed = allowedOrigins.includes(origin ?? "")
    ? origin
    : allowedOrigins[allowedOrigins.length - 1]; // default to prod
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, fullName, captchaToken } = await req.json();

    if (!email || !password || !fullName || !captchaToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ Verify reCAPTCHA
    const captchaRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        }),
      }
    ).then(r => r.json());

    if (!captchaRes.success) {
      return new Response(
        JSON.stringify({ error: "Captcha verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ Check if email already exists
    const checkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${email}`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }).then(r => r.json());

    if (Array.isArray(checkRes) && checkRes.length > 0) {
      return new Response(
        JSON.stringify({ error: "Email already registered" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ Create user
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: false,
        user_metadata: { full_name: fullName, role: "student" },
      }),
    });
const createRes = await fetch(...);
const userData = await createRes.json();
if (!createRes.ok || !userData.id) {
  console.error("User creation failed:", createRes.status, userData);
  return new Response(
    JSON.stringify({ error: "Signup failed", details: userData }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

    const userId = userData.id;

    // ✅ Insert profile
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: userId, full_name: fullName, role: "student" }),
    });

    // ✅ Insert user status
    await fetch(`${SUPABASE_URL}/rest/v1/user_status`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        username: fullName || email,
        is_online: true,
        last_seen: new Date().toISOString(),
      }),
    });

    return new Response(
      JSON.stringify({ message: "Signup successful" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return new Response(
      JSON.stringify({ error: "Signup failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
