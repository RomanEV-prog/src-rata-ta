import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TEDEE_API = "https://api.tedee.com/api/v1.32";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ success: false, message: "Manjka avtentikacija." }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SRC_SERVICE_ROLE_KEY")!
  );

  // 1. Preveri JWT in dobi člana
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return json({ success: false, message: "Neveljavna seja." }, 401);
  }

  // 2. Preveri dovoljenje dostopa
  const now = new Date().toISOString();
  const { data: perm } = await supabase
    .from("access_permissions")
    .select("id")
    .eq("member_id", user.id)
    .eq("is_active", true)
    .or(`valid_from.is.null,valid_from.lte.${now}`)
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .maybeSingle();

  if (!perm) {
    await logEvent(supabaseAdmin, user.id, null, "denied_no_permission", null);
    return json({ success: false, message: "Nimate aktivnega dovoljenja za dostop." }, 403);
  }

  // 3. Preveri stanje ključavnice prek Tedee API
  const tedeeToken = Deno.env.get("TEDEE_API_TOKEN")!;
  const lockId = Deno.env.get("TEDEE_LOCK_ID")!;

  let lockState = "unknown";
  try {
    const lockRes = await fetch(`${TEDEE_API}/my/lock/${lockId}`, {
      headers: { Authorization: `PersonalKey ${tedeeToken}` },
    });

    if (!lockRes.ok) {
      const errText = await lockRes.text();
      await logEvent(supabaseAdmin, user.id, lockState, "error", `Tedee status ${lockRes.status}: ${errText}`);
      return json({ success: false, message: "Napaka pri branju stanja ključavnice." }, 502);
    }

    const lockData = await lockRes.json();
    // Tedee lock state: 2 = unlocked, 6 = pulling, ostalo = locked/unknown
    const state = lockData?.lockProperties?.state;
    lockState = state === 2 || state === 6 ? "unlocked" : "locked";
  } catch (e) {
    await logEvent(supabaseAdmin, user.id, "unknown", "error", String(e));
    return json({ success: false, message: "Napaka pri vzpostavljanju povezave s ključavnico." }, 502);
  }

  // 4. Pull Spring samo če je odklenjena
  if (lockState !== "unlocked") {
    await logEvent(supabaseAdmin, user.id, lockState, "denied_locked", null);
    return json({
      success: false,
      lockState,
      message: "Vrata so trenutno zaklenjena. Pull Spring ni možen.",
    }, 200);
  }

  // 5. Sproži Pull Spring
  try {
    const pullRes = await fetch(`${TEDEE_API}/my/lock/${lockId}/operation/pull`, {
      method: "POST",
      headers: {
        Authorization: `PersonalKey ${tedeeToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!pullRes.ok) {
      const errText = await pullRes.text();
      await logEvent(supabaseAdmin, user.id, lockState, "error", `Pull Spring ${pullRes.status}: ${errText}`);
      return json({ success: false, message: "Pull Spring ni uspel." }, 502);
    }
  } catch (e) {
    await logEvent(supabaseAdmin, user.id, lockState, "error", String(e));
    return json({ success: false, message: "Napaka pri izvajanju Pull Spring." }, 502);
  }

  await logEvent(supabaseAdmin, user.id, lockState, "success", null);
  return json({ success: true, lockState, message: "Vrata se odpirajo!" }, 200);
});

async function logEvent(
  client: ReturnType<typeof createClient>,
  memberId: string,
  lockState: string | null,
  result: string,
  errorMessage: string | null
) {
  await client.from("door_events").insert({
    member_id: memberId,
    lock_state: lockState,
    result,
    error_message: errorMessage,
  });
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
