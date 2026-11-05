"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const eventCategories = [
  {
    title: "Prihajajoča izobraževanja",
    color: "#3dba8a",
    events: [
      { title: "21.02.2026 08.30 – 14:00 in 22.02.2026 09:00 – 16:00", href: "/news-events" },
    ],
  },
  {
    title: "Tekmovanja",
    color: "#e05c5c",
    events: [
      { title: "I. kolo Mednarodne strelske lige Alpe Adria – 22.3.2025 ob 07:00", href: "/news-events" },
    ],
  },
  {
    title: "Ostalo",
    color: "#7a8cc9",
    events: [
      { title: "Zaključek Zimske lige Fenix 2024/25 – 7.3.2025 ob 18:00", href: "/news-events" },
    ],
  },
];

const DAYS = ["p", "t", "s", "č", "p", "s", "n"];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7; // Monday-first
  return { startOffset, daysInMonth };
}

export default function Events() {
  const [current, setCurrent] = useState({ year: 2026, month: 10 });
  const [todayKey, setTodayKey] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    setCurrent({ year: now.getFullYear(), month: now.getMonth() });
    setTodayKey(`${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`);
  }, []);

  const { startOffset, daysInMonth } = getCalendarDays(current.year, current.month);

  const monthNames = ["januar", "februar", "marec", "april", "maj", "junij",
    "julij", "avgust", "september", "oktober", "november", "december"];

  const prevMonth = () => {
    setCurrent(c => {
      if (c.month === 0) return { year: c.year - 1, month: 11 };
      return { year: c.year, month: c.month - 1 };
    });
  };

  const nextMonth = () => {
    setCurrent(c => {
      if (c.month === 11) return { year: c.year + 1, month: 0 };
      return { year: c.year, month: c.month + 1 };
    });
  };

  return (
    <section style={{ background: "#0d0f14", borderTop: "1px solid rgba(255,255,255,0.06)" }} className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-4xl font-black text-center text-white mb-14 tracking-wider uppercase">
          DOGODKI
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Event list */}
          <div className="space-y-8">
            {eventCategories.map((cat) => (
              <div key={cat.title}>
                <h3 className="text-base font-bold mb-3" style={{ color: cat.color }}>
                  {cat.title}
                </h3>
                <ul className="space-y-1.5">
                  {cat.events.map((e) => (
                    <li key={e.title}>
                      <Link href={e.href} className="text-sm text-white/70 hover:text-white transition-colors">
                        {e.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mini calendar */}
          <div
            className="rounded-xl p-5 w-full max-w-xs mx-auto"
            style={{ background: "#131720", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="text-white/50 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-white/80">
                {monthNames[current.month]} {current.year}
              </span>
              <button onClick={nextMonth} className="text-white/50 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((d, i) => (
                <div key={i} className="text-center text-xs font-semibold text-white/30 py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = todayKey === `${current.year}-${current.month}-${day}`;
                return (
                  <button
                    key={day}
                    className={`text-center text-xs py-1.5 rounded-md transition-colors
                      ${isToday
                        ? "font-bold text-white"
                        : "text-white/50 hover:text-white hover:bg-white/10"
                      }`}
                    style={isToday ? { background: "#3dba8a" } : {}}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
