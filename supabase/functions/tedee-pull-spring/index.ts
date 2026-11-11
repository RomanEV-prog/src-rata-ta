const TEDEE_API = "https://api.tedee.com/api/v1.32";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  let key: string | undefined;
  let openedBy: string | null = null;
  try {
    const body = await req.json();
    key = body?.key;
    openedBy = body?.name ?? null;
  } catch {
    return json({ success: false, message: "Napačen zahtevek." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SRC_SERVICE_ROLE_KEY")!;

  // Poiščemo skupino po ključu
  let groupId: string | null = null;
  let groupName: string | null = null;
  try {
    const groupRes = await fetch(
      `${supabaseUrl}/rest/v1/door_groups?key=eq.${encodeURIComponent(key ?? "")}&is_active=eq.true&select=id,name`,
      {
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
        },
      }
    );
    const groups = await groupRes.json();
    if (!Array.isArray(groups) || groups.length === 0) {
      return json({ success: false, message: "Neveljavna QR koda." }, 403);
    }
    groupId = groups[0].id;
    groupName = groups[0].name;
  } catch {
    return json({ success: false, message: "Napaka pri preverjanju dostopa." }, 500);
  }

  const tedeeToken = Deno.env.get("TEDEE_API_TOKEN")!;
  const lockId = Deno.env.get("TEDEE_LOCK_ID")!;

  // Preveri stanje ključavnice
  let lockState = "unknown";
  try {
    const lockRes = await fetch(`${TEDEE_API}/my/lock/${lockId}`, {
      headers: { Authorization: `PersonalKey ${tedeeToken}` },
    });

    if (!lockRes.ok) {
      const errText = await lockRes.text();
      await logEvent(supabaseUrl, serviceKey, lockState, "error", `Tedee status ${lockRes.status}: ${errText}`, openedBy, groupId, groupName);
      return json({ success: false, message: "Napaka pri branju stanja ključavnice." }, 502);
    }

    const lockData = await lockRes.json();
    const state = lockData?.result?.lockProperties?.state;
    lockState = state === 2 || state === 6 ? "unlocked" : "locked";
  } catch (e) {
    await logEvent(supabaseUrl, serviceKey, "unknown", "error", String(e), openedBy, groupId, groupName);
    return json({ success: false, message: "Napaka pri vzpostavljanju povezave s ključavnico." }, 502);
  }

  // Pull Spring samo če je odklenjena
  if (lockState !== "unlocked") {
    await logEvent(supabaseUrl, serviceKey, lockState, "denied_locked", null, openedBy, groupId, groupName);
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
      await logEvent(supabaseUrl, serviceKey, lockState, "error", `Pull Spring ${pullRes.status}: ${errText}`, openedBy, groupId, groupName);
      return json({ success: false, message: "Pull Spring ni uspel." }, 502);
    }
  } catch (e) {
    await logEvent(supabaseUrl, serviceKey, lockState, "error", String(e), openedBy, groupId, groupName);
    return json({ success: false, message: "Napaka pri izvajanju Pull Spring." }, 502);
  }

  // Počakaj 1 sekundo, potem ponovno preveri stanje
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    const verifyRes = await fetch(`${TEDEE_API}/my/lock/${lockId}`, {
      headers: { Authorization: `PersonalKey ${tedeeToken}` },
    });

    if (verifyRes.ok) {
      const verifyData = await verifyRes.json();
      const verifyState = verifyData?.result?.lockProperties?.state;
      const verifyUnlocked = verifyState === 2 || verifyState === 6;

      if (!verifyUnlocked) {
        // Pull Spring je bil sprožen, ampak vrata ostanejo zaklenjena
        await logEvent(supabaseUrl, serviceKey, "locked", "error", "Pull Spring sprožen, ampak vrata ostanejo zaklenjena", openedBy, groupId, groupName);
        return json({
          success: false,
          lockState: "locked",
          message: "Vrata ostanejo zaklenjena. Ključavnica je morda v napaki."
        }, 200);
      }
    }
  } catch (e) {
    // Ako verify pade - zasitniji pristup: vrati error
    await logEvent(supabaseUrl, serviceKey, "unknown", "error", "Verify failed: " + String(e), openedBy, groupId, groupName);
    return json({ success: false, lockState: "unknown", message: "Vrata se morda odpirajo, ampak ne morem preveri stanja." }, 200);
  }

  await logEvent(supabaseUrl, serviceKey, "unlocked", "success", null, openedBy, groupId, groupName);
  return json({ success: true, lockState: "unlocked", message: "✅ Vrata se odpirajo!" }, 200);
});

async function logEvent(
  supabaseUrl: string,
  serviceKey: string,
  lockState: string | null,
  result: string,
  errorMessage: string | null,
  openedBy: string | null = null,
  groupId: string | null = null,
  groupName: string | null = null,
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
      body: JSON.stringify({
        lock_state: lockState,
        result,
        error_message: errorMessage,
        opened_by: openedBy,
        group_id: groupId,
        group_name: groupName,
      }),
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
