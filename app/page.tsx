"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, ShoppingCart, Package, Calendar as CalendarIcon, Clock, Plus, Check, ClipboardList, Camera, UploadCloud, Loader2, Bell, Settings, Sun, Moon, ChevronDown, ChevronUp, Sparkles, Hourglass, UserCheck, Trash2, StickyNote, ArrowUpRight, CheckCircle2
} from "lucide-react";

interface Departure { line: string; destination: string; time: string; }
interface EinkaufItem { rowIndex: number; artikel: string; status: string; kategorie?: string; }
interface PutzItem { rowIndex: number; aufgabe: string; letztesDatum: string; intervall: string; }
interface VorratItem { rowIndex: number; artikel: string; ablaufdatum: string; anbruch: string; }
interface CountdownItem { rowIndex: number; title: string; date: string; icon: string; }
interface NoteItem { rowIndex: number; title: string; content: string; category: string; color: string; }

const KATEGORIEN = ["Obst & Gemüse", "Kühlregal", "Vorrat & Teigwaren", "Getränke", "Drogerie & Haushalt", "Sonstiges"] as const;

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
  
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [weather, setWeather] = useState<string>("Lädt...");
  const [weatherLabel, setWeatherLabel] = useState<string>("Standort");
  const [termine, setTermine] = useState<{ title: string; date: string }[]>([]);
  
  const [einkauf, setEinkauf] = useState<EinkaufItem[]>([]);
  const [neuerArtikel, setNeuerArtikel] = useState("");
  const [showErledigt, setShowErledigt] = useState(false);

  const [aufgaben, setAufgaben] = useState<PutzItem[]>([]);
  const [vorrat, setVorrat] = useState<VorratItem[]>([]);
  const [countdowns, setCountdowns] = useState<CountdownItem[]>([]);
  const [newCdTitle, setNewCdTitle] = useState("");
  const [newCdDate, setNewCdDate] = useState("");
  const [newCdIcon, setNewCdIcon] = useState("✈️");

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
      if (data.notizen) setNotes(data.notizen.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, title: r[0], content: r[1], category: r[2] || "Allgemein", color: r[3] || "emerald" })).filter((x: any) => x.title));
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
        .then(data => { setWeather(`${Math.round(data?.current?.temperature_2m ?? 0)}°C`); setWeatherLabel(label); })
        .catch(() => setWeather("--"));
    };

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchWeather(pos.coords.latitude, pos.coords.longitude, "Wetter vor Ort"),
        () => fetchWeather(48.1764, 11.5311, "München (OEZ)"),
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 600000 }
      );
    } else { fetchWeather(48.1764, 11.5311, "München (OEZ)"); }
  }, []);

  const addEinkauf = async (artikelName?: string) => {
    const text = (artikelName || neuerArtikel).trim();
    if (!text) return;
    const newItem: EinkaufItem = { rowIndex: einkauf.length + 2, artikel: text, status: "Offen", kategorie: ermittleKategorie(text) };
    setEinkauf([...einkauf, newItem]);
    if (!artikelName) setNeuerArtikel("");
    
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

  const addCountdown = async () => {
    if (!newCdTitle || !newCdDate) return;
    const newItem: CountdownItem = { rowIndex: countdowns.length + 2, title: newCdTitle, date: newCdDate, icon: newCdIcon || "⏳" };
    setCountdowns([...countdowns, newItem]);
    setNewCdTitle("");
    setNewCdDate("");
    await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Countdowns", values: [newItem.title, newItem.date, newItem.icon] }) });
    fetchData();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const res = await fetch("/api/vision", { method: "POST", body: JSON.stringify({ imageBase64: base64 }) });
        const aiData = await res.json();
        if (aiData.artikel && aiData.mhd) {
          await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Vorrat", values: [aiData.artikel, aiData.mhd, ""] }) });
          fetchData(); 
        }
      } catch (err) { console.error(err); }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const calculateDaysLeft = (targetDateStr: string) => {
    const target = new Date(targetDateStr);
    const now = new Date();
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const offeneEinkaeufe = einkauf.filter(e => e.status !== "Erledigt");
  const erledigteEinkaeufe = einkauf.filter(e => e.status === "Erledigt");

  const einkaufNachKategorien = KATEGORIEN.reduce((acc, kat) => {
    const items = offeneEinkaeufe.filter(i => (i.kategorie || ermittleKategorie(i.artikel)) === kat);
    if (items.length > 0) acc[kat] = items;
    return acc;
  }, {} as Record<string, EinkaufItem[]>);

  const noteCategories = ["Alle", ...Array.from(new Set(notes.map(n => n.category)))];
  const filteredNotes = activeNoteCategory === "Alle" ? notes : notes.filter(n => n.category === activeNoteCategory);

  const TABS = [
    { id: "home", icon: Home, label: "Dashboard" },
    { id: "einkauf", icon: ShoppingCart, label: "Einkauf" },
    { id: "putzplan", icon: ClipboardList, label: "Putzplan" },
    { id: "vorrat", icon: Package, label: "Vorrat" },
    { id: "notizen", icon: StickyNote, label: "Pinnwand" },
    { id: "kalender", icon: CalendarIcon, label: "Termine" }
  ];

  // MONOCHROME TITAN & MINT THEME TOKENS
  const bgMain = isDarkMode ? "bg-[#090A0C] text-[#E4E4E7]" : "bg-[#F4F5F7] text-[#18181B]";
  const bgSidebar = isDarkMode ? "bg-[#0D0F12] border-white/[0.06]" : "bg-[#FFFFFF] border-[#E4E4E7]";
  const bgCard = isDarkMode ? "bg-[#111317] border border-white/[0.07] text-[#F4F4F5] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]" : "bg-[#FFFFFF] border border-[#E4E4E7] shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] text-[#18181B]";
  const bgInput = isDarkMode ? "bg-[#0D0F12] border-white/[0.1] text-white focus:border-emerald-500" : "bg-[#F4F5F7] border-[#E4E4E7] text-[#18181B] focus:border-emerald-600";
  const bgItem = isDarkMode ? "bg-[#16191F] border-white/[0.05]" : "bg-[#F4F5F7] border-[#E4E4E7]";
  const textTitle = isDarkMode ? "text-[#F4F4F5]" : "text-[#18181B]";
  const textSub = isDarkMode ? "text-[#71717A]" : "text-[#71717A]";

  return (
    <div className={`flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden ${bgMain} font-sans transition-colors duration-300 relative`}>
      
      {/* SUBTILER EMERALD AMBIENT GLOW */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute -top-[15%] left-[20%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-[0.07] ${isDarkMode ? "bg-emerald-500" : "bg-emerald-600"}`} />
      </div>

      {/* SIDEBAR */}
      <aside className={`hidden md:flex w-64 ${bgSidebar} border-r flex-col justify-between p-4 h-full z-20`}>
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className={`font-semibold text-sm tracking-tight ${textTitle}`}>Haushalt OS</span>
          </div>

          <nav className="space-y-1">
            <div className={`px-3 text-[10px] font-semibold ${textSub} uppercase tracking-wider mb-2 mt-4`}>Workspace</div>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive 
                      ? (isDarkMode ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-200") 
                      : `${textSub} hover:bg-black/5 dark:hover:bg-white/5`
                  }`}
                >
                  <tab.icon className={`h-4 w-4 ${isActive ? (isDarkMode ? "text-emerald-400" : "text-emerald-600") : ""}`} /> {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className={`pt-4 border-t ${isDarkMode ? "border-white/[0.06]" : "border-[#E4E4E7]"} flex justify-between items-center px-2`}>
           <button 
             onClick={() => switchUser(activeUser === "Jonas" ? "Lena" : "Jonas")} 
             className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${isDarkMode ? "bg-[#111317] border-white/[0.08] text-white hover:border-emerald-500/40" : "bg-white border-[#E4E4E7] text-slate-800 shadow-sm"}`}
           >
             <UserCheck className="h-3.5 w-3.5 text-emerald-500" /> {activeUser}
           </button>
           <button className={`${textSub} hover:text-emerald-400`}><Settings className="h-4 w-4" /></button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
        
        {/* HEADER */}
        <header className={`pt-safe sticky top-0 z-30 ${isDarkMode ? "bg-[#090A0C]/85 border-white/[0.06]" : "bg-[#F4F5F7]/85 border-[#E4E4E7]"} backdrop-blur-md border-b transition-colors duration-300`}>
          <div className="h-14 px-4 md:px-8 flex items-center justify-between">
            <div className={`flex items-center gap-2 text-xs ${textSub} font-medium tracking-wide`}>
              <span>Workspace</span>
              <span>/</span>
              <span className={`capitalize font-semibold ${textTitle}`}>{activeTab}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`hidden sm:flex items-center gap-2 ${bgCard} rounded-lg px-3 py-1.5 text-xs font-medium`}>
                <CalendarIcon className="h-3.5 w-3.5 text-emerald-500" /> {todayStr}
              </div>
              
              <button 
                onClick={toggleTheme} 
                className={`h-8 w-8 flex items-center justify-center rounded-lg ${bgCard} transition-transform active:scale-95`}
              >
                {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
              </button>

              <button className={`h-8 w-8 flex items-center justify-center rounded-lg ${bgCard}`}>
                <Bell className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 pb-32 md:pb-12 max-w-[1400px] mx-auto w-full space-y-6">
          
          {/* TAB 1: HOME */}
          {activeTab === "home" && (
            <div className="space-y-6">
              
              {/* COUNTDOWNS MIT FORTSCHRITT-ACCENT */}
              {countdowns.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 px-1">Wichtige Countdowns</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {countdowns.map((cd, idx) => {
                      const days = calculateDaysLeft(cd.date);
                      return (
                        <motion.div 
                          whileHover={{ y: -2 }}
                          key={idx} 
                          className={`${bgCard} rounded-xl p-4 flex items-center justify-between transition-all hover:border-emerald-500/40`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">{cd.icon}</span>
                            <div>
                              <h4 className={`text-xs font-semibold ${textTitle}`}>{cd.title}</h4>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{cd.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-bold font-mono text-emerald-400">
                              {days >= 0 ? `${days} Tage` : "Vorbei"}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BENTO GRID: HOMOGENE GRAUTÖNE MIT MINT AKZENTEN */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Wetter Kachel */}
                <div className={`${bgCard} rounded-xl p-5 flex flex-col justify-between min-h-[160px]`}>
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{weatherLabel}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live</span>
                  </div>
                  <div>
                    <div className={`text-4xl font-bold tracking-tight font-mono ${textTitle}`}>{weather}</div>
                    <p className="text-xs text-slate-400 mt-1">Außentemperatur</p>
                  </div>
                </div>

                {/* 2. Tasks & Einkauf Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`${bgCard} rounded-xl p-5 flex flex-col justify-center items-center text-center cursor-pointer hover:border-emerald-500/40 transition-all`} onClick={() => setActiveTab("putzplan")}>
                    <div className="text-3xl font-bold font-mono text-emerald-400">{aufgaben.length}</div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Putz-Tasks</div>
                  </div>
                  <div className={`${bgCard} rounded-xl p-5 flex flex-col justify-center items-center text-center cursor-pointer hover:border-emerald-500/40 transition-all`} onClick={() => setActiveTab("einkauf")}>
                    <div className="text-3xl font-bold font-mono text-emerald-400">{offeneEinkaeufe.length}</div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Auf der Liste</div>
                  </div>
                </div>

                {/* 3. Abfahrten MVG */}
                <div className={`${bgCard} rounded-xl p-5 flex flex-col justify-between`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Abfahrten OEZ</h3>
                    <span className="text-[10px] text-emerald-400 font-mono">Live MVG</span>
                  </div>
                  <div className="space-y-2.5">
                    {departures.slice(0, 3).map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{d.line}</span>
                          <span className={`truncate max-w-[130px] font-medium ${textTitle}`}>{d.destination}</span>
                        </div>
                        <span className="font-mono text-slate-400">{d.time}</span>
                      </div>
                    ))}
                    {departures.length === 0 && <span className="text-xs text-slate-500">Keine Live-Abfahrten</span>}
                  </div>
                </div>

                {/* 4. Termine Box */}
                <div className={`md:col-span-2 lg:col-span-3 ${bgCard} rounded-xl p-5`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Anstehende Termine</h3>
                    <span className="text-[10px] text-slate-400">iCloud Kalender</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {termine.slice(0, 3).map((t, i) => (
                      <div key={i} className={`p-3.5 rounded-lg border ${bgItem} flex flex-col justify-between gap-2`}>
                        <span className={`text-xs font-medium ${textTitle} truncate`}>{t.title}</span>
                        <span className="text-[10px] font-mono text-emerald-400 w-fit px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">{t.date}</span>
                      </div>
                    ))}
                    {termine.length === 0 && <p className="text-xs text-slate-500 py-2">Keine anstehenden Termine.</p>}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: EINKAUF */}
          {activeTab === "einkauf" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-lg font-bold tracking-tight ${textTitle}`}>Einkaufsliste</h2>
                  <p className={`text-xs ${textSub}`}>Gruppiert nach Supermarkt-Kategorien</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                  {offeneEinkaeufe.length} offen
                </span>
              </div>

              {/* Favoriten Chips */}
              <div className={`${bgCard} rounded-xl p-4 space-y-2`}>
                <div className="text-[11px] font-semibold text-slate-400">Schnellwahl Favoriten:</div>
                <div className="flex flex-wrap gap-2">
                  {SCHNELLWAHL_FAVORITEN.map((fav, idx) => (
                    <button key={idx} onClick={() => addEinkauf(fav)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${bgItem} ${textTitle} hover:border-emerald-500/40`}>
                      + {fav}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eingabefeld */}
              <div className={`${bgCard} rounded-xl p-5`}>
                <div className={`flex flex-col md:flex-row gap-3 mb-6 pb-6 border-b ${isDarkMode ? "border-white/[0.06]" : "border-[#E4E4E7]"}`}>
                  <input 
                    type="text" 
                    placeholder="Neuer Artikel (z.B. Hafermilch)..." 
                    value={neuerArtikel} 
                    onChange={(e) => setNeuerArtikel(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && addEinkauf()} 
                    className={`flex-1 ${bgInput} border rounded-lg px-4 py-2.5 text-xs focus:outline-none transition-all`} 
                  />
                  <button onClick={() => addEinkauf()} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all">
                    Hinzufügen
                  </button>
                </div>

                {/* Gruppierte Warengruppen */}
                <div className="space-y-6">
                  {Object.keys(einkaufNachKategorien).length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">Alles erledigt! Keine offenen Artikel.</p>
                  ) : (
                    Object.entries(einkaufNachKategorien).map(([kategorie, items]) => (
                      <div key={kategorie} className="space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
                          <span>{kategorie}</span>
                          <span className="font-normal text-slate-500">{items.length}</span>
                        </div>
                        <div className="space-y-1.5">
                          {items.map((item) => (
                            <div key={item.rowIndex} className={`flex items-center justify-between p-3 rounded-lg border ${bgItem}`}>
                              <span className={`text-xs font-medium ${textTitle}`}>{item.artikel}</span>
                              <div className="flex items-center gap-2">
                                <button onClick={() => markEinkaufErledigt(item, "Erledigt")} className="h-6 px-2.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                                  <Check className="h-3 w-3" /> <span>Erledigt</span>
                                </button>
                                <button onClick={() => deleteEinkauf(item)} className="p-1 text-slate-500 hover:text-rose-400 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {erledigteEinkaeufe.length > 0 && (
                  <div className={`mt-6 pt-4 border-t ${isDarkMode ? "border-white/[0.06]" : "border-[#E4E4E7]"}`}>
                    <button onClick={() => setShowErledigt(!showErledigt)} className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200">
                      <span>Bereits gekauft ({erledigteEinkaeufe.length})</span>
                      {showErledigt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    {showErledigt && (
                      <div className="space-y-1 mt-3 opacity-60">
                        {erledigteEinkaeufe.map((item) => (
                          <div key={item.rowIndex} className="flex items-center justify-between p-2 text-xs line-through text-slate-500">
                            <span>{item.artikel}</span>
                            <button onClick={() => markEinkaufErledigt(item, "Offen")} className="text-[10px] text-emerald-400 hover:underline">Wiederherstellen</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PUTZPLAN */}
          {activeTab === "putzplan" && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-lg font-bold tracking-tight ${textTitle}`}>Putzplan & Aufgaben</h2>
                <p className={`text-xs ${textSub}`}>Zuletzt erledigte Aufgaben & Fälligkeiten</p>
              </div>
              <div className={`${bgCard} rounded-xl p-5`}>
                <div className="space-y-2.5">
                  {aufgaben.map((a, idx) => (
                    <div key={idx} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border ${bgItem} gap-3 sm:gap-0`}>
                      <div>
                        <div className={`font-medium text-xs ${textTitle} mb-1`}>{a.aufgabe}</div>
                        <div className="flex gap-3 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Intervall: {a.intervall} Tage</span>
                          <span>Letztes Mal: <span className="font-mono text-slate-300">{a.letztesDatum}</span></span>
                        </div>
                      </div>
                      <button onClick={() => markAufgabeErledigt(a)} className={`w-full sm:w-auto h-7 px-3 text-xs font-medium rounded-lg ${isDarkMode ? "bg-white/5 text-white hover:bg-white/10" : "bg-slate-100 text-slate-800 hover:bg-slate-200"} border border-white/[0.08] transition-colors`}>
                        Als {activeUser} erledigt
                      </button>
                    </div>
                  ))}
                  {aufgaben.length === 0 && <p className="text-xs text-slate-500 text-center py-6">Keine Aufgaben hinterlegt.</p>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VORRAT */}
          {activeTab === "vorrat" && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-lg font-bold tracking-tight ${textTitle}`}>Vorratskammer & KI Scanner</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-1 ${bgCard} rounded-xl p-5 flex flex-col h-[260px]`}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2"><Camera className="h-3.5 w-3.5 text-emerald-400" /> Scanner</h3>
                  <div className={`flex-1 border-2 border-dashed ${isDarkMode ? "border-white/[0.06] bg-black/20" : "border-[#E4E4E7] bg-slate-50"} rounded-lg flex flex-col items-center justify-center p-4 text-center`}>
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-2"><Loader2 className="h-5 w-5 text-emerald-400 animate-spin" /><span className="text-[10px] text-slate-400">Gemini analysiert...</span></div>
                    ) : (
                      <>
                        <UploadCloud className="h-6 w-6 text-slate-400 mb-2" />
                        <p className="text-[10px] text-slate-400 mb-3">Foto machen $\rightarrow$ KI erfasst MHD</p>
                        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg transition-all font-medium">
                          Kamera starten
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className={`lg:col-span-2 ${bgCard} rounded-xl p-5 flex flex-col min-h-[260px]`}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Aktueller Bestand</h3>
                  <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? "border-white/[0.06]" : "border-[#E4E4E7]"}`}>
                          <th className="pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Artikel</th>
                          <th className="pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right">MHD</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? "divide-white/[0.03]" : "divide-slate-100"}`}>
                        {vorrat.map((v, idx) => (
                          <tr key={idx}>
                            <td className={`py-2.5 text-xs font-medium ${textTitle}`}>{v.artikel}</td>
                            <td className="py-2.5 text-[11px] text-slate-400 text-right font-mono">{v.ablaufdatum}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PINNWAND */}
          {activeTab === "notizen" && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-lg font-bold tracking-tight ${textTitle}`}>Pinnwand</h2>
                <p className={`text-xs ${textSub}`}>Digitale Notizen & Infos</p>
              </div>

              {/* Kategorien */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {noteCategories.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setActiveNoteCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeNoteCategory === cat ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : `${bgCard} ${textSub}`}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Notizen Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map((note) => (
                  <div key={note.rowIndex} className={`${bgCard} rounded-xl p-4 border relative overflow-hidden`}>
                    <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {note.category}
                    </span>
                    <h3 className={`text-xs font-semibold mt-2 mb-1 ${textTitle}`}>{note.title}</h3>
                    <p className={`text-xs leading-relaxed ${textSub} whitespace-pre-line`}>
                      {note.content}
                    </p>
                  </div>
                ))}
                {filteredNotes.length === 0 && <p className="text-xs text-slate-500 col-span-full py-6 text-center">Keine Notizen vorhanden.</p>}
              </div>
            </div>
          )}

          {/* TAB 6: KALENDER */}
          {activeTab === "kalender" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className={`text-base font-bold tracking-tight ${textTitle} flex items-center gap-2`}>
                  <Hourglass className="h-4 w-4 text-emerald-400" /> Countdowns anlegen
                </h2>
                <div className={`${bgCard} rounded-xl p-4`}>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input 
                      type="text" 
                      placeholder="Event Name (z.B. Urlaub)..." 
                      value={newCdTitle} 
                      onChange={e => setNewCdTitle(e.target.value)} 
                      className={`sm:col-span-2 ${bgInput} border rounded-lg px-3 py-2 text-xs focus:outline-none`}
                    />
                    <input 
                      type="date" 
                      value={newCdDate} 
                      onChange={e => setNewCdDate(e.target.value)} 
                      className={`${bgInput} border rounded-lg px-3 py-2 text-xs focus:outline-none`}
                    />
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Emoji" 
                        value={newCdIcon} 
                        onChange={e => setNewCdIcon(e.target.value)} 
                        className={`w-14 text-center ${bgInput} border rounded-lg px-2 py-2 text-xs focus:outline-none`}
                      />
                      <button onClick={addCountdown} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all">
                        Speichern
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className={`text-base font-bold tracking-tight ${textTitle}`}>iCloud Kalender Termine</h2>
                <div className={`${bgCard} rounded-xl p-4`}>
                  <div className="space-y-2">
                    {termine.map((t, idx) => (
                      <div key={idx} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border ${bgItem} gap-2 sm:gap-0`}>
                        <span className={`text-xs font-medium ${textTitle}`}>{t.title}</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 w-fit">{t.date}</span>
                      </div>
                    ))}
                    {termine.length === 0 && <p className="text-xs text-slate-500 text-center py-6">Keine Termine vorhanden.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${isDarkMode ? "bg-[#090A0C]/90 border-white/[0.06]" : "bg-white/90 border-[#E4E4E7]"} backdrop-blur-xl border-t px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] flex justify-around items-center`}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center w-12 h-11 gap-1 rounded-lg transition-all ${isActive ? "text-emerald-400 font-semibold" : textSub}`}>
              <tab.icon className="h-4 w-4" />
              <span className="text-[9px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}