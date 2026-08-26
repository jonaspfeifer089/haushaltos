import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarEventItem {
  title: string;
  type: "termin" | "putz";
  startHour?: number; // z.B. 14.5 für 14:30
  durationHours?: number; // z.B. 1.5 für 90 Min
  isAllDay?: boolean;
}

interface KalenderViewProps {
  currentDate: Date;
  getEventsForDate: (
    dateObj: Date
  ) => { title: string; type: "termin" | "putz"; timeStr?: string }[];
  theme: any;
}

type AppleViewMode = "day" | "week" | "month" | "year";

export function KalenderView({
  currentDate: initialDate,
  getEventsForDate,
  theme
}: KalenderViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(initialDate));
  const [viewMode, setViewMode] = useState<AppleViewMode>("week");
  const [now, setNow] = useState<Date>(new Date());

  const { bgCard, bgItem, textTitle, textSub, isDarkMode } = theme;

  // Live-Ticker für die rote Apple-Zeitlinie
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else if (viewMode === "year") d.setFullYear(d.getFullYear() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else if (viewMode === "year") d.setFullYear(d.getFullYear() + 1);
    setCurrentDate(d);
  };

  const jumpToToday = () => {
    const t = new Date();
    setCurrentDate(t);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString("de-DE", { month: "long" });

  // 7 Wochentage berechnen (Montag als Start)
  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  // Hilfsfunktion: Zerlegt Events in ganztägig vs. Uhrzeit-gebunden
  const parseEvents = (d: Date): { allDay: CalendarEventItem[]; timed: CalendarEventItem[] } => {
    const raw = getEventsForDate(d);
    const allDay: CalendarEventItem[] = [];
    const timed: CalendarEventItem[] = [];

    raw.forEach((ev) => {
      // Prüfe auf Uhrzeit im Titel oder timeStr (z.B. "14:30" oder "15:00 - 16:30")
      const match = ev.title.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        const startH = parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
        timed.push({
          title:
            ev.title.replace(/^\d{1,2}:\d{2}\s*(-|\s*bis\s*)?\s*(\d{1,2}:\d{2})?/, "").trim() ||
            ev.title,
          type: ev.type,
          startHour: startH,
          durationHours: 1, // Standard 1 Stunde falls nicht spezifiziert
          isAllDay: false
        });
      } else {
        allDay.push({
          title: ev.title,
          type: ev.type,
          isAllDay: true
        });
      }
    });

    return { allDay, timed };
  };

  const startHour = 7;
  const endHour = 22;
  const hours = Array.from({ length: endHour - startHour + 1 }).map((_, i) => i + startHour);
  const hourHeight = 52; // Exakte Pixelhöhe pro Stunde für Apple Grid

  // Rote Apple-Zeitlinie Position
  const currentMinuteRatio = now.getHours() - startHour + now.getMinutes() / 60;
  const showLiveIndicator = now.getHours() >= startHour && now.getHours() <= endHour;

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* APPLE TOP BAR */}
      {/* ========================================================= */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${textTitle}`}>
              {viewMode === "year" ? year : `${monthName} ${year}`}
            </h2>
            <p className={`text-xs ${textSub} font-medium`}>
              {currentDate.toLocaleDateString("de-DE", {
                weekday: "long",
                day: "2-digit",
                month: "long"
              })}
            </p>
          </div>

          <button
            onClick={jumpToToday}
            className="rounded-full border border-[#FF3B30]/40 bg-[#FF3B30]/10 px-3 py-1 text-xs font-bold text-[#FF3B30] transition-colors hover:bg-[#FF3B30]/20 active:scale-95"
          >
            Heute
          </button>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="flex rounded-xl bg-black/5 p-1 dark:bg-white/5">
            {(["day", "week", "month", "year"] as AppleViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-lg px-3 py-1 text-xs font-bold capitalize transition-all ${
                  viewMode === mode
                    ? "bg-white text-black shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                    : `${textSub} hover:text-black dark:hover:text-white`
                }`}
              >
                {mode === "day"
                  ? "Tag"
                  : mode === "week"
                    ? "Woche"
                    : mode === "month"
                      ? "Monat"
                      : "Jahr"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 text-slate-600 transition-colors hover:bg-black/10 dark:bg-white/5 dark:text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 text-slate-600 transition-colors hover:bg-black/10 dark:bg-white/5 dark:text-slate-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. WOCHENANSICHT (1:1 Apple Calendar Layout) */}
      {/* ========================================================= */}
      {viewMode === "week" && (
        <div className={`${bgCard} overflow-hidden rounded-3xl border shadow-sm`}>
          {/* Header mit Wochentagen & Ganztägigen Events */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-black/10 dark:border-white/10">
            <div className="flex items-end justify-center p-2 text-[10px] font-bold text-slate-400">
              GMT+2
            </div>

            {getWeekDays().map((d, i) => {
              const activeToday = isToday(d);
              return (
                <div
                  key={i}
                  onClick={() => {
                    setCurrentDate(d);
                    setViewMode("day");
                  }}
                  className="flex cursor-pointer flex-col items-center border-l border-black/5 p-2.5 text-center hover:bg-black/[0.02] dark:border-white/5"
                >
                  <span
                    className={`text-[11px] font-bold uppercase ${activeToday ? "text-[#FF3B30]" : textSub}`}
                  >
                    {d.toLocaleDateString("de-DE", { weekday: "short" })}
                  </span>
                  <span
                    className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm font-black ${
                      activeToday ? "bg-[#FF3B30] text-white shadow-sm" : textTitle
                    }`}
                  >
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Ganztägig-Zeile (Apple All-Day Section) */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-black/10 bg-black/[0.015] dark:border-white/10 dark:bg-white/[0.015]">
            <div className="flex items-center justify-center p-2 text-[9px] font-bold text-slate-400">
              Ganztägig
            </div>
            {getWeekDays().map((d, i) => {
              const { allDay } = parseEvents(d);
              return (
                <div
                  key={i}
                  className="min-h-[44px] space-y-1 border-l border-black/5 p-1 dark:border-white/5"
                >
                  {allDay.map((ev, idx) => (
                    <div
                      key={idx}
                      className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-bold shadow-xs ${
                        ev.type === "putz"
                          ? "border border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-300"
                          : "border border-[#005377]/30 bg-[#005377]/15 text-[#005377] dark:text-[#82CBEE]"
                      }`}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Stunden-Grid mit Zeit-Scroll */}
          <div className="relative max-h-[520px] overflow-y-auto">
            <div className="grid grid-cols-[60px_repeat(7,1fr)]">
              {/* Zeitleiste links */}
              <div className="relative">
                {hours.map((h) => (
                  <div key={h} style={{ height: hourHeight }} className="relative pr-2 text-right">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {String(h).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* 7 Spalten für die Tage */}
              {getWeekDays().map((d, colIdx) => {
                const { timed } = parseEvents(d);
                const activeToday = isToday(d);

                return (
                  <div
                    key={colIdx}
                    className="relative border-l border-black/5 dark:border-white/5"
                  >
                    {/* Horizontale Stundenlinien */}
                    {hours.map((h) => (
                      <div
                        key={h}
                        style={{ height: hourHeight }}
                        className="border-b border-black/[0.04] dark:border-white/[0.04]"
                      />
                    ))}

                    {/* Rote Apple-Live-Linie */}
                    {activeToday && showLiveIndicator && (
                      <div
                        style={{ top: `${currentMinuteRatio * hourHeight}px` }}
                        className="absolute right-0 left-0 z-20 flex items-center"
                      >
                        <div className="-ml-1 h-2 w-2 rounded-full bg-[#FF3B30] shadow-sm" />
                        <div className="h-[2px] w-full bg-[#FF3B30]" />
                      </div>
                    )}

                    {/* Zeitgebundene Events (exakt positioniert) */}
                    {timed.map((ev, idx) => {
                      const topOffset = ((ev.startHour || 7) - startHour) * hourHeight;
                      const height = (ev.durationHours || 1) * hourHeight - 4;

                      return (
                        <div
                          key={idx}
                          style={{ top: `${topOffset}px`, height: `${height}px` }}
                          className={`absolute right-1 left-1 z-10 overflow-hidden rounded-xl border p-1.5 text-xs font-bold shadow-sm transition-all hover:scale-[1.02] ${
                            ev.type === "putz"
                              ? "border-rose-500/40 bg-rose-500/20 text-rose-700 dark:text-rose-200"
                              : "border-[#005377]/40 bg-[#005377]/20 text-[#005377] dark:text-[#82CBEE]"
                          }`}
                        >
                          <div className="font-mono text-[9px] opacity-80">
                            {Math.floor(ev.startHour || 0)}:00
                          </div>
                          <div className="truncate text-[11px] leading-tight">{ev.title}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MONATSANSICHT (Apple Monats-Grid) */}
      {/* ========================================================= */}
      {viewMode === "month" && (
        <div className={`${bgCard} space-y-2 rounded-3xl border p-4 shadow-sm sm:p-6`}>
          <div className="grid grid-cols-7 border-b border-black/5 pb-2 text-center text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:border-white/5">
            <span>Mo</span>
            <span>Di</span>
            <span>Mi</span>
            <span>Do</span>
            <span>Fr</span>
            <span>Sa</span>
            <span>So</span>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: (new Date(year, month, 1).getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 rounded-2xl opacity-20" />
            ))}

            {Array.from({ length: new Date(year, month + 1, 0).getDate() }).map((_, i) => {
              const dayNum = i + 1;
              const d = new Date(year, month, dayNum);
              const { allDay, timed } = parseEvents(d);
              const totalEvents = [...allDay, ...timed];
              const activeToday = isToday(d);

              return (
                <div
                  key={dayNum}
                  onClick={() => {
                    setCurrentDate(d);
                    setViewMode("day");
                  }}
                  className={`group flex h-24 cursor-pointer flex-col justify-between rounded-2xl border p-2 transition-all sm:h-28 ${
                    activeToday
                      ? "border-[#FF3B30]/40 bg-[#FF3B30]/5"
                      : `${bgItem} hover:border-slate-400/50`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold ${
                        activeToday ? "bg-[#FF3B30] text-white shadow-sm" : textTitle
                      }`}
                    >
                      {dayNum}
                    </span>
                  </div>

                  <div className="scrollbar-hide max-h-[60px] space-y-1 overflow-y-auto">
                    {totalEvents.map((ev, idx) => (
                      <div
                        key={idx}
                        className={`truncate rounded px-1.5 py-0.5 text-[9px] font-bold sm:text-[10px] ${
                          ev.type === "putz"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            : "bg-[#005377]/15 text-[#005377] dark:bg-[#82CBEE]/20 dark:text-[#82CBEE]"
                        }`}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TAGESANSICHT */}
      {/* ========================================================= */}
      {viewMode === "day" && (
        <div className={`${bgCard} rounded-3xl border p-4 shadow-sm sm:p-6`}>
          <div className="mb-4 flex items-center gap-3 border-b border-black/5 pb-4 dark:border-white/5">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl font-mono text-lg font-black ${
                isToday(currentDate) ? "bg-[#FF3B30] text-white" : "bg-black/5 dark:bg-white/10"
              }`}
            >
              {currentDate.getDate()}
            </span>
            <div>
              <h3 className={`text-base font-bold ${textTitle}`}>
                {currentDate.toLocaleDateString("de-DE", { weekday: "long" })}
              </h3>
              <span className={`text-xs ${textSub}`}>
                {parseEvents(currentDate).allDay.length + parseEvents(currentDate).timed.length}{" "}
                Ereignisse
              </span>
            </div>
          </div>

          {/* Ganztägig oben */}
          {parseEvents(currentDate).allDay.length > 0 && (
            <div className="mb-4 space-y-1 rounded-2xl border bg-black/[0.02] p-3 dark:bg-white/[0.02]">
              <span className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Ganztägig
              </span>
              {parseEvents(currentDate).allDay.map((ev, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-2.5 text-xs font-bold ${
                    ev.type === "putz"
                      ? "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                      : "border border-[#005377]/30 bg-[#005377]/10 text-[#005377] dark:text-[#82CBEE]"
                  }`}
                >
                  {ev.title}
                </div>
              ))}
            </div>
          )}

          {/* Stunden Timeline */}
          <div className="relative max-h-[460px] overflow-y-auto pr-2">
            {hours.map((h) => (
              <div key={h} className="flex items-start gap-4 text-xs">
                <span className="w-12 shrink-0 pt-1 font-mono font-bold text-slate-400">
                  {String(h).padStart(2, "0")}:00
                </span>
                <div className="min-h-[48px] flex-1 border-t border-black/5 pt-1 dark:border-white/5">
                  {parseEvents(currentDate)
                    .timed.filter((e) => Math.floor(e.startHour || 0) === h)
                    .map((ev, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[#005377]/40 bg-[#005377]/10 p-2.5 text-xs font-bold text-[#005377] dark:text-[#82CBEE]"
                      >
                        {ev.title}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. JAHRESANSICHT */}
      {/* ========================================================= */}
      {viewMode === "year" && (
        <div
          className={`${bgCard} grid grid-cols-2 gap-4 rounded-3xl border p-4 shadow-sm sm:grid-cols-3 sm:p-6 lg:grid-cols-4`}
        >
          {Array.from({ length: 12 }).map((_, mIdx) => {
            const mDate = new Date(year, mIdx, 1);
            const mName = mDate.toLocaleDateString("de-DE", { month: "short" });
            const daysInM = new Date(year, mIdx + 1, 0).getDate();
            const startOffset = (mDate.getDay() + 6) % 7;

            return (
              <div
                key={mIdx}
                onClick={() => {
                  const next = new Date(currentDate);
                  next.setMonth(mIdx);
                  setCurrentDate(next);
                  setViewMode("month");
                }}
                className={`rounded-2xl border p-3 ${bgItem} cursor-pointer transition-all hover:scale-105`}
              >
                <span
                  className={`mb-2 block text-xs font-black uppercase ${
                    mIdx === today.getMonth() && year === today.getFullYear()
                      ? "text-[#FF3B30]"
                      : textTitle
                  }`}
                >
                  {mName}
                </span>

                <div className="grid grid-cols-7 gap-0.5 text-center font-mono text-[8px] opacity-80">
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <span key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInM }).map((_, dIdx) => {
                    const dNum = dIdx + 1;
                    const checkD = new Date(year, mIdx, dNum);
                    const hasEvents = getEventsForDate(checkD).length > 0;
                    const isNow = isToday(checkD);

                    return (
                      <span
                        key={dNum}
                        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                          isNow
                            ? "bg-[#FF3B30] font-bold text-white"
                            : hasEvents
                              ? "bg-[#005377]/30 font-bold text-[#005377] dark:text-[#82CBEE]"
                              : ""
                        }`}
                      >
                        {dNum}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
