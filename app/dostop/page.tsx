"use client";

import { useEffect, useState } from "react";

type DoorStatus = "idle" | "loading" | "success" | "locked" | "error" | "no_key";

export default function DostopPage() {
  const [doorStatus, setDoorStatus] = useState<DoorStatus>("idle");
  const [doorMessage, setDoorMessage] = useState("");
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    try {
      // Ob skeniranju QR kode shranimo ključ v localStorage
      const hash = window.location.hash.slice(1);
      if (hash) {
        localStorage.setItem("src_dostop_key", hash);
        // Počistimo hash iz URL-ja brez reload-a
        history.replaceState(null, "", window.location.pathname);
      }
      const savedKey = localStorage.getItem("src_dostop_key");
      setHasKey(!!savedKey);

      const savedName = localStorage.getItem("src_dostop_name");
      if (savedName) { setName(savedName); setNameSet(true); }
    } catch {
      const hash = window.location.hash.slice(1);
      setHasKey(!!hash);
    }
  }, []);

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = nameInput.trim();
    if (!n) return;
    setName(n);
    setNameSet(true);
    try { localStorage.setItem("src_dostop_name", n); } catch { /* nič */ }
  }

  async function handlePullSpring() {
    let key: string | null = null;
    try { key = localStorage.getItem("src_dostop_key"); } catch { /* nič */ }
    if (!key) key = window.location.hash.slice(1);
    if (!key) { setDoorStatus("no_key"); return; }

    setDoorStatus("loading");
    setDoorMessage("");

    let data: any = null;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tedee-pull-spring`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ key, name: name || null }),
        }
      );
      data = await res.json();

      if (data.success) {
        setDoorStatus("success");
        setDoorMessage("Vrata se odpirajo! 🔓");
      } else if (!data.success && (data.lockState === "locked" || data.lockState === "unknown")) {
        setDoorStatus("locked");
        setDoorMessage("⚠️ Vrata so zaklenjena. Prosimo, počakajte ali kontaktirajte upravljavca.");
      } else if (res.status === 403 || data.message?.includes("Neveljavna")) {
        setDoorStatus("no_key");
        setDoorMessage("❌ Neveljavna QR koda.");
      } else if (!data.success) {
        setDoorStatus("error");
        setDoorMessage("❌ " + (data.message ?? "Napaka pri odpiranju vrat."));
      } else {
        setDoorStatus("error");
        setDoorMessage("❌ Neznana napaka.");
      }
    } catch {
      setDoorStatus("error");
      setDoorMessage("Napaka pri povezavi. Preverite internet.");
    }

    // Drugačen timeout glede na status
    const timeout = (data?.success || data?.lockState === "locked") ? 3000 : 4000;
    setTimeout(() => setDoorStatus("idle"), timeout);
  }

  // Nalaganje
  if (hasKey === null) {
    return (
      <Shell>
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </Shell>
    );
  }

  // Neveljavna QR koda
  if (!hasKey) {
    return (
      <Shell>
        <div className="max-w-sm mx-auto w-full text-center">
          <div className="text-5xl mb-4">📱</div>
          <h1 className="text-white text-xl font-bold mb-2">Skenirajte QR kodo</h1>
          <p className="text-white/40 text-sm">Za dostop skenirajte QR kodo pri vhodu v strelišče.</p>
        </div>
      </Shell>
    );
  }

  // Vnos imena (samo prvič)
  if (!nameSet) {
    return (
      <Shell>
        <div className="max-w-sm mx-auto w-full">
          <h1 className="text-white text-xl font-bold text-center mb-2">Dobrodošli</h1>
          <p className="text-white/40 text-sm text-center mb-8">Vnesite svoje ime — samo prvič.</p>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="Ime in priimek"
              autoFocus
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-lg placeholder-white/20 focus:outline-none focus:border-red-500 transition"
            />
            <button
              type="submit"
              className="w-full py-4 rounded-xl font-bold text-white text-lg transition"
              style={{ background: "linear-gradient(135deg, #ff3000, #ff6a00)" }}
            >
              Naprej →
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  const statusConfig: Record<DoorStatus, { bg: string; icon: string; label: string }> = {
    idle:    { bg: "linear-gradient(135deg, #ff3000, #ff6a00)", icon: "🚪", label: "ODPRI VRATA" },
    loading: { bg: "rgba(255,48,0,0.4)",                        icon: "⏳", label: "Pošiljam ukaz..." },
    success: { bg: "linear-gradient(135deg, #22c55e, #16a34a)", icon: "✅", label: "VRATA SE ODPIRAJO" },
    locked:  { bg: "rgba(100,100,100,0.5)",                     icon: "🔒", label: "ZAKLENJENA" },
    no_key:  { bg: "rgba(239,68,68,0.3)",                       icon: "⛔", label: "NEVELJAVNA KODA" },
    error:   { bg: "rgba(239,68,68,0.3)",                       icon: "⚠️", label: "NAPAKA" },
  };

  const sc = statusConfig[doorStatus];

  return (
    <Shell>
      <div className="max-w-sm mx-auto w-full text-center">
        <p className="text-white/30 text-sm mb-6">
          {name}
          <button
            onClick={() => { setNameSet(false); setNameInput(name); }}
            className="ml-2 text-white/20 hover:text-white/50 text-xs transition"
          >
            ✎
          </button>
        </p>

        <button
          onClick={handlePullSpring}
          disabled={doorStatus === "loading" || doorStatus === "success"}
          className="w-full h-52 rounded-2xl font-black text-2xl text-white tracking-widest transition-all duration-300 active:scale-95 disabled:cursor-not-allowed shadow-lg mb-4"
          style={{
            background: sc.bg,
            boxShadow: doorStatus === "idle" ? "0 0 50px rgba(255,48,0,0.5)" : "none",
          }}
        >
          <span className="block text-5xl mb-3">{sc.icon}</span>
          {sc.label}
        </button>

        {doorMessage && (
          <p className={`text-sm font-medium ${doorStatus === "success" ? "text-green-400" : "text-red-400"}`}>
            {doorMessage}
          </p>
        )}

        <p className="text-white/20 text-xs mt-5">Gumb deluje samo, ko so vrata odklenjena.</p>
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
      <div className="mb-10">
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
