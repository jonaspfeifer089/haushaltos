import React from "react";
import { motion } from "framer-motion";
import { Sparkle, ListTodo, ShoppingCart } from "lucide-react";
import { Departure, CalendarEvent, TodoItem, EinkaufItem, CountdownItem } from "../types";
import { calculateDaysLeft } from "../lib/mciEngine";

interface HomeViewProps {
  activeUser: string;
  todayStr: string;
  weather: string;
  weatherTip: string;
  locationName: string;
  countdowns: CountdownItem[];
  termine: CalendarEvent[];
  offeneTodos: TodoItem[];
  offeneEinkaeufe: EinkaufItem[];
  departures: Departure[];
  setActiveTab: (tab: string) => void;
  springConfig: any;
  theme: any;
}

export function HomeView({
  activeUser,
  todayStr,
  weather,
  weatherTip,
  locationName,
  countdowns,
  termine,
  offeneTodos,
  offeneEinkaeufe,
  departures,
  setActiveTab,
  springConfig,
  theme
}: HomeViewProps) {
  const { bgCard, bgItem, textTitle, textSub, accentBlue, accentGreen, badgeBlue, badgeGreen } =
    theme;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 border-b border-[#E8E2D9] pb-2 md:flex-row md:items-end dark:border-white/[0.08]">
        <div>
          <div
            className={`flex items-center gap-2 text-xs font-bold tracking-wider uppercase ${accentGreen} mb-1`}
          >
            <Sparkle className="h-3.5 w-3.5 fill-current" /> {todayStr}
          </div>
          <h1 className={`text-3xl font-extrabold tracking-tight md:text-4xl ${textTitle}`}>
            Guten Tag, {activeUser}!
          </h1>
        </div>
        <div className={`rounded-2xl border p-4 ${bgCard} flex items-center gap-3`}>
          <div className="shrink-0 text-2xl">💡</div>
          <div>
            <span className={`text-[10px] font-bold tracking-wider uppercase ${textSub} block`}>
              Tages- & Outfit-Empfehlung ({locationName})
            </span>
            <p className={`text-xs font-semibold ${textTitle} mt-0.5`}>{weatherTip}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-base leading-none font-extrabold ${textTitle}`}>
            {weather}
          </span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${badgeGreen}`}>
            {locationName}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                Meilensteine
              </h3>
              <span
                className={`text-xs ${accentBlue} cursor-pointer font-semibold`}
                onClick={() => setActiveTab("kalender")}
              >
                Verwalten &gt;
              </span>
            </div>
            {countdowns.length > 0 ? (
              <div className="space-y-2.5">
                {countdowns.map((cd, idx) => (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={springConfig}
                    key={idx}
                    className={`${bgCard} relative flex items-center justify-between overflow-hidden rounded-2xl border p-3 md:p-4`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 rounded-xl border border-[#5B8C5A]/30 bg-[#5B8C5A]/15 p-1.5 text-xl md:p-2 md:text-2xl">
                        {cd.icon}
                      </span>
                      <div className="truncate">
                        <h4 className={`text-xs font-bold md:text-sm ${textTitle} truncate`}>
                          {cd.title}
                        </h4>
                        <p className={`text-[10px] md:text-xs ${textSub} font-medium`}>{cd.date}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1 text-right">
                      <span className={`font-mono text-lg font-black md:text-xl ${accentGreen}`}>
                        {Math.max(0, calculateDaysLeft(cd.date))}
                      </span>
                      <span className={`text-[10px] font-bold md:text-[11px] ${textSub}`}>
                        Tage
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={`${bgCard} rounded-2xl border p-6 text-center text-xs ${textSub}`}>
                Keine Meilensteine eingetragen.
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                Termine & Putzplan
              </h3>
              <span className={`text-[10px] ${textSub}`}>System OS</span>
            </div>
            <div className={`${bgCard} space-y-3 rounded-3xl border p-6`}>
              {termine.slice(0, 4).map((t, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-2xl border p-3 ${bgItem} gap-4`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-[#005377]" />
                    <span
                      className={`text-xs font-bold ${textTitle} max-w-[220px] truncate sm:max-w-none`}
                    >
                      {t.title}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] font-bold ${badgeBlue} shrink-0 rounded-lg px-2.5 py-1`}
                  >
                    {t.date}
                  </span>
                </div>
              ))}
              {termine.length === 0 && (
                <p className={`text-xs ${textSub} py-4 text-center`}>
                  Keine Termine synchronisiert.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <div className="space-y-3">
            <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub} px-1`}>
              Schnellübersicht
            </h3>
            <div
              onClick={() => setActiveTab("todos")}
              className={`${bgCard} group cursor-pointer rounded-3xl border p-5 transition-all hover:border-[#005377]/50`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className={`h-4 w-4 ${accentBlue}`} />
                  <span className={`text-xs font-bold ${textTitle}`}>To-Do Liste</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeBlue}`}>
                  {offeneTodos.length} offen
                </span>
              </div>
              <div className="mb-3 space-y-1.5">
                {offeneTodos.slice(0, 3).map((item, i) => (
                  <div
                    key={i}
                    className={`text-xs ${textSub} flex items-center justify-between gap-2`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="h-1 w-1 rounded-full bg-[#005377]" />
                      <span className="truncate">{item.aufgabe}</span>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] font-medium opacity-70">
                      {item.zustaendig}
                    </span>
                  </div>
                ))}
                {offeneTodos.length === 0 && (
                  <span className={`text-xs ${textSub}`}>Keine offenen To-Dos! 🎉</span>
                )}
              </div>
            </div>

            <div
              onClick={() => setActiveTab("einkauf")}
              className={`${bgCard} group cursor-pointer rounded-3xl border p-5 transition-all hover:border-[#5B8C5A]/50`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className={`h-4 w-4 ${accentGreen}`} />
                  <span className={`text-xs font-bold ${textTitle}`}>Einkaufsliste</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeGreen}`}>
                  {offeneEinkaeufe.length} offen
                </span>
              </div>
              <div className="mb-3 space-y-1.5">
                {offeneEinkaeufe.slice(0, 2).map((item, i) => (
                  <div key={i} className={`text-xs ${textSub} flex items-center gap-2`}>
                    <span className="h-1 w-1 rounded-full bg-slate-400" />
                    <span className="truncate">{item.artikel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`${bgCard} space-y-4 rounded-3xl border p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-bold ${textTitle}`}>Abfahrten Erfurt</h3>
                <p className={`text-[10px] ${textSub}`}>Live</p>
              </div>
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${badgeBlue}`}
              >
                LIVE
              </span>
            </div>
            <div className="space-y-2.5">
              {departures.slice(0, 3).map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${badgeBlue}`}
                    >
                      {d.line}
                    </span>
                    <span className={`max-w-[120px] truncate font-semibold ${textTitle}`}>
                      {d.destination}
                    </span>
                  </div>
                  <span className={`font-mono font-bold ${textSub}`}>{d.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
