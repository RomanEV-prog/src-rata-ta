const TEDEE_API = "https://api.tedee.com/api/v1.32";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  // Validacija QR ključa
  let key: string | undefined;
  let openedBy: string | null = null;
  try {
    const body = await req.json();
    key = body?.key;
    openedBy = body?.name ?? null;
  } catch {
    return json({ success: false, message: "Napačen zahtevek." }, 400);
  }

  const doorSecret = Deno.env.get("DOOR_SECRET");
  if (!doorSecret || key !== doorSecret) {
    return json({ success: false, message: "Neveljavna QR koda." }, 403);
  }

  const tedeeToken = Deno.env.get("TEDEE_API_TOKEN")!;
  const lockId = Deno.env.get("TEDEE_LOCK_ID")!;

  // Supabase admin samo za logiranje
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SRC_SERVICE_ROLE_KEY")!;

  // Preveri stanje ključavnice
  let lockState = "unknown";
  try {
    const lockRes = await fetch(`${TEDEE_API}/my/lock/${lockId}`, {
      headers: { Authorization: `PersonalKey ${tedeeToken}` },
    });

    if (!lockRes.ok) {
      const errText = await lockRes.text();
      await logEvent(supabaseUrl, serviceKey, lockState, "error", `Tedee status ${lockRes.status}: ${errText}`);
      return json({ success: false, message: "Napaka pri branju stanja ključavnice." }, 502);
    }

    const lockData = await lockRes.json();
    const state = lockData?.result?.lockProperties?.state;
    lockState = state === 2 || state === 6 ? "unlocked" : "locked";
  } catch (e) {
    await logEvent(supabaseUrl, serviceKey, "unknown", "error", String(e));
    return json({ success: false, message: "Napaka pri vzpostavljanju povezave s ključavnico." }, 502);
  }

  // Pull Spring samo če je odklenjena
  if (lockState !== "unlocked") {
    await logEvent(supabaseUrl, serviceKey, lockState, "denied_locked", null, openedBy);
    return json({
      success: false,
      lockState,
      message: "Vrata so trenutno zaklenjena. Pull Spring ni možen.",
    }, 200);
  }

  // Sproži Pull Spring
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
      await logEvent(supabaseUrl, serviceKey, lockState, "error", `Pull Spring ${pullRes.status}: ${errText}`);
      return json({ success: false, message: "Pull Spring ni uspel." }, 502);
    }
  } catch (e) {
    await logEvent(supabaseUrl, serviceKey, lockState, "error", String(e));
    return json({ success: false, message: "Napaka pri izvajanju Pull Spring." }, 502);
  }

  await logEvent(supabaseUrl, serviceKey, lockState, "success", null, openedBy);
  return json({ success: true, lockState, message: "Vrata se odpirajo!" }, 200);
});

async function logEvent(
  supabaseUrl: string,
  serviceKey: string,
  lockState: string | null,
  result: string,
  errorMessage: string | null,
  openedBy: string | null = null,
) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/door_events`, {
      method: "POST",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ lock_state: lockState, result, error_message: errorMessage, opened_by: openedBy }),
    });
  } catch {
    // logiranje ni kritično
  }
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
