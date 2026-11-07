"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

type DoorStatus = "idle" | "loading" | "success" | "locked" | "no_permission" | "error";

export default function DostopPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [doorStatus, setDoorStatus] = useState<DoorStatus>("idle");
  const [doorMessage, setDoorMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkPermission(session.user);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkPermission(session.user);
      else {
        setAuthLoading(false);
        setHasPermission(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkPermission(u: User) {
    setAuthLoading(true);
    const role = (u.app_metadata as Record<string, string>)?.role;
    setIsAdmin(role === "admin");

    const now = new Date().toISOString();
    const { data } = await supabase
      .from("access_permissions")
      .select("id")
      .eq("member_id", u.id)
      .eq("is_active", true)
      .or(`valid_from.is.null,valid_from.lte.${now}`)
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .maybeSingle();

    setHasPermission(!!data);
    setAuthLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError("Napačen e-naslov ali geslo.");
    setLoginLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setDoorStatus("idle");
    setDoorMessage("");
  }

  async function handlePullSpring() {
    setDoorStatus("loading");
    setDoorMessage("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setDoorStatus("error"); setDoorMessage("Seja je potekla. Prijavite se znova."); return; }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/tedee-pull-spring`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();

      if (data.success) {
        setDoorStatus("success");
        setDoorMessage(data.message ?? "Vrata se odpirajo!");
      } else if (data.lockState === "locked") {
        setDoorStatus("locked");
        setDoorMessage("Vrata so zaklenjena. Počakajte, da upravljavec odklene.");
      } else if (res.status === 403) {
        setDoorStatus("no_permission");
        setDoorMessage("Nimate aktivnega dovoljenja.");
      } else {
        setDoorStatus("error");
        setDoorMessage(data.message ?? "Napaka pri odpiranju vrat.");
      }
    } catch {
      setDoorStatus("error");
      setDoorMessage("Napaka pri vzpostavljanju povezave. Preverite internet.");
    }

    setTimeout(() => setDoorStatus("idle"), 5000);
  }

  // ── Nalaganje ──
  if (authLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Shell>
    );
  }

  // ── Prijava ──
  if (!user) {
    return (
      <Shell>
        <div className="max-w-sm mx-auto w-full">
          <div className="mb-8 text-center">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-2xl font-bold text-white">Dostop do ŠRC</h1>
            <p className="text-white/50 mt-1 text-sm">Prijavite se za odpiranje vrat</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">E-naslov</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-red-500 transition"
                placeholder="ime@primer.si"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Geslo</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-red-500 transition"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <p className="text-red-400 text-sm text-center">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-lg font-bold text-white text-lg transition disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #ff3000, #ff6a00)" }}
            >
              {loginLoading ? "Prijavljam..." : "Prijava"}
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  // ── Prijavljen ──
  const statusConfig: Record<DoorStatus, { bg: string; icon: string; label: string }> = {
    idle: { bg: "linear-gradient(135deg, #ff3000, #ff6a00)", icon: "🚪", label: "ODPRI VRATA" },
    loading: { bg: "rgba(255,48,0,0.4)", icon: "⏳", label: "Pošiljam ukaz..." },
    success: { bg: "linear-gradient(135deg, #22c55e, #16a34a)", icon: "✅", label: "VRATA SE ODPIRAJO" },
    locked: { bg: "rgba(100,100,100,0.5)", icon: "🔒", label: "ZAKLENJENA" },
    no_permission: { bg: "rgba(239,68,68,0.3)", icon: "⛔", label: "NI DOVOLJENJA" },
    error: { bg: "rgba(239,68,68,0.3)", icon: "⚠️", label: "NAPAKA" },
  };

  const sc = statusConfig[doorStatus];

  return (
    <Shell>
      <div className="max-w-sm mx-auto w-full text-center">
        {/* Pozdrav */}
        <p className="text-white/40 text-sm mb-1">Prijavljeni kot</p>
        <p className="text-white font-medium mb-6 truncate">{user.email}</p>

        {isAdmin && (
          <Link
            href="/dostop/admin"
            className="inline-block mb-6 text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded px-3 py-1 transition"
          >
            Admin panel →
          </Link>
        )}

        {/* Gumb za odpiranje */}
        {hasPermission === false && !isAdmin ? (
          <div className="rounded-2xl p-8 mb-6" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="text-4xl mb-3">⛔</div>
            <p className="text-red-400 font-semibold">Nimate aktivnega dostopa</p>
            <p className="text-white/40 text-sm mt-2">Obrnite se na upravljavca ŠRC.</p>
          </div>
        ) : (
          <>
            <button
              onClick={handlePullSpring}
              disabled={doorStatus === "loading" || doorStatus === "success"}
              className="w-full h-48 rounded-2xl font-black text-2xl text-white tracking-widest transition-all duration-300 active:scale-95 disabled:cursor-not-allowed shadow-lg mb-4"
              style={{ background: sc.bg, boxShadow: doorStatus === "idle" ? "0 0 40px rgba(255,48,0,0.4)" : "none" }}
            >
              <span className="block text-5xl mb-2">{sc.icon}</span>
              {sc.label}
            </button>

            {doorMessage && (
              <p className={`text-sm font-medium ${doorStatus === "success" ? "text-green-400" : "text-red-400"}`}>
                {doorMessage}
              </p>
            )}

            <p className="text-white/25 text-xs mt-4">
              Gumb deluje samo, ko so vrata odklenjena.
            </p>
          </>
        )}

        <button
          onClick={handleLogout}
          className="mt-8 text-white/30 hover:text-white/60 text-sm transition"
        >
          Odjava
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "#050505" }}
    >
      <div className="mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white mx-auto"
          style={{ background: "linear-gradient(135deg, #ff3000, #ff6a00)" }}
        >
          ŠRC
        </div>
      </div>
      {children}
    </div>
  );
}
