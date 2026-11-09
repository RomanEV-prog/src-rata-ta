const TEDEE_API = "https://api.tedee.com/api/v1.32";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
      },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SRC_SERVICE_ROLE_KEY")!;
  const tedeeToken = Deno.env.get("TEDEE_API_TOKEN")!;
  const lockId = Deno.env.get("TEDEE_LOCK_ID")!;

  try {
    // Preveri ali je dnevni način aktiven
    const automationRes = await fetch(
      `${supabaseUrl}/rest/v1/door_automation?select=is_day_mode&limit=1`,
      {
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
        },
      }
    );
    const automation = await automationRes.json();
    const isDayMode = automation?.[0]?.is_day_mode ?? false;

    // Preveri trenutno stanje ključavnice
    const lockRes = await fetch(`${TEDEE_API}/my/lock/${lockId}`, {
      headers: { Authorization: `PersonalKey ${tedeeToken}` },
    });

    if (!lockRes.ok) {
      throw new Error(`Tedee API error: ${lockRes.status}`);
    }

    const lockData = await lockRes.json();
    const state = lockData?.result?.lockProperties?.state;
    const isUnlocked = state === 2 || state === 6;

    // Če je dnevni način aktiven in vrata so zakljenjena, jih ponovno odkleni
    if (isDayMode && !isUnlocked) {
      await fetch(`${TEDEE_API}/my/lock/${lockId}/operation/pull`, {
        method: "POST",
        headers: {
          Authorization: `PersonalKey ${tedeeToken}`,
          "Content-Type": "application/json",
        },
      });
    }

    // Preveri ali je čas za zaklepanje (22:00)
    const now = new Date();
    const hour = now.getUTCHours() + 2; // Ljubljana timezone (+2)
    if (hour >= 22 && isDayMode && isUnlocked) {
      // Zakleni in izključi dnevni način
      await fetch(`${TEDEE_API}/my/lock/${lockId}/operation/lock`, {
        method: "POST",
        headers: {
          Authorization: `PersonalKey ${tedeeToken}`,
          "Content-Type": "application/json",
        },
      });

      // Posodobi DB
      await fetch(`${supabaseUrl}/rest/v1/door_automation?id=neq.null`, {
        method: "PATCH",
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_day_mode: false,
          last_checked_at: new Date().toISOString(),
          last_state: "auto_locked_22h",
        }),
      });
    } else {
      // Samo posodobi čas zadnjega preverjanja
      await fetch(`${supabaseUrl}/rest/v1/door_automation?id=neq.null`, {
        method: "PATCH",
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          last_checked_at: new Date().toISOString(),
          last_state: isDayMode && isUnlocked ? "day_mode_active" : "idle",
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true, isDayMode, isUnlocked }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
