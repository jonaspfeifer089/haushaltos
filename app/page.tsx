"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Home, ShoppingCart, Package, Calendar as CalendarIcon, Clock, Plus, Check, ClipboardList, Camera, UploadCloud, Loader2, Bell, Settings, Sun, Moon, ChevronDown, ChevronUp, Sparkles, Hourglass, UserCheck, Trash2, StickyNote
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
  const [isDarkMode, setIsDarkMode] = useState(false);
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
    if (savedTheme === "dark") setIsDarkMode(true);
    
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
      if (data.notizen) setNotes(data.notizen.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, title: r[0], content: r[1], category: r[2] || "Allgemein", color: r[3] || "green" })).filter((x: any) => x.title));
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

  // FARBPALETTE:
  // Sea Green:     #5B8C5A (Text Dark: #386137)
  // Yale Blue:     #005377 (Text Dark: #003750)
  // Golden Sand:   #CFD186 (Dark Tint: #E0E2A0)
  // Night Bordeaux:#49111C
  // Espresso:      #502419

  const bgMain = isDarkMode ? "bg-[#100A0B] text-[#EDE7E3]" : "bg-[#FAF8F5] text-[#2D2A26]";
  const bgSidebar = isDarkMode ? "bg-[#180F12] border-white/[0.08]" : "bg-[#FFFFFF] border-[#E8E2D9]";
  const bgCard = isDarkMode ? "bg-[#1E1418] border border-white/[0.08] text-[#FAF8F5] shadow-[0_4px_20px_rgba(0,0,0,0.4)]" : "bg-[#FFFFFF] border border-[#E8E2D9] shadow-[0_2px_8px_rgba(80,36,25,0.04)] text-[#2D2A26]";
  const bgInput = isDarkMode ? "bg-[#140C0E] border-white/[0.1] text-white focus:border-[#CFD186]" : "bg-[#FAF8F5] border-[#E8E2D9] text-[#2D2A26] focus:border-[#005377]";
  const bgItem = isDarkMode ? "bg-[#251A1E] border-white/[0.05]" : "bg-[#F7F4EF] border-[#E8E2D9]";
  const textTitle = isDarkMode ? "text-[#FAF8F5]" : "text-[#2D2A26]";
  const textSub = isDarkMode ? "text-[#A89F91]" : "text-[#7A7265]";
  
  // Kontraststarke Akzentfarben
  const accentGreen = isDarkMode ? "text-[#7DB47C]" : "text-[#3D693C]";
  const accentBlue = isDarkMode ? "text-[#3A8EBA]" : "text-[#005377]";
  const accentGold = isDarkMode ? "text-[#DFE19E]" : "text-[#858739]";
  const badgeGreen = isDarkMode ? "bg-[#5B8C5A]/20 text-[#9ED09D] border border-[#5B8C5A]/40" : "bg-[#5B8C5A]/15 text-[#2C522B] border border-[#5B8C5A]/30";
  const badgeBlue = isDarkMode ? "bg-[#005377]/30 text-[#6BB9E0] border border-[#005377]/50" : "bg-[#005377]/10 text-[#005377] border border-[#005377]/25";
  const buttonPrimary = isDarkMode ? "bg-[#005377] hover:bg-[#006894] text-white" : "bg-[#005377] hover:bg-[#00415E] text-white shadow-sm";

  return (
    <div className={`flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden ${bgMain} font-sans transition-colors duration-300 relative`}>
      
      {/* AMBIENT GLOW */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute -top-[15%] left-[20%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-[0.06] ${isDarkMode ? "bg-[#005377]" : "bg-[#5B8C5A]"}`} />
      </div>

      {/* SIDEBAR */}
      <aside className={`hidden md:flex w-64 ${bgSidebar} border-r flex-col justify-between p-4 h-full z-20`}>
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="h-8 w-8 rounded-xl bg-[#005377] flex items-center justify-center shadow-md shadow-[#005377]/20">
              <Sparkles className="w-4 h-4 text-[#CFD186]" />
            </div>
            <div>
              <span className={`font-bold text-sm tracking-tight ${textTitle} block leading-none`}>Haushalt OS</span>
              <span className={`text-[10px] ${textSub} font-medium`}>Smart Dashboard</span>
            </div>
          </div>

          <nav className="space-y-1">
            <div className={`px-3 text-[10px] font-bold ${textSub} uppercase tracking-wider mb-2 mt-4`}>Workspace</div>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? (isDarkMode ? "bg-[#005377]/30 text-[#82CBEE] border border-[#005377]/50" : "bg-[#005377]/10 text-[#005377] border border-[#005377]/20") 
                      : `${textSub} hover:bg-black/5 dark:hover:bg-white/5`
                  }`}
                >
                  <tab.icon className={`h-4 w-4 ${isActive ? (isDarkMode ? "text-[#82CBEE]" : "text-[#005377]") : ""}`} /> {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className={`pt-4 border-t ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} flex justify-between items-center px-2`}>
           <button 
             onClick={() => switchUser(activeUser === "Jonas" ? "Lena" : "Jonas")} 
             className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-2 border transition-all ${isDarkMode ? "bg-[#251A1E] border-white/[0.08] text-white hover:border-[#CFD186]/40" : "bg-[#FAF8F5] border-[#E8E2D9] text-[#2D2A26] shadow-sm hover:border-[#005377]/40"}`}
           >
             <UserCheck className="h-3.5 w-3.5 text-[#5B8C5A]" /> {activeUser}
           </button>
           <button className={`${textSub} hover:text-[#005377]`}><Settings className="h-4 w-4" /></button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
        
        {/* HEADER */}
        <header className={`pt-safe sticky top-0 z-30 ${isDarkMode ? "bg-[#100A0B]/85 border-white/[0.08]" : "bg-[#FAF8F5]/85 border-[#E8E2D9]"} backdrop-blur-md border-b transition-colors duration-300`}>
          <div className="h-14 px-4 md:px-8 flex items-center justify-between">
            <div className={`flex items-center gap-2 text-xs ${textSub} font-medium tracking-wide`}>
              <span>Workspace</span>
              <span>/</span>
              <span className={`capitalize font-bold ${textTitle}`}>{activeTab}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`hidden sm:flex items-center gap-2 ${bgCard} rounded-lg px-3 py-1.5 text-xs font-semibold`}>
                <CalendarIcon className="h-3.5 w-3.5 text-[#005377]" /> {todayStr}
              </div>
              
              <button 
                onClick={toggleTheme} 
                className={`h-8 w-8 flex items-center justify-center rounded-lg ${bgCard} transition-transform active:scale-95`}
              >
                {isDarkMode ? <Sun className="h-4 w-4 text-[#CFD186]" /> : <Moon className="h-4 w-4 text-[#49111C]" />}
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
              
              {/* COUNTDOWNS */}
              {countdowns.length > 0 && (
                <div>
                  <div className={`text-[11px] font-bold uppercase tracking-wider ${textSub} mb-3 px-1`}>Wichtige Countdowns</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {countdowns.map((cd, idx) => {
                      const days = calculateDaysLeft(cd.date);
                      return (
                        <motion.div 
                          whileHover={{ y: -2 }}
                          key={idx} 
                          className={`${bgCard} rounded-2xl p-4 flex items-center justify-between transition-all hover:border-[#5B8C5A]/60`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl p-2.5 rounded-xl bg-[#5B8C5A]/15 border border-[#5B8C5A]/30">{cd.icon}</span>
                            <div>
                              <h4 className={`text-xs font-bold ${textTitle}`}>{cd.title}</h4>
                              <p className={`text-[11px] ${textSub} font-medium mt-0.5`}>{cd.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-lg font-extrabold font-mono ${accentGreen}`}>
                              {days >= 0 ? `${days} Tage` : "Vorbei"}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BENTO GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Wetter */}
                <div className={`${bgCard} rounded-2xl p-6 flex flex-col justify-between min-h-[170px]`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${textSub}`}>{weatherLabel}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeGreen}`}>Live</span>
                  </div>
                  <div>
                    <div className={`text-4xl font-extrabold tracking-tight font-mono ${textTitle}`}>{weather}</div>
                    <p className={`text-xs ${accentBlue} font-semibold mt-1`}>Außentemperatur</p>
                  </div>
                </div>

                {/* 2. Tasks & Einkauf Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`${bgCard} rounded-2xl p-5 flex flex-col justify-center items-center text-center cursor-pointer hover:border-[#49111C]/40 transition-all`} onClick={() => setActiveTab("putzplan")}>
                    <div className="text-3xl font-black font-mono text-[#49111C] dark:text-[#E27B88]">{aufgaben.length}</div>
                    <div className={`text-[10px] font-bold ${textSub} uppercase tracking-wider mt-1`}>Putz-Tasks</div>
                  </div>
                  <div className={`${bgCard} rounded-2xl p-5 flex flex-col justify-center items-center text-center cursor-pointer hover:border-[#5B8C5A]/40 transition-all`} onClick={() => setActiveTab("einkauf")}>
                    <div className={`text-3xl font-black font-mono ${accentGreen}`}>{offeneEinkaeufe.length}</div>
                    <div className={`text-[10px] font-bold ${textSub} uppercase tracking-wider mt-1`}>Auf der Liste</div>
                  </div>
                </div>

                {/* 3. Abfahrten MVG */}
                <div className={`${bgCard} rounded-2xl p-6 flex flex-col justify-between`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className={`text-[11px] font-bold uppercase tracking-wider ${textSub}`}>Abfahrten OEZ</h3>
                    <span className={`text-[10px] ${accentBlue} font-mono font-bold`}>Live MVG</span>
                  </div>
                  <div className="space-y-2.5">
                    {departures.slice(0, 3).map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${badgeBlue}`}>{d.line}</span>
                          <span className={`truncate max-w-[130px] font-semibold ${textTitle}`}>{d.destination}</span>
                        </div>
                        <span className={`font-mono font-bold ${textSub}`}>{d.time}</span>
                      </div>
                    ))}
                    {departures.length === 0 && <span className={`text-xs ${textSub}`}>Keine Live-Abfahrten</span>}
                  </div>
                </div>

                {/* 4. Termine Box */}
                <div className={`md:col-span-2 lg:col-span-3 ${bgCard} rounded-2xl p-6`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className={`text-[11px] font-bold uppercase tracking-wider ${textSub}`}>Anstehende Termine</h3>
                    <span className={`text-[10px] ${textSub}`}>iCloud Kalender</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {termine.slice(0, 3).map((t, i) => (
                      <div key={i} className={`p-4 rounded-xl border ${bgItem} flex flex-col justify-between gap-2`}>
                        <span className={`text-xs font-bold ${textTitle} truncate`}>{t.title}</span>
                        <span className={`text-[10px] font-mono font-bold w-fit px-2.5 py-1 rounded-md ${badgeBlue}`}>{t.date}</span>
                      </div>
                    ))}
                    {termine.length === 0 && <p className={`text-xs ${textSub} py-2`}>Keine anstehenden Termine.</p>}
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
                  <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Einkaufsliste</h2>
                  <p className={`text-xs ${textSub}`}>Sortiert nach Supermarkt-Gängen</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-mono font-bold ${badgeBlue}`}>
                  {offeneEinkaeufe.length} offen
                </span>
              </div>

              {/* Favoriten Chips */}
              <div className={`${bgCard} rounded-2xl p-5 space-y-2`}>
                <div className={`text-[11px] font-bold ${textSub}`}>Schnellwahl Favoriten:</div>
                <div className="flex flex-wrap gap-2">
                  {SCHNELLWAHL_FAVORITEN.map((fav, idx) => (
                    <button key={idx} onClick={() => addEinkauf(fav)} className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${bgItem} ${textTitle} hover:border-[#005377]`}>
                      + {fav}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eingabefeld */}
              <div className={`${bgCard} rounded-2xl p-6`}>
                <div className={`flex flex-col md:flex-row gap-3 mb-6 pb-6 border-b ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"}`}>
                  <input 
                    type="text" 
                    placeholder="Neuer Artikel (z.B. Hafermilch)..." 
                    value={neuerArtikel} 
                    onChange={(e) => setNeuerArtikel(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && addEinkauf()} 
                    className={`flex-1 ${bgInput} border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all font-medium`} 
                  />
                  <button onClick={() => addEinkauf()} className={`px-6 py-2.5 ${buttonPrimary} text-xs font-bold rounded-xl transition-all`}>
                    Hinzufügen
                  </button>
                </div>

                {/* Gruppierte Warengruppen */}
                <div className="space-y-6">
                  {Object.keys(einkaufNachKategorien).length === 0 ? (
                    <p className={`text-xs ${textSub} text-center py-6 font-medium`}>Alles erledigt! Keine offenen Artikel.</p>
                  ) : (
                    Object.entries(einkaufNachKategorien).map(([kategorie, items]) => (
                      <div key={kategorie} className="space-y-2">
                        <div className={`text-[10px] font-bold ${textSub} uppercase tracking-wider px-1 flex items-center justify-between`}>
                          <span>{kategorie}</span>
                          <span className="font-bold">{items.length}</span>
                        </div>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.rowIndex} className={`flex items-center justify-between p-3.5 rounded-xl border ${bgItem}`}>
                              <span className={`text-sm font-semibold ${textTitle}`}>{item.artikel}</span>
                              <div className="flex items-center gap-2">
                                <button onClick={() => markEinkaufErledigt(item, "Erledigt")} className={`h-7 px-3 text-[11px] font-bold rounded-lg ${badgeGreen} hover:opacity-80 transition-colors flex items-center gap-1`}>
                                  <Check className="h-3.5 w-3.5" /> <span>Erledigt</span>
                                </button>
                                <button onClick={() => deleteEinkauf(item)} className="p-1.5 text-slate-400 hover:text-[#49111C] transition-colors">
                                  <Trash2 className="h-4 w-4" />
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
                  <div className={`mt-6 pt-4 border-t ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"}`}>
                    <button onClick={() => setShowErledigt(!showErledigt)} className={`flex items-center justify-between w-full text-xs font-bold ${textSub}`}>
                      <span>Bereits gekauft ({erledigteEinkaeufe.length})</span>
                      {showErledigt ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {showErledigt && (
                      <div className="space-y-1 mt-3 opacity-60">
                        {erledigteEinkaeufe.map((item) => (
                          <div key={item.rowIndex} className="flex items-center justify-between p-2 text-xs line-through text-slate-500">
                            <span>{item.artikel}</span>
                            <button onClick={() => markEinkaufErledigt(item, "Offen")} className={`text-[10px] font-bold ${accentBlue} hover:underline`}>Wiederherstellen</button>
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
                <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Putzplan & Aufgaben</h2>
                <p className={`text-xs ${textSub}`}>Zuletzt erledigte Aufgaben & Fälligkeiten</p>
              </div>
              <div className={`${bgCard} rounded-2xl p-6`}>
                <div className="space-y-3">
                  {aufgaben.map((a, idx) => (
                    <div key={idx} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${bgItem} gap-3 sm:gap-0`}>
                      <div>
                        <div className={`font-bold text-sm ${textTitle} mb-1`}>{a.aufgabe}</div>
                        <div className={`flex gap-3 text-[11px] ${textSub}`}>
                          <span className="flex items-center gap-1 font-medium"><Clock className="h-3.5 w-3.5" /> Intervall: {a.intervall} Tage</span>
                          <span className="font-medium">Letztes Mal: <span className="font-mono font-bold text-[#005377] dark:text-[#82CBEE]">{a.letztesDatum}</span></span>
                        </div>
                      </div>
                      <button onClick={() => markAufgabeErledigt(a)} className={`w-full sm:w-auto h-8 px-4 text-xs font-bold rounded-lg border ${isDarkMode ? "bg-white/5 text-white hover:bg-white/10 border-white/[0.08]" : "bg-[#FAF8F5] text-[#2D2A26] hover:bg-slate-100 border-[#E8E2D9]"} transition-colors`}>
                        Als {activeUser} erledigt
                      </button>
                    </div>
                  ))}
                  {aufgaben.length === 0 && <p className={`text-xs ${textSub} text-center py-6`}>Keine Aufgaben hinterlegt.</p>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VORRAT */}
          {activeTab === "vorrat" && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Vorratskammer & KI Scanner</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-1 ${bgCard} rounded-2xl p-6 flex flex-col h-[280px]`}>
                  <h3 className={`text-[11px] font-bold uppercase tracking-wider ${textSub} mb-3 flex items-center gap-2`}><Camera className={`h-4 w-4 ${accentBlue}`} /> Scanner</h3>
                  <div className={`flex-1 border-2 border-dashed ${isDarkMode ? "border-white/[0.08] bg-black/20" : "border-[#E8E2D9] bg-[#FAF8F5]"} rounded-xl flex flex-col items-center justify-center p-4 text-center`}>
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-2"><Loader2 className={`h-6 w-6 ${accentBlue} animate-spin`} /><span className={`text-[11px] ${textSub}`}>Gemini analysiert...</span></div>
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                        <p className={`text-[11px] ${textSub} mb-3 font-medium`}>Foto machen $\rightarrow$ KI erfasst MHD</p>
                        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className={`text-xs ${buttonPrimary} px-4 py-2 rounded-xl transition-all font-bold`}>
                          Kamera starten
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className={`lg:col-span-2 ${bgCard} rounded-2xl p-6 flex flex-col min-h-[280px]`}>
                  <h3 className={`text-[11px] font-bold uppercase tracking-wider ${textSub} mb-3`}>Aktueller Bestand</h3>
                  <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"}`}>
                          <th className={`pb-2 text-[10px] font-bold ${textSub} uppercase tracking-wider`}>Artikel</th>
                          <th className={`pb-2 text-[10px] font-bold ${textSub} uppercase tracking-wider text-right`}>MHD</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? "divide-white/[0.04]" : "divide-[#E8E2D9]/60"}`}>
                        {vorrat.map((v, idx) => (
                          <tr key={idx}>
                            <td className={`py-3 text-xs font-bold ${textTitle}`}>{v.artikel}</td>
                            <td className={`py-3 text-xs ${textSub} text-right font-mono font-bold`}>{v.ablaufdatum}</td>
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
                <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Pinnwand</h2>
                <p className={`text-xs ${textSub}`}>Digitale Notizen & Infos</p>
              </div>

              {/* Kategorien */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {noteCategories.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setActiveNoteCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeNoteCategory === cat ? `${badgeBlue} shadow-sm` : `${bgCard} ${textSub}`}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Notizen Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map((note) => (
                  <div key={note.rowIndex} className={`${bgCard} rounded-2xl p-5 border relative overflow-hidden`}>
                    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${badgeGreen}`}>
                      {note.category}
                    </span>
                    <h3 className={`text-sm font-bold mt-2.5 mb-1 ${textTitle}`}>{note.title}</h3>
                    <p className={`text-xs leading-relaxed ${textSub} whitespace-pre-line font-medium`}>
                      {note.content}
                    </p>
                  </div>
                ))}
                {filteredNotes.length === 0 && <p className={`text-xs ${textSub} col-span-full py-8 text-center`}>Keine Notizen vorhanden.</p>}
              </div>
            </div>
          )}

          {/* TAB 6: KALENDER */}
          {activeTab === "kalender" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className={`text-base font-bold tracking-tight ${textTitle} flex items-center gap-2`}>
                  <Hourglass className={`h-4 w-4 ${accentBlue}`} /> Countdowns anlegen
                </h2>
                <div className={`${bgCard} rounded-2xl p-5`}>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input 
                      type="text" 
                      placeholder="Event Name (z.B. Urlaub)..." 
                      value={newCdTitle} 
                      onChange={e => setNewCdTitle(e.target.value)} 
                      className={`sm:col-span-2 ${bgInput} border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none`}
                    />
                    <input 
                      type="date" 
                      value={newCdDate} 
                      onChange={e => setNewCdDate(e.target.value)} 
                      className={`${bgInput} border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none`}
                    />
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Emoji" 
                        value={newCdIcon} 
                        onChange={e => setNewCdIcon(e.target.value)} 
                        className={`w-14 text-center ${bgInput} border rounded-xl px-2 py-2 text-xs font-medium focus:outline-none`}
                      />
                      <button onClick={addCountdown} className={`flex-1 ${buttonPrimary} text-xs font-bold rounded-xl transition-all`}>
                        Speichern
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className={`text-base font-bold tracking-tight ${textTitle}`}>iCloud Kalender Termine</h2>
                <div className={`${bgCard} rounded-2xl p-5`}>
                  <div className="space-y-2">
                    {termine.map((t, idx) => (
                      <div key={idx} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border ${bgItem} gap-2 sm:gap-0`}>
                        <span className={`text-xs font-bold ${textTitle}`}>{t.title}</span>
                        <span className={`text-[10px] font-mono font-bold ${badgeBlue} px-2.5 py-1 rounded-md w-fit`}>{t.date}</span>
                      </div>
                    ))}
                    {termine.length === 0 && <p className={`text-xs ${textSub} text-center py-6`}>Keine Termine vorhanden.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${isDarkMode ? "bg-[#100A0B]/90 border-white/[0.08]" : "bg-[#FAF8F5]/90 border-[#E8E2D9]"} backdrop-blur-xl border-t px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] flex justify-around items-center`}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center w-12 h-11 gap-1 rounded-lg transition-all ${isActive ? `${accentBlue} font-bold` : textSub}`}>
              <tab.icon className="h-4 w-4" />
              <span className="text-[9px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}