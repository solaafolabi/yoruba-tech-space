import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Supabase setup
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl!, serviceRoleKey!);

// 🟡 CORS headers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // for dev; replace with your domain in production
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

Deno.serve(async (req) => {
  // 🟡 Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders(),
    });
  }

  try {
    console.log("⚡ verify-payment function triggered");

    // 🟡 Parse request body
    const { reference } = await req.json();
    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Missing reference" }),
        { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }

    // 🟡 Fetch Paystack secret key from DB
    const { data, error } = await supabase
      .from("payment_keys")
      .select("key_value")
      .eq("service", "paystack")
      .eq("key_name", "secret_key")
      .single();

    if (error || !data) {
      console.error("❌ Error fetching Paystack secret key:", error);
      return new Response(
        JSON.stringify({ error: "Paystack secret key not found" }),
        { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }

    const secretKey = data.key_value;

    // 🟡 Verify transaction with Paystack
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await paystackRes.json();
    console.log("✅ Paystack result:", result);

    return new Response(JSON.stringify(result), {
      status: paystackRes.status,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🔥 Function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }
});
