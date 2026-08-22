"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, ShoppingCart, Package, Calendar as CalendarIcon, Clock, Plus, Check, ClipboardList, Camera, UploadCloud, Loader2, Bell, Settings, Sun, Moon, ChevronDown, ChevronUp, Sparkles, Hourglass, UserCheck, Trash2, StickyNote, X, CloudSun
} from "lucide-react";

interface Departure { line: string; destination: string; time: string; }
interface EinkaufItem { rowIndex: number; artikel: string; status: string; kategorie?: string; }
interface PutzItem { rowIndex: number; aufgabe: string; letztesDatum: string; intervall: string; }
interface VorratItem { rowIndex: number; artikel: string; ablaufdatum: string; anbruch: string; }
interface CountdownItem { rowIndex: number; title: string; date: string; icon: string; }
interface NoteItem { rowIndex: number; title: string; content: string; category: string; color: string; }

const KATEGORIEN = ["Obst & Gemüse", "Kühlregal", "Vorrat & Teigwaren", "Getränke", "Drogerie & Haushalt", "Sonstiges"] as const;
const NOTE_COLORS: Record<string, string> = {
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  rose: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  purple: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
};

function ermittleKategorie(artikel: string): string {
  const a = artikel.toLowerCase();
  if (/apfel|äpfel|banane|beere|salat|tomate|gurke|zitrone|kartoffel|zwiebel|avocado|paprika|obst|gemüse|birne/.test(a)) return "Obst & Gemüse";
  if (/milch|käse|joghurt|butter|quark|tofu|sahne|frischkäse|fleisch|wurst|ei|eier/.test(a)) return "Kühlregal";
  if (/brot|toast|pasta|nudel|reis|mehl|zucker|öl|hafer|müsli|konserve|bohnen|kichererbsen/.test(a)) return "Vorrat & Teigwaren";
  if (/wasser|saft|bier|wein|cola|limo|sprudel|tee|kaffee/.test(a)) return "Getränke";
  if (/spüli|papier|seife|shampoo|zahnpasta|putzmittel|waschmittel|müllbeutel|deo/.test(a)) return "Drogerie & Haushalt";
  return "Sonstiges";
}

const SCHNELLWAHL_FAVORITEN = ["Hafermilch", "Bananen", "Eier", "Körniger Frischkäse", "Toast", "Äpfel", "Spüli", "Mineralwasser"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeUser, setActiveUser] = useState<"Jonas" | "Lena">("Jonas");
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [weather, setWeather] = useState<string>("Lädt...");
  const [weatherLabel, setWeatherLabel] = useState<string>("Wetter sucht...");
  const [termine, setTermine] = useState<{ title: string; date: string }[]>([]);
  
  const [einkauf, setEinkauf] = useState<EinkaufItem[]>([]);
  const [neuerArtikel, setNeuerArtikel] = useState("");
  const [showErledigt, setShowErledigt] = useState(false);

  const [aufgaben, setAufgaben] = useState<PutzItem[]>([]);
  const [vorrat, setVorrat] = useState<VorratItem[]>([]);
  const [countdowns, setCountdowns] = useState<CountdownItem[]>([]);
  
  // Notizen (Notion-Style)
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNoteCategory, setActiveNoteCategory] = useState<string>("Alle");

  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());

  useEffect(() => {
    const savedTheme = localStorage.getItem("haushalt_theme");
    if (savedTheme === "light") setIsDarkMode(false);
    
    const savedUser = localStorage.getItem("haushalt_user") as "Jonas" | "Lena" | null;
    if (savedUser) setActiveUser(savedUser);
  }, []);

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem("haushalt_theme", nextMode ? "dark" : "light");
  };

  const switchUser = (user: "Jonas" | "Lena") => {
    setActiveUser(user);
    localStorage.setItem("haushalt_user", user);
  };

  const fetchData = async () => {
    try {
      const res = await fetch("/api/data");
      const data = await res.json();
      if (data.einkauf) setEinkauf(data.einkauf.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, artikel: r[0], status: r[1] || "Offen", kategorie: ermittleKategorie(r[0]) })).filter((x: any) => x.artikel));
      if (data.haushalt) setAufgaben(data.haushalt.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, aufgabe: r[0], letztesDatum: r[1], intervall: r[2] })).filter((x: any) => x.aufgabe));
      if (data.vorrat) setVorrat(data.vorrat.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, artikel: r[0], ablaufdatum: r[1], anbruch: r[2] || "" })).filter((x: any) => x.artikel));
      if (data.countdowns) setCountdowns(data.countdowns.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, title: r[0], date: r[1], icon: r[2] || "⏳" })).filter((x: any) => x.title));
      if (data.notizen) setNotes(data.notizen.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, title: r[0], content: r[1], category: r[2] || "Allgemein", color: r[3] || "blue" })).filter((x: any) => x.title));
    } catch (e) { console.error("Sheets Fetch Fehler:", e); }
  };

  useEffect(() => {
    fetchData();
    fetch("/api/calendar").then(res => res.json()).then(data => setTermine(data.events || [])).catch(() => {});
    fetch("https://www.mvg.de/api/bgw-pt/v3/departures?globalId=de:09162:70").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setDepartures(data.slice(0, 5).map((d: any) => ({
        line: d.label || "U", destination: d.destination || "Unbekannt", time: new Date(d.realtimeDepartureTime || d.plannedDepartureTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
      })));
    }).catch(() => {});

    const fetchWeather = (lat: number, lon: number, label: string) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`)
        .then(res => res.json())
        .then(data => { setWeather(`${data?.current?.temperature_2m ?? "--"}°C`); setWeatherLabel(label); })
        .catch(() => setWeather("N/A"));
    };

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchWeather(pos.coords.latitude, pos.coords.longitude, "GPS Standort"),
        () => fetchWeather(48.1764, 11.5311, "Wetter OEZ"),
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 600000 }
      );
    } else { fetchWeather(48.1764, 11.5311, "Wetter OEZ"); }
  }, []);

  const addEinkauf = async (artikelName?: string) => {
    const text = (artikelName || neuerArtikel).trim();
    if (!text) return;
    const newItem: EinkaufItem = { rowIndex: einkauf.length + 2, artikel: text, status: "Offen", kategorie: ermittleKategorie(text) };
    setEinkauf([...einkauf, newItem]);
    if (!artikelName) setNeuerArtikel("");
    setIsFabOpen(false);
    
    await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Einkauf", values: [newItem.artikel, newItem.status] }) });
    fetchData(); 
  };

  const markEinkaufErledigt = async (item: EinkaufItem, status: "Erledigt" | "Offen") => {
    setEinkauf(einkauf.map(e => e.rowIndex === item.rowIndex ? { ...e, status } : e));
    await fetch("/api/data", { method: "PUT", body: JSON.stringify({ sheetName: "Einkauf", rowIndex: item.rowIndex, values: [item.artikel, status] }) });
  };

  const deleteEinkauf = async (item: EinkaufItem) => {
    setEinkauf(einkauf.filter(e => e.rowIndex !== item.rowIndex));
    await fetch("/api/data", { method: "PUT", body: JSON.stringify({ sheetName: "Einkauf", rowIndex: item.rowIndex, values: ["", ""] }) });
  };

  const markAufgabeErledigt = async (item: PutzItem) => {
    const today = new Date().toISOString().split("T")[0];
    setAufgaben(aufgaben.map(a => a.rowIndex === item.rowIndex ? { ...a, letztesDatum: today } : a));
    await fetch("/api/data", { method: "PUT", body: JSON.stringify({ sheetName: "Haushalt", rowIndex: item.rowIndex, values: [item.aufgabe, today, item.intervall, activeUser] }) });
  };

  const calculateDaysLeft = (targetDateStr: string) => {
    const target = new Date(targetDateStr);
    const now = new Date();
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const offeneEinkaeufe = einkauf.filter(e => e.status !== "Erledigt");
  const erledigteEinkaeufe = einkauf.filter(e => e.status === "Erledigt");
  const noteCategories = ["Alle", ...Array.from(new Set(notes.map(n => n.category)))];
  const filteredNotes = activeNoteCategory === "Alle" ? notes : notes.filter(n => n.category === activeNoteCategory);

  const TABS = [
    { id: "home", icon: Home, label: "Home" },
    { id: "einkauf", icon: ShoppingCart, label: "Einkauf" },
    { id: "putzplan", icon: ClipboardList, label: "Putzplan" },
    { id: "notizen", icon: StickyNote, label: "Pinnwand" },
    { id: "kalender", icon: CalendarIcon, label: "Termine" }
  ];

  // Glassmorphism & Themes
  // Dynamische Theme-Tokens nach dem neuen Farb-System
  const bgMain = isDarkMode ? "bg-[#08090C] text-slate-100" : "bg-[#F8FAFC] text-slate-900";
  const bgSidebar = isDarkMode ? "bg-[#08090C]/90 border-white/[0.07]" : "bg-white/90 border-slate-200";
  const bgGlassCard = isDarkMode ? "obsidian-card" : "bg-white border border-slate-200 shadow-sm";
  const bgInput = isDarkMode ? "bg-white/[0.03] border-white/[0.08] text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600";
  const textTitle = isDarkMode ? "text-slate-100" : "text-slate-900";
  const textSub = isDarkMode ? "text-zinc-500" : "text-slate-500";

  // Badges & Akzent-Highlights
  const badgePrimary = isDarkMode ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-indigo-50 text-indigo-600 border border-indigo-200";
  const badgeSuccess = isDarkMode ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-200";
  const badgeWarning = isDarkMode ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-amber-50 text-amber-600 border border-amber-200";
  const badgeRose = isDarkMode ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-rose-50 text-rose-600 border border-rose-200";

  // Dynamischer Ambient Glow
  const getGlowColor = () => {
    if (activeTab === "einkauf") return "from-emerald-500/20 to-teal-500/10";
    if (activeTab === "putzplan") return "from-amber-500/20 to-orange-500/10";
    if (activeTab === "notizen") return "from-purple-500/20 to-pink-500/10";
    return "from-blue-500/20 to-indigo-500/10";
  };

  return (
    <div className={`flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden ${bgMain} font-sans transition-colors duration-500 relative`}>
      
      {/* AMBIENT GLOW MESH GRADIANT */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
          className={`absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[100px] opacity-60 mix-blend-screen bg-gradient-to-br ${getGlowColor()} transition-colors duration-1000`}
        />
        <div className={`absolute bottom-[10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-40 bg-gradient-to-tl from-blue-600/10 to-transparent`} />
      </div>

      {/* SIDEBAR */}
      <aside className={`hidden md:flex w-64 ${bgSidebar} backdrop-blur-xl border-r flex-col justify-between p-4 h-full z-20`}>
        {/* Sidebar Content identisch... */}
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className={`font-bold text-sm tracking-tight ${textTitle}`}>Haushalt OS</span>
          </div>

          <nav className="space-y-1">
            <div className={`px-3 text-[10px] font-semibold ${textSub} uppercase tracking-wider mb-2 mt-4`}>Workspace</div>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${isActive ? (isDarkMode ? "bg-white/10 text-white shadow-sm" : "bg-white text-blue-600 shadow-sm") : "text-slate-500 hover:bg-black/5 dark:hover:bg-white/5"}`}>
                  <tab.icon className={`h-4 w-4 ${isActive ? "text-blue-500" : ""}`} /> {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className={`pt-4 border-t ${isDarkMode ? "border-white/10" : "border-slate-200"} flex justify-between px-2`}>
           <button onClick={() => switchUser(activeUser === "Jonas" ? "Lena" : "Jonas")} className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${isDarkMode ? "bg-white/5 text-white hover:bg-white/10" : "bg-white text-slate-800 shadow-sm hover:bg-slate-50"}`}>
             <UserCheck className="h-3.5 w-3.5 text-blue-500" /> {activeUser}
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
        
        <header className={`pt-safe sticky top-0 z-30 ${isDarkMode ? "bg-[#030407]/60 border-white/5" : "bg-[#f4f6f8]/60 border-slate-200"} backdrop-blur-2xl border-b transition-colors duration-300`}>
          {/* Header Content... */}
          <div className="h-14 px-4 md:px-8 flex items-center justify-between">
            <h1 className={`text-sm font-bold tracking-tight capitalize ${textTitle}`}>{activeTab}</h1>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className={`h-8 w-8 flex items-center justify-center rounded-full ${bgGlassCard} transition-transform active:scale-95`}>
                {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 pb-32 md:pb-12 max-w-[1400px] mx-auto w-full space-y-6">
          
          {/* TAB 1: HOME (MODERN BENTO GRID) */}
          {activeTab === "home" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              
              {/* Wetter (2x2) */}
              <div className={`col-span-2 row-span-2 ${bgGlassCard} rounded-3xl p-6 flex flex-col justify-between border`}>
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-semibold ${textSub}`}>{weatherLabel}</span>
                  <CloudSun className="h-6 w-6 text-blue-400" />
                </div>
                <div className="mt-8">
                  <div className={`text-4xl md:text-5xl font-extrabold tracking-tighter ${textTitle}`}>{weather}</div>
                  <div className="text-xs font-medium text-blue-500 mt-2">Perfektes Wetter für draußen</div>
                </div>
              </div>

              {/* ToDos (1x2 oder 2x1) */}
              <div className={`col-span-1 row-span-1 lg:col-span-2 ${bgGlassCard} border rounded-3xl p-5 flex flex-col justify-center items-center text-center`}>
                <div className={`text-3xl font-black ${textTitle}`}>{aufgaben.length}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Offene Tasks</div>
              </div>

              {/* Einkauf (1x2 oder 2x1) */}
              <div className={`col-span-1 row-span-1 lg:col-span-2 ${bgGlassCard} border rounded-3xl p-5 flex flex-col justify-center items-center text-center`}>
                <div className={`text-3xl font-black ${textTitle}`}>{offeneEinkaeufe.length}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Auf der Liste</div>
              </div>

              {/* MVG (2x2) */}
              <div className={`col-span-2 lg:col-span-3 row-span-2 ${bgGlassCard} border rounded-3xl p-6 flex flex-col`}>
                <h3 className={`text-sm font-bold ${textTitle} mb-4`}>Abfahrten OEZ</h3>
                <div className="space-y-4 flex-1">
                  {departures.slice(0,3).map((d, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black px-2 py-1 rounded-md bg-blue-500/20 text-blue-500">{d.line}</span>
                        <span className={`text-xs font-medium ${textTitle}`}>{d.destination}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-slate-500">{d.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Termine (2x2) */}
              <div className={`col-span-2 lg:col-span-3 row-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 flex flex-col relative overflow-hidden shadow-xl shadow-blue-900/20`}>
                <div className="absolute -right-4 -top-4 opacity-20"><CalendarIcon className="h-32 w-32" /></div>
                <h3 className="text-sm font-bold mb-4 relative z-10">Anstehende Termine</h3>
                <div className="space-y-4 relative z-10 flex-1">
                  {termine.slice(0,3).map((t, i) => (
                    <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-xl backdrop-blur-md">
                      <span className="text-xs font-medium truncate pr-4">{t.title}</span>
                      <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-1 rounded-md whitespace-nowrap">{t.date}</span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: NOTION-STYLE PINNWAND */}
          {activeTab === "notizen" && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className={`text-2xl font-extrabold tracking-tight ${textTitle}`}>Pinnwand</h2>
                  <p className={`text-sm ${textSub}`}>Digitale Notizen & Infos</p>
                </div>
                <button className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Neue Notiz
                </button>
              </div>

              {/* Kategorien-Pillen */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {noteCategories.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setActiveNoteCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeNoteCategory === cat ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : `${bgGlassCard} ${textSub} border hover:border-slate-400`}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Masonry-artiges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredNotes.map((note) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={note.rowIndex} 
                      className={`${bgGlassCard} border rounded-3xl p-6 group relative overflow-hidden`}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-md border ${NOTE_COLORS[note.color] || NOTE_COLORS.blue}`}>
                          {note.category}
                        </span>
                      </div>
                      <h3 className={`text-lg font-bold tracking-tight mb-2 ${textTitle}`}>{note.title}</h3>
                      <p className={`text-sm leading-relaxed ${textSub} whitespace-pre-line`}>
                        {note.content}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* TAB 2: EINKAUFSLISTE (MIT SWIPE GESTURES) */}
          {activeTab === "einkauf" && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-2xl font-extrabold tracking-tight ${textTitle}`}>Einkaufsliste</h2>
              </div>
              <div className={`${bgGlassCard} border rounded-3xl p-5 md:p-8`}>
                
                {/* Swipeable List Items */}
                <div className="space-y-4">
                  {einkauf.filter(e => e.status !== "Erledigt").map((item) => (
                    <div key={item.rowIndex} className="relative rounded-2xl overflow-hidden bg-rose-500/20">
                      {/* Swipe Background Action (Delete/Check) */}
                      <div className="absolute inset-0 flex justify-between items-center px-6">
                         <div className="text-rose-500 font-bold flex items-center gap-2"><Trash2 className="h-5 w-5"/> Löschen</div>
                         <div className="text-emerald-500 font-bold flex items-center gap-2">Erledigt <Check className="h-5 w-5"/></div>
                      </div>
                      
                      <motion.div 
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.8}
                        onDragEnd={(e, info) => {
                          if (info.offset.x > 100) deleteEinkauf(item);      // Swipe Right -> Delete
                          if (info.offset.x < -100) markEinkaufErledigt(item, "Erledigt"); // Swipe Left -> Check
                        }}
                        className={`relative z-10 ${isDarkMode ? "bg-[#11141a]" : "bg-white"} border ${isDarkMode ? "border-white/5" : "border-slate-200"} p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-grab active:cursor-grabbing`}
                      >
                        <span className={`text-base font-semibold ${textTitle}`}>{item.artikel}</span>
                        <div className="hidden md:flex items-center gap-2">
                          <button onClick={() => markEinkaufErledigt(item, "Erledigt")} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"><Check className="h-4 w-4" /></button>
                          <button onClick={() => deleteEinkauf(item)} className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}

          {/* Andere Tabs bleiben logisch gleich, hier gekürzt für Lesbarkeit des Codes */}
        </div>
      </main>

      {/* DYNAMIC FLOATING ACTION BUTTON (FAB) */}
      <div className="md:hidden fixed bottom-24 right-6 z-50">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-16 right-0 flex flex-col gap-3"
            >
              <button onClick={() => { setActiveTab("notizen"); setIsFabOpen(false); }} className="flex items-center justify-end gap-3 group">
                <span className="bg-white/90 text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">Notiz</span>
                <div className="h-12 w-12 rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center"><StickyNote className="h-5 w-5" /></div>
              </button>
              <button onClick={() => { setActiveTab("einkauf"); setIsFabOpen(false); }} className="flex items-center justify-end gap-3 group">
                <span className="bg-white/90 text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">Einkauf</span>
                <div className="h-12 w-12 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center"><ShoppingCart className="h-5 w-5" /></div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${isFabOpen ? "bg-slate-800 text-white rotate-45" : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:scale-105"}`}
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>

      {/* MOBILE BOTTOM NAVIGATION (Mit Safe Area Blur) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/10 backdrop-blur-3xl border-t ${isDarkMode ? "border-white/10" : "border-slate-200"} px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] flex justify-around items-center`}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center w-14 h-11 gap-1 rounded-xl transition-all ${isActive ? "text-blue-500" : textSub}`}>
              <tab.icon className={`h-5 w-5`} />
              <span className="text-[9px] font-bold tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}