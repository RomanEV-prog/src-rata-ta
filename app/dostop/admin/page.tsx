"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

type AccessRequest = {
  id: string;
  request_type: string;
  full_name: string;
  email: string;
  desired_date: string | null;
  status: string;
  note: string | null;
  created_at: string;
  clubs: { name: string } | null;
};

type DoorEvent = {
  id: string;
  requested_at: string;
  lock_state: string | null;
  result: string;
  error_message: string | null;
  members: { full_name: string | null } | null;
};

type Member = {
  id: string;
  full_name: string | null;
  is_active: boolean;
  clubs: { name: string } | null;
  access_permissions: { id: string; is_active: boolean; valid_until: string | null }[];
};

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"requests" | "events" | "members">("requests");

  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [events, setEvents] = useState<DoorEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user;
      setUser(u ?? null);
      if (u) {
        const role = (u.app_metadata as Record<string, string>)?.role;
        if (role !== "admin") { setLoading(false); return; }
        loadData();
      } else {
        setLoading(false);
      }
    });
  }, []);

  async function loadData() {
    setLoading(true);
    const [reqRes, evtRes, memRes] = await Promise.all([
      supabase
        .from("access_requests")
        .select("*, clubs(name)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("door_events")
        .select("*, members(full_name)")
        .order("requested_at", { ascending: false })
        .limit(50),
      supabase
        .from("members")
        .select("*, clubs(name), access_permissions(id, is_active, valid_until)")
        .order("full_name"),
    ]);

    setRequests((reqRes.data ?? []) as AccessRequest[]);
    setEvents((evtRes.data ?? []) as DoorEvent[]);
    setMembers((memRes.data ?? []) as Member[]);
    setLoading(false);
  }

  async function updateRequestStatus(id: string, status: string) {
    await supabase
      .from("access_requests")
      .update({ status, processed_at: new Date().toISOString() })
      .eq("id", id);
    loadData();
  }

  async function togglePermission(memberId: string, currentlyActive: boolean) {
    if (currentlyActive) {
      await supabase
        .from("access_permissions")
        .update({ is_active: false })
        .eq("member_id", memberId)
        .eq("is_active", true);
    } else {
      await supabase
        .from("access_permissions")
        .insert({ member_id: memberId, is_active: true });
    }
    loadData();
  }

  const isAdmin = user && (user.app_metadata as Record<string, string>)?.role === "admin";

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  if (!user || !isAdmin) {
    return (
      <AdminShell>
        <div className="text-center text-red-400">
          <p className="text-4xl mb-3">⛔</p>
          <p>Dostop zavrnjen. Zahtevano: admin vloga.</p>
          <Link href="/dostop" className="mt-4 inline-block text-sm text-white/50 hover:text-white/80">
            ← Nazaj
          </Link>
        </div>
      </AdminShell>
    );
  }

  const openRequests = requests.filter(r => r.status === "new" || r.status === "processing");

  return (
    <AdminShell>
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Admin panel</h1>
          <Link href="/dostop" className="text-sm text-white/40 hover:text-white/70 transition">
            ← Nazaj
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["requests", "events", "members"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t
                  ? "text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
              style={tab === t ? { background: "linear-gradient(135deg, #ff3000, #ff6a00)" } : { background: "rgba(255,255,255,0.05)" }}
            >
              {t === "requests" && `Zahteve ${openRequests.length > 0 ? `(${openRequests.length})` : ""}`}
              {t === "events" && "Dnevnik"}
              {t === "members" && "Člani"}
            </button>
          ))}
          <button onClick={loadData} className="ml-auto text-white/30 hover:text-white/60 text-sm transition">
            ↺ Osveži
          </button>
        </div>

        {/* Zahteve */}
        {tab === "requests" && (
          <div className="space-y-3">
            {requests.length === 0 && <EmptyState text="Ni zahtev." />}
            {requests.map(r => (
              <div
                key={r.id}
                className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex flex-wrap items-start gap-3 justify-between">
                  <div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded mr-2 ${r.request_type === "add" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {r.request_type === "add" ? "DODAJ" : "ODVZEMI"}
                    </span>
                    <span className="text-white font-medium">{r.full_name}</span>
                    {r.clubs && <span className="text-white/40 text-sm ml-2">— {r.clubs.name}</span>}
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-white/50 text-sm mt-1">{r.email}</p>
                {r.desired_date && <p className="text-white/40 text-xs mt-0.5">Datum: {r.desired_date}</p>}
                <p className="text-white/25 text-xs mt-1">{r.id} · {new Date(r.created_at).toLocaleString("sl-SI")}</p>

                {(r.status === "new" || r.status === "processing") && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => updateRequestStatus(r.id, "done")}
                      className="px-3 py-1 rounded text-xs font-bold text-white bg-green-600/80 hover:bg-green-600 transition"
                    >
                      ✓ Urejeno
                    </button>
                    <button
                      onClick={() => updateRequestStatus(r.id, "processing")}
                      className="px-3 py-1 rounded text-xs font-bold text-white/60 hover:text-white transition"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      V obdelavi
                    </button>
                    <button
                      onClick={() => updateRequestStatus(r.id, "rejected")}
                      className="px-3 py-1 rounded text-xs font-bold text-red-400 hover:text-red-300 transition"
                      style={{ background: "rgba(239,68,68,0.1)" }}
                    >
                      Zavrni
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dnevnik */}
        {tab === "events" && (
          <div className="space-y-2">
            {events.length === 0 && <EmptyState text="Ni zapisov." />}
            {events.map(e => (
              <div
                key={e.id}
                className="rounded-lg px-4 py-3 flex flex-wrap gap-3 items-center justify-between"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div>
                  <span className={`text-xs font-bold mr-2 ${e.result === "success" ? "text-green-400" : "text-red-400"}`}>
                    {e.result === "success" ? "✓" : "✗"} {e.result.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <span className="text-white/60 text-sm">{e.members?.full_name ?? "neznan"}</span>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs">{new Date(e.requested_at).toLocaleString("sl-SI")}</p>
                  {e.lock_state && <p className="text-white/25 text-xs">ključavnica: {e.lock_state}</p>}
                </div>
                {e.error_message && (
                  <p className="w-full text-red-400/60 text-xs">{e.error_message}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Člani */}
        {tab === "members" && (
          <div className="space-y-2">
            {members.length === 0 && <EmptyState text="Ni članov." />}
            {members.map(m => {
              const activePerm = m.access_permissions.find(p => p.is_active);
              return (
                <div
                  key={m.id}
                  className="rounded-lg px-4 py-3 flex flex-wrap gap-3 items-center justify-between"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div>
                    <span className="text-white font-medium">{m.full_name ?? "—"}</span>
                    {m.clubs && <span className="text-white/40 text-sm ml-2">{m.clubs.name}</span>}
                    {activePerm?.valid_until && (
                      <span className="text-white/30 text-xs ml-2">do {new Date(activePerm.valid_until).toLocaleDateString("sl-SI")}</span>
                    )}
                  </div>
                  <button
                    onClick={() => togglePermission(m.id, !!activePerm)}
                    className={`text-xs font-bold px-3 py-1 rounded transition ${
                      activePerm
                        ? "bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400"
                        : "bg-white/5 text-white/40 hover:bg-green-500/20 hover:text-green-400"
                    }`}
                  >
                    {activePerm ? "✓ Dostop aktiven" : "✗ Brez dostopa"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-yellow-500/20 text-yellow-400",
    processing: "bg-blue-500/20 text-blue-400",
    done: "bg-green-500/20 text-green-400",
    rejected: "bg-red-500/20 text-red-400",
  };
  const labels: Record<string, string> = { new: "Novo", processing: "V obdelavi", done: "Urejeno", rejected: "Zavrnjeno" };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${map[status] ?? "text-white/40"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-center text-white/30 py-12">{text}</p>;
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-10" style={{ background: "#050505" }}>
      {children}
    </div>
  );
}
