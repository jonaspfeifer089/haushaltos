import React, { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, Plus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { PutzItem, VorratItem, NoteItem, CalendarEvent } from "../types";

// 1. PUTZPLAN VIEW
export function PutzplanView({ aufgaben, markAufgabeErledigt, tapGesture, theme }: any) {
  const { bgCard, bgItem, textTitle, textSub, isDarkMode } = theme;
  return (
    <div className="space-y-6">
      <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Putzplan</h2>
      <div className={`${bgCard} space-y-3 rounded-2xl p-6`}>
        {aufgaben.map((a: PutzItem, idx: number) => (
          <div
            key={idx}
            className={`flex items-center justify-between rounded-xl border p-4 ${bgItem}`}
          >
            <div>
              <div className={`text-sm font-bold ${textTitle}`}>{a.aufgabe}</div>
              <div className={`text-[11px] ${textSub}`}>
                Intervall: {a.intervall} Tage | Letztes Mal: {a.letztes_datum}
              </div>
            </div>
            <motion.button
              whileTap={tapGesture}
              onClick={() => markAufgabeErledigt(a)}
              className={`h-8 rounded-lg border px-4 text-xs font-bold ${isDarkMode ? "bg-white/5" : "bg-[#FAF8F5]"} shadow-sm`}
            >
              Erledigt
            </motion.button>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. VORRAT VIEW
export function VorratView({
  vorrat,
  isScanning,
  handleImageUpload,
  fileInputRef,
  tapGesture,
  theme
}: any) {
  const { bgCard, textTitle, textSub, accentBlue, buttonPrimary, isDarkMode } = theme;
  return (
    <div className="space-y-6">
      <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>
        Vorratskammer & KI Scanner
      </h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={`lg:col-span-1 ${bgCard} flex h-[280px] flex-col rounded-2xl p-6`}>
          <h3
            className={`text-[11px] font-bold tracking-wider uppercase ${textSub} mb-3 flex items-center gap-2`}
          >
            <Camera className={`h-4 w-4 ${accentBlue}`} /> Scanner
          </h3>
          <div
            className={`flex-1 border-2 border-dashed ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} flex flex-col items-center justify-center rounded-xl`}
          >
            {isScanning ? (
              <Loader2 className={`h-6 w-6 ${accentBlue} animate-spin`} />
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <motion.button
                  whileTap={tapGesture}
                  onClick={() => fileInputRef.current?.click()}
                  className={`text-xs ${buttonPrimary} rounded-xl px-4 py-2`}
                >
                  Kamera starten
                </motion.button>
              </>
            )}
          </div>
        </div>
        <div className={`lg:col-span-2 ${bgCard} flex min-h-[280px] flex-col rounded-2xl p-6`}>
          <h3 className={`text-[11px] font-bold tracking-wider uppercase ${textSub} mb-3`}>
            Bestand
          </h3>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr
                  className={`border-b ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"}`}
                >
                  <th className={`pb-2 text-[10px] font-bold ${textSub}`}>Artikel</th>
                  <th className={`pb-2 text-[10px] font-bold ${textSub} text-right`}>MHD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {vorrat.map((v: VorratItem, idx: number) => (
                  <tr key={idx}>
                    <td className={`py-3 text-xs font-bold ${textTitle}`}>{v.artikel}</td>
                    <td className={`py-3 text-xs ${textSub} text-right font-mono`}>
                      {v.ablaufdatum}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. PINNWAND VIEW
export function NotizenView({
  notes,
  addNote,
  toggleCheckItem,
  showNoteModal,
  setShowNoteModal,
  springConfig,
  tapGesture,
  theme
}: any) {
  const [activeNoteCategory, setActiveNoteCategory] = useState<string>("Alle");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("Allgemein");

  const { bgCard, bgItem, bgInput, textTitle, textSub, badgeBlue, badgeGreen, buttonPrimary } =
    theme;
  const noteCategories = ["Alle", ...Array.from(new Set(notes.map((n: NoteItem) => n.category)))];
  const filteredNotes =
    activeNoteCategory === "Alle"
      ? notes
      : notes.filter((n: NoteItem) => n.category === activeNoteCategory);

  const handleSave = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    await addNote(newNoteTitle, newNoteContent, newNoteCategory);
    setNewNoteTitle("");
    setNewNoteContent("");
    setShowNoteModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Pinnwand</h2>
        <motion.button
          whileTap={tapGesture}
          onClick={() => setShowNoteModal(true)}
          className={`px-4 py-2 ${buttonPrimary} rounded-xl text-xs font-bold`}
        >
          <Plus className="mr-1 inline h-4 w-4" /> Notiz
        </motion.button>
      </div>

      {showNoteModal && (
        <div className={`${bgCard} space-y-4 rounded-2xl border p-6`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              type="text"
              placeholder="Titel..."
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              className={`sm:col-span-2 ${bgInput} rounded-xl border px-4 py-2 text-xs font-medium`}
            />
            <select
              value={newNoteCategory}
              onChange={(e) => setNewNoteCategory(e.target.value)}
              className={`${bgInput} rounded-xl border px-3 py-2 text-xs font-medium`}
            >
              <option value="Allgemein">Allgemein</option>
              <option value="WLAN & Haus">WLAN & Haus</option>
              <option value="Wichtig">Wichtig</option>
            </select>
          </div>
          <textarea
            placeholder="Inhalt... (Tipp: Zeilen mit '- [ ] ' werden zu Checkboxen)"
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className={`w-full ${bgInput} h-28 rounded-xl border px-4 py-3 text-xs font-medium`}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNoteModal(false)}
              className={`px-4 py-2 text-xs font-bold ${textSub}`}
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className={`px-6 py-2 ${buttonPrimary} rounded-xl text-xs font-bold`}
            >
              Speichern
            </button>
          </div>
        </div>
      )}

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {noteCategories.map((cat: any) => (
          <button
            key={cat}
            onClick={() => setActiveNoteCategory(cat)}
            className={`rounded-xl px-3 py-1 text-xs font-bold whitespace-nowrap transition-all ${activeNoteCategory === cat ? `${badgeBlue} shadow-sm` : `${bgItem} ${textSub}`}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {filteredNotes.map((note: NoteItem) => {
          const lines = note.content.split("\n");
          return (
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={springConfig}
              key={note.id}
              className={`${bgCard} space-y-3 rounded-2xl border p-5`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${badgeGreen}`}
                >
                  {note.category}
                </span>
              </div>
              <h3 className={`text-sm font-bold ${textTitle}`}>{note.title}</h3>
              <div className="space-y-1.5 text-xs">
                {lines.map((line, idx) => {
                  const isTodo = line.trim().startsWith("- [ ]") || line.trim().startsWith("- [x]");
                  const isChecked = line.trim().startsWith("- [x]");
                  const itemText = line.replace(/^- \[[ x]\]\s*/, "");
                  if (isTodo) {
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleCheckItem(note, idx)}
                        className="flex cursor-pointer items-center gap-2 py-0.5 select-none hover:opacity-80"
                      >
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${isChecked ? "border-[#5B8C5A] bg-[#5B8C5A] text-white" : "border-slate-400"}`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className={`${isChecked ? "line-through opacity-50" : textTitle}`}>
                          {itemText}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className={`${textSub} whitespace-pre-line`}>
                      {line}
                    </p>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// 4. KALENDER VIEW
export function KalenderView({
  calendarMode,
  setCalendarMode,
  currentDate,
  handlePrev,
  handleNext,
  getEventsForDate,
  theme
}: any) {
  const { bgCard, bgItem, textTitle, textSub, accentBlue } = theme;
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  return (
    <div className="space-y-6">
      <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Kalender & Termine</h2>
      <div className={`${bgCard} rounded-3xl border p-6`}>
        <div className="mb-4 flex justify-between">
          <div className={`flex rounded-xl border p-1 ${bgItem}`}>
            <button
              onClick={() => setCalendarMode("month")}
              className={`rounded-lg px-3 py-1 text-xs font-bold ${calendarMode === "month" ? "bg-[#005377] text-white" : textSub}`}
            >
              Monat
            </button>
            <button
              onClick={() => setCalendarMode("week")}
              className={`rounded-lg px-3 py-1 text-xs font-bold ${calendarMode === "week" ? "bg-[#005377] text-white" : textSub}`}
            >
              Woche
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handlePrev} className={`rounded-xl border p-2 ${bgItem}`}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={handleNext} className={`rounded-xl border p-2 ${bgItem}`}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {calendarMode === "month" && (
          <div className="space-y-2">
            <div className="grid grid-cols-7 py-2 text-center text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              <span>Mo</span>
              <span>Di</span>
              <span>Mi</span>
              <span>Do</span>
              <span>Fr</span>
              <span>Sa</span>
              <span>So</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: startDayIndex }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="h-24 rounded-2xl bg-black/5 opacity-10 dark:bg-white/5"
                />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateObj = new Date(year, month, dayNum);
                const dayEvents = getEventsForDate(dateObj);
                const isToday = new Date().toDateString() === dateObj.toDateString();
                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`flex h-28 flex-col justify-between rounded-2xl border p-2.5 transition-all ${isToday ? "border-[#005377] bg-[#005377]/10" : `${bgItem} hover:border-slate-400`}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono text-xs font-bold ${isToday ? accentBlue : textTitle}`}
                      >
                        {dayNum}
                      </span>
                    </div>
                    <div className="scrollbar-hide max-h-[60px] space-y-1 overflow-y-auto">
                      {dayEvents.map((ev: any, idx: number) => (
                        <div
                          key={idx}
                          className={`truncate rounded px-1.5 py-0.5 text-[10px] font-bold ${ev.type === "putz" ? "border border-[#49111C]/30 bg-[#49111C]/20 text-[#E27B88]" : "bg-[#005377]/20 text-[#3A8EBA] dark:text-[#82CBEE]"}`}
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

        {calendarMode === "week" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
            {getWeekDays().map((d, i) => {
              const dayEvents = getEventsForDate(d);
              const isToday = new Date().toDateString() === d.toDateString();
              return (
                <div
                  key={i}
                  className={`flex min-h-[150px] flex-col rounded-2xl border p-4 ${isToday ? "border-[#005377] bg-[#005377]/10" : bgItem}`}
                >
                  <div className={`text-[10px] font-bold ${textSub}`}>
                    {d.toLocaleDateString("de-DE", { weekday: "short" })}
                  </div>
                  <div
                    className={`mb-3 font-mono text-lg font-extrabold ${isToday ? accentBlue : textTitle}`}
                  >
                    {d.getDate()}. {d.toLocaleDateString("de-DE", { month: "short" })}
                  </div>
                  <div className="flex-1 space-y-2">
                    {dayEvents.map((ev: any, idx: number) => (
                      <div
                        key={idx}
                        className={`truncate rounded-xl p-2 text-xs font-bold ${ev.type === "putz" ? "bg-[#49111C]/20 text-[#E27B88]" : "bg-[#005377]/20 text-[#3A8EBA]"}`}
                      >
                        {ev.title}
                      </div>
                    ))}
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
