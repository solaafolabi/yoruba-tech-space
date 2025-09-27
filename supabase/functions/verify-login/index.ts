// supabase/functions/verify-login/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RECAPTCHA_SECRET_KEY = Deno.env.get("RECAPTCHA_SECRET_KEY")!;

const MAX_FAILED = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Access-Control-Allow-Credentials": "true",
};

// Messages for i18n
const messages = {
  invalidCredentials: { en: "Invalid email or password", yo: "Imeeli tabi ọrọigbaniwọle ko pe" },
  tooManyAttempts: { en: "Too many login attempts. Please wait a minute.", yo: "Ọpọlọpọ igbiyanju wiwọle. Jọwọ duro iṣẹju kan." },
  captchaFailed: { en: "Captcha verification failed", yo: "Ìdánimọ Captcha kuna" },
  serverError: { en: "Unexpected server error", yo: "Aṣiṣe olupin airotẹlẹ" },
};

async function getAttempts(ip: string, email: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/login_attempts?select=count,last_time&ip=eq.${ip}&email=eq.${email}`, {
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  return res.ok ? (await res.json())[0] : null;
}

async function recordFailedLogin(ip: string, email: string) {
  const now = new Date().toISOString();
  const existing = await getAttempts(ip, email);

  if (!existing) {
    // first failure
    await fetch(`${SUPABASE_URL}/rest/v1/login_attempts`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ip, email, count: 1, last_time: now }),
    });
    return 1;
  }

  // if older than window, reset to 1
  const lastTime = new Date(existing.last_time).getTime();
  if (Date.now() - lastTime > WINDOW_MS) {
    await fetch(`${SUPABASE_URL}/rest/v1/login_attempts?ip=eq.${ip}&email=eq.${email}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ count: 1, last_time: now }),
    });
    return 1;
  }

  const newCount = existing.count + 1;
  await fetch(`${SUPABASE_URL}/rest/v1/login_attempts?ip=eq.${ip}&email=eq.${email}`, {
    method: "PATCH",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ count: newCount, last_time: now }),
  });
  return newCount;
}

async function resetAttempts(ip: string, email: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/login_attempts?ip=eq.${ip}&email=eq.${email}`, {
    method: "DELETE",
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
}

async function isBlocked(ip: string, email: string) {
  const attempt = await getAttempts(ip, email);
  if (!attempt) return false;

  const lastTime = new Date(attempt.last_time).getTime();
  return attempt.count >= MAX_FAILED && Date.now() - lastTime < WINDOW_MS;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { provider, email, password, captchaToken } = await req.json();
    const isTestCaptcha = captchaToken === "test";

    // 🔹 Block before hitting Supabase
    if (await isBlocked(ip, email)) {
      return new Response(
        JSON.stringify({ error: messages.tooManyAttempts.en }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": (WINDOW_MS / 1000).toString(),
          },
        }
      );
    }

    // reCAPTCHA check
    if (!isTestCaptcha) {
      const captchaRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        }),
      }).then(r => r.json());

      if (!captchaRes.success) {
        return new Response(
          JSON.stringify({ error: messages.captchaFailed.en }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (provider === "password") {
      // Supabase login
      const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok || !loginData.user) {
        const attempts = await recordFailedLogin(ip, email);
        console.log(`Failed login #${attempts} for ${ip}:${email}`);

        if (await isBlocked(ip, email)) {
          return new Response(
            JSON.stringify({ error: messages.tooManyAttempts.en }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: messages.invalidCredentials.en }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ✅ Successful login → reset attempts
      await resetAttempts(ip, email);

      const userId = loginData.user.id;

      // Fetch role
      let role = "unknown";
      const childRes = await fetch(`${SUPABASE_URL}/rest/v1/children?select=id&user_id=eq.${userId}`, {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }).then(r => r.json());

      if (childRes.length > 0) {
        role = "child";
      } else {
        const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=role&id=eq.${userId}`, {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }).then(r => r.json());
        if (profileRes[0]?.role) role = profileRes[0].role.toLowerCase();
      }

      const dashboardPath = {
        child: "/kids/dashboard",
        parent: "/parents/dashboard",
        super_admin: "/admin/dashboard",
        student: "/dashboard",
      }[role] || "/login";

      return new Response(
        JSON.stringify({ url: dashboardPath, session: loginData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unsupported provider" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: messages.serverError.en }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
