"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DoorEvent = {
  id: string;
  requested_at: string;
  result: string;
  lock_state: string | null;
  error_message: string | null;
  opened_by: string | null;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [events, setEvents] = useState<DoorEvent[]>([]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setNeedsLogin(true); setLoading(false); return; }
      const role = (session.user.app_metadata as Record<string, string>)?.role;
      if (role !== "admin") { setNeedsLogin(true); setLoading(false); return; }
      setIsAdmin(true);
      await loadEvents();
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
    await loadEvents();
    setLoading(false);
    setLoginLoading(false);
  }

  async function loadEvents() {
    const { data } = await supabase
      .from("door_events")
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(100);
    setEvents(data ?? []);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setNeedsLogin(true);
  }

  if (loading) return <Shell><div className="text-white/50">Nalagam...</div></Shell>;

  if (needsLogin || !isAdmin) return (
    <Shell>
      <div className="max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <div className="text-3xl mb-3">🔐</div>
          <h1 className="text-white text-xl font-bold mb-1">Admin prijava</h1>
          <p className="text-white/40 text-sm">ŠRC Ra-Ta-Ta — upravljavski dostop</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            placeholder="E-naslov"
            required
            autoComplete="email"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-red-500 transition"
          />
          <input
            type="password"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            placeholder="Geslo"
            required
            autoComplete="current-password"
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
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-lg font-bold">Dnevnik odpiranj vrat</h1>
          <button onClick={handleLogout} className="text-white/30 hover:text-white/60 text-xs transition">Odjava</button>
        </div>

        <button
          onClick={loadEvents}
          className="mb-4 text-xs text-white/40 hover:text-white/70 border border-white/10 rounded px-3 py-1 transition"
        >
          ↻ Osveži
        </button>

        {events.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-12">Ni zabeleženih odpiranj.</p>
        ) : (
          <div className="space-y-2">
            {events.map(ev => (
              <div key={ev.id} className="bg-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {ev.opened_by ?? <span className="text-white/30 italic">neznano</span>}
                  </p>
                  <p className="text-white/40 text-xs">{new Date(ev.requested_at).toLocaleString("sl-SI")}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ${
                  ev.result === "success"       ? "bg-green-500/20 text-green-400" :
                  ev.result === "denied_locked" ? "bg-gray-500/20 text-gray-400" :
                                                  "bg-red-500/20 text-red-400"
                }`}>
                  {ev.result === "success"       ? "ODPRTO" :
                   ev.result === "denied_locked" ? "ZAKLENJENO" : "NAPAKA"}
                </span>
              </div>
            ))}
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
