import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus } from "lucide-react";
import { CalendarEvent, PutzItem } from "../types";

interface KalenderViewProps {
  currentDate: Date;
  getEventsForDate: (dateObj: Date) => { title: string; type: "termin" | "putz" }[];
  theme: any;
}

type AppleViewMode = "day" | "week" | "month" | "year";

export function KalenderView({
  currentDate: initialDate,
  getEventsForDate,
  theme
}: KalenderViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(initialDate));
  const [viewMode, setViewMode] = useState<AppleViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(initialDate));

  const { bgCard, bgItem, textTitle, textSub, isDarkMode } = theme;

  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  const isSelected = (d: Date) => d.toDateString() === selectedDate.toDateString();

  // Navigation handlers
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
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  // Hilfsdaten
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString("de-DE", { month: "long" });

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

  const hours = Array.from({ length: 16 }).map((_, i) => i + 7); // 07:00 bis 22:00

  return (
    <div className="space-y-4">
      {/* Apple Calendar Top Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div>
            <h2 className={`text-2xl font-extrabold tracking-tight ${textTitle}`}>
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
            className="rounded-full border border-[#FF3B30]/30 bg-[#FF3B30]/10 px-2.5 py-1 text-[11px] font-bold text-[#FF3B30] transition-colors hover:bg-[#FF3B30]/20"
          >
            Heute
          </button>
        </div>

        {/* Apple Segmented Control */}
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

      {/* Main Container */}
      <div className={`${bgCard} min-h-[550px] overflow-hidden rounded-3xl border p-4 sm:p-6`}>
        {/* ========================================================= */}
        {/* 1. MONATSANSICHT (Apple Standard) */}
        {/* ========================================================= */}
        {viewMode === "month" && (
          <div className="space-y-2">
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
              {/* Leere Tage vor Monatsbeginn */}
              {Array.from({ length: (new Date(year, month, 1).getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 rounded-2xl opacity-20" />
              ))}

              {/* Monatstage */}
              {Array.from({ length: new Date(year, month + 1, 0).getDate() }).map((_, i) => {
                const dayNum = i + 1;
                const d = new Date(year, month, dayNum);
                const events = getEventsForDate(d);
                const activeToday = isToday(d);

                return (
                  <div
                    key={dayNum}
                    onClick={() => {
                      setSelectedDate(d);
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
                      {events.map((ev, idx) => (
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
        {/* 2. WOCHENANSICHT (Apple Multi-Column Timeline) */}
        {/* ========================================================= */}
        {viewMode === "week" && (
          <div className="space-y-4">
            {/* Header Tage */}
            <div className="grid grid-cols-7 gap-2 border-b border-black/5 pb-3 text-center dark:border-white/5">
              {getWeekDays().map((d, i) => {
                const activeToday = isToday(d);
                return (
                  <div key={i} className="flex flex-col items-center">
                    <span
                      className={`text-[10px] font-bold uppercase ${activeToday ? "text-[#FF3B30]" : textSub}`}
                    >
                      {d.toLocaleDateString("de-DE", { weekday: "short" })}
                    </span>
                    <span
                      className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-black ${
                        activeToday ? "bg-[#FF3B30] text-white" : textTitle
                      }`}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Wochen-Spalten */}
            <div className="grid grid-cols-7 gap-2">
              {getWeekDays().map((d, i) => {
                const events = getEventsForDate(d);
                return (
                  <div
                    key={i}
                    className={`min-h-[380px] space-y-2 rounded-2xl border p-2 ${bgItem}`}
                  >
                    {events.map((ev, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl p-2 text-xs font-bold shadow-sm ${
                          ev.type === "putz"
                            ? "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "border border-[#005377]/30 bg-[#005377]/10 text-[#005377] dark:text-[#82CBEE]"
                        }`}
                      >
                        <span className="block text-[11px] leading-tight">{ev.title}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. TAGESANSICHT (Apple Schedule Time-Grid) */}
        {/* ========================================================= */}
        {viewMode === "day" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-black/5 pb-4 dark:border-white/5">
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
                  {getEventsForDate(currentDate).length} Ereignisse geplant
                </span>
              </div>
            </div>

            {/* Tages-Stunden-Grid */}
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
              {hours.map((hour) => {
                const hourStr = `${String(hour).padStart(2, "0")}:00`;
                const dayEvents = getEventsForDate(currentDate);

                return (
                  <div key={hour} className="flex items-start gap-4 text-xs">
                    <span className="w-12 shrink-0 pt-1 font-mono font-bold text-slate-400">
                      {hourStr}
                    </span>
                    <div className="min-h-[44px] flex-1 border-t border-black/5 pt-1 dark:border-white/5">
                      {hour === 9 && dayEvents.length > 0 && (
                        <div className="space-y-2">
                          {dayEvents.map((ev, idx) => (
                            <div
                              key={idx}
                              className={`rounded-xl border p-2.5 font-bold shadow-sm ${
                                ev.type === "putz"
                                  ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  : "border-[#005377]/30 bg-[#005377]/10 text-[#005377] dark:text-[#82CBEE]"
                              }`}
                            >
                              {ev.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. JAHRESÜBERSICHT (Apple 12-Monate Heatmap Grid) */}
        {/* ========================================================= */}
        {viewMode === "year" && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
    </div>
  );
}
