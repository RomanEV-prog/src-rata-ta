import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ message: "Manjka avtentikacija." }, 401);

  // Preveri da je klic od admina
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return json({ message: "Neveljavna seja." }, 401);

  const isAdmin = (user.app_metadata as Record<string, string>)?.role === "admin";
  if (!isAdmin) return json({ message: "Dostop zavrnjen." }, 403);

  const { email, full_name } = await req.json();
  if (!email) return json({ message: "Email je obvezen." }, 400);

  // Admin client za upravljanje users
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SRC_SERVICE_ROLE_KEY")!
  );

  // 1. Poišči ali ustvari auth user
  let userId: string;
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === email);

  if (found) {
    userId = found.id;
  } else {
    // Ustvari novega z naključnim geslom — član si ga nastavi prek reset
    const tempPass = crypto.randomUUID();
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: tempPass,
      email_confirm: true,
    });
    if (createErr || !created.user) return json({ message: `Napaka pri ustvarjanju: ${createErr?.message}` }, 500);
    userId = created.user.id;
  }

  // 2. Ustvari ali posodobi member zapis
  await admin.from("members").upsert({ id: userId, email, full_name: full_name ?? null, is_active: true });

  // 3. Deaktiviraj morebitna obstoječa dovoljenja in dodaj novo
  await admin.from("access_permissions").update({ is_active: false }).eq("member_id", userId);
  const { error: permErr } = await admin.from("access_permissions").insert({
    member_id: userId,
    is_active: true,
  });
  if (permErr) return json({ message: `Napaka pri dovoljenju: ${permErr.message}` }, 500);

  // Pošlji reset gesla novemu članu
  if (!found) {
    await admin.auth.admin.generateLink({ type: "recovery", email });
  }

  return json({ success: true, userId, isNew: !found }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
