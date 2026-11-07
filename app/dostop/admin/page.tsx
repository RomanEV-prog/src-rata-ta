"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Member = {
  id: string;
  email: string;
  full_name: string | null;
  permission_id: string | null;
  has_access: boolean;
};

type DoorEvent = {
  id: string;
  member_id: string | null;
  requested_at: string;
  result: string;
  lock_state: string | null;
  error_message: string | null;
  email?: string;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<DoorEvent[]>([]);
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addMsg, setAddMsg] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [tab, setTab] = useState<"members" | "log">("members");

  // Login stanje
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setNeedsLogin(true); setLoading(false); return; }
      const role = (session.user.app_metadata as Record<string, string>)?.role;
      if (role !== "admin") { setLoading(false); return; }
      setIsAdmin(true);
      await loadData();
      setLoading(false);
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error || !data.session) {
      setLoginError("Napačen e-naslov ali geslo.");
      setLoginLoading(false);
      return;
    }
    const role = (data.session.user.app_metadata as Record<string, string>)?.role;
    if (role !== "admin") {
      setLoginError("Nimate admin dostopa.");
      await supabase.auth.signOut();
      setLoginLoading(false);
      return;
    }
    setNeedsLogin(false);
    setIsAdmin(true);
    setLoading(true);
    await loadData();
    setLoading(false);
    setLoginLoading(false);
  }

  async function loadData() {
    // Supabase admin API — klic prek Edge Function ni potreben, service role
    // ni dostopen s fronta. Namesto tega: auth.admin je samo za server.
    // Rešitev: pridobimo users prek members tabele + auth admin prek naše funkcije.
    // Za zdaj: members tabela + permissions JOIN.
    const { data: perms } = await supabase
      .from("access_permissions")
      .select("id, member_id, is_active, valid_from, valid_until, members(id, full_name, email)")
      .eq("is_active", true);

    // Zgradi seznam
    const list: Member[] = (perms ?? []).map((p: Record<string, unknown>) => {
      const m = p.members as Record<string, unknown> | null;
      return {
        id: p.member_id as string,
        email: (m?.email as string) ?? "—",
        full_name: (m?.full_name as string) ?? null,
        permission_id: p.id as string,
        has_access: true,
      };
    });
    setMembers(list);

    // Dnevnik odpiranj
    const { data: evts } = await supabase
      .from("door_events")
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(50);
    setEvents(evts ?? []);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setAddMsg("");
    setAddLoading(true);

    try {
      // 1. Poišči ali ustvari auth user prek admin API (ne moremo direktno iz fronta)
      //    Pokličemo Edge Function za admin operacije
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-add-member`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: addEmail, full_name: addName || null }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Napaka");
      setAddMsg(`✅ ${addEmail} dodan z dostopom.`);
      setAddEmail("");
      setAddName("");
      await loadData();
    } catch (err: unknown) {
      setAddMsg(`⚠️ ${err instanceof Error ? err.message : "Napaka"}`);
    }
    setAddLoading(false);
  }

  async function handleRevoke(permissionId: string, email: string) {
    if (!confirm(`Odvzemi dostop: ${email}?`)) return;
    await supabase
      .from("access_permissions")
      .update({ is_active: false })
      .eq("id", permissionId);
    await loadData();
  }

  if (loading) return <Shell><div className="text-white/50">Nalagam...</div></Shell>;

  if (needsLogin || !isAdmin) return (
    <Shell>
      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-white text-xl font-bold text-center mb-1">Admin prijava</h1>
        <p className="text-white/40 text-sm text-center mb-8">ŠRC Ra-Ta-Ta — upravljavski dostop</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            placeholder="E-naslov"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-red-500 transition"
          />
          <input
            type="password"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            placeholder="Geslo"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-red-500 transition"
          />
          {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3 rounded-xl font-bold text-white transition disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #ff3000, #ff6a00)" }}
          >
            {loginLoading ? "Prijavljam..." : "Prijava"}
          </button>
        </form>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-xl font-bold">Admin — Dostop do vrat</h1>
          <Link href="/dostop" className="text-white/40 hover:text-white/70 text-sm transition">← Nazaj</Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["members", "log"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? "bg-red-600 text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
            >
              {t === "members" ? `Člani z dostopom (${members.length})` : "Dnevnik odpiranj"}
            </button>
          ))}
        </div>

        {tab === "members" && (
          <>
            {/* Dodaj člana */}
            <form onSubmit={handleAddMember} className="bg-white/5 rounded-xl p-4 mb-4 space-y-3">
              <p className="text-white/60 text-sm font-medium">Dodaj dostop</p>
              <input
                type="email"
                placeholder="e-naslov člana"
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none focus:border-red-500"
              />
              <input
                type="text"
                placeholder="Ime in priimek (opcijsko)"
                value={addName}
                onChange={e => setAddName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                disabled={addLoading}
                className="w-full py-2 rounded-lg text-white text-sm font-bold disabled:opacity-50 transition"
                style={{ background: "linear-gradient(135deg, #ff3000, #ff6a00)" }}
              >
                {addLoading ? "Dodajam..." : "Dodaj dostop"}
              </button>
              {addMsg && <p className="text-sm text-center text-white/70">{addMsg}</p>}
            </form>

            {/* Seznam */}
            {members.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">Noben član nima dostopa.</p>
            ) : (
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{m.email}</p>
                      {m.full_name && <p className="text-white/40 text-xs">{m.full_name}</p>}
                    </div>
                    <button
                      onClick={() => handleRevoke(m.permission_id!, m.email)}
                      className="text-red-400 hover:text-red-300 text-xs border border-red-500/30 rounded px-2 py-1 transition"
                    >
                      Odvzemi
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "log" && (
          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">Ni odpiranj.</p>
            ) : (
              events.map(ev => (
                <div key={ev.id} className="bg-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-xs">{new Date(ev.requested_at).toLocaleString("sl-SI")}</p>
                    <p className="text-white/40 text-xs">{ev.member_id?.slice(0, 8)}…</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    ev.result === "success" ? "bg-green-500/20 text-green-400" :
                    ev.result === "denied_locked" ? "bg-gray-500/20 text-gray-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {ev.result === "success" ? "ODPRTO" :
                     ev.result === "denied_locked" ? "ZAKLENJENO" :
                     ev.result === "denied_no_permission" ? "BREZ DOVOLJ." : "NAPAKA"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10" style={{ background: "#050505" }}>
      {children}
    </div>
  );
}
