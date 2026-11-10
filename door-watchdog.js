#!/usr/bin/env node

// Door Watchdog — lokalni watchdog za avtomatizacijo vrat
// Zaženi: node door-watchdog.js
// Ili: npm install -g pm2 && pm2 start door-watchdog.js --cron "*/5 * * * *"

const TEDEE_API = "https://api.tedee.com/api/v1.32";
const SUPABASE_URL = "https://vlzyrcdrvvhxvdvuxgki.supabase.co";
const TEDEE_TOKEN = process.env.TEDEE_API_TOKEN || "YOUR_TEDEE_TOKEN";
const LOCK_ID = "399268";
const SERVICE_KEY = process.env.SRC_SERVICE_ROLE_KEY || "YOUR_SERVICE_KEY";

async function checkDoorState() {
  try {
    console.log(`[${new Date().toISOString()}] Checking door state...`);

    // Preveri ali je dnevni način aktiven
    const automationRes = await fetch(
      `${SUPABASE_URL}/rest/v1/door_automation?select=is_day_mode&limit=1`,
      {
        headers: {
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`,
        },
      }
    );
    const automation = await automationRes.json();
    const isDayMode = automation?.[0]?.is_day_mode ?? false;

    if (!isDayMode) {
      console.log("Day mode inactive, skipping.");
      return;
    }

    // Preveri trenutno stanje ključavnice
    const lockRes = await fetch(`${TEDEE_API}/my/lock/${LOCK_ID}`, {
      headers: { Authorization: `PersonalKey ${TEDEE_TOKEN}` },
    });

    if (!lockRes.ok) {
      throw new Error(`Tedee API error: ${lockRes.status}`);
    }

    const lockData = await lockRes.json();
    const state = lockData?.result?.lockProperties?.state;
    const isUnlocked = state === 2 || state === 6;

    console.log(`Lock state: ${isUnlocked ? "UNLOCKED" : "LOCKED"}`);

    // Če je dnevni način aktiven in vrata so zakljenjena, jih ponovno odkleni
    if (isDayMode && !isUnlocked) {
      console.log("Day mode active but locked, unlocking...");
      await fetch(`${TEDEE_API}/my/lock/${LOCK_ID}/operation/pull`, {
        method: "POST",
        headers: {
          Authorization: `PersonalKey ${TEDEE_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
    }

    // Preveri ali je čas za zaklepanje (22:00 CET)
    const now = new Date();
    const hour = now.getUTCHours() + 1; // CET = UTC+1
    if (hour >= 22 && isDayMode && isUnlocked) {
      console.log("22:00 reached, locking and disabling day mode...");
      await fetch(`${TEDEE_API}/my/lock/${LOCK_ID}/operation/lock`, {
        method: "POST",
        headers: {
          Authorization: `PersonalKey ${TEDEE_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      // Posodobi DB
      await fetch(`${SUPABASE_URL}/rest/v1/door_automation?id=neq.null`, {
        method: "PATCH",
        headers: {
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`,
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
      await fetch(`${SUPABASE_URL}/rest/v1/door_automation?id=neq.null`, {
        method: "PATCH",
        headers: {
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          last_checked_at: new Date().toISOString(),
          last_state: isDayMode && isUnlocked ? "day_mode_active" : "idle",
        }),
      });
    }

    console.log("✅ Check complete");
  } catch (e) {
    console.error("❌ Error:", String(e));
  }
}

// Zaženi prvič
checkDoorState();

// Nato vsakih 5 minut
setInterval(checkDoorState, 5 * 60 * 1000);

console.log("Door Watchdog started. Running every 5 minutes.");
console.log(`Set env vars: TEDEE_API_TOKEN=${TEDEE_TOKEN ? "✓" : "✗"} SRC_SERVICE_ROLE_KEY=${SERVICE_KEY ? "✓" : "✗"}`);
