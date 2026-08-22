"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  Home, ShoppingCart, Package, Calendar as CalendarIcon, Clock, Plus, Check, ClipboardList, Camera, UploadCloud, Loader2, Bell, Settings, Sun, Moon, ChevronDown, ChevronUp, Sparkles, Hourglass, UserCheck
} from "lucide-react";

interface Departure { line: string; destination: string; time: string; }
interface EinkaufItem { rowIndex: number; artikel: string; status: string; kategorie?: string; }
interface PutzItem { rowIndex: number; aufgabe: string; letztesDatum: string; intervall: string; }
interface VorratItem { rowIndex: number; artikel: string; ablaufdatum: string; anbruch: string; }
interface CountdownItem { rowIndex: number; title: string; date: string; icon: string; }

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
  const [weatherLabel, setWeatherLabel] = useState<string>("Wetter sucht...");
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

    const loadIPLocation = () => {
      fetch("https://ipwho.is/")
        .then(res => res.json())
        .then(data => {
          if (data.success && data.latitude && data.longitude) fetchWeather(data.latitude, data.longitude, data.city || "Lokales Wetter");
          else fetchWeather(48.1764, 11.5311, "Wetter OEZ (München)");
        })
        .catch(() => fetchWeather(48.1764, 11.5311, "Wetter OEZ (München)"));
    };

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchWeather(pos.coords.latitude, pos.coords.longitude, "GPS Standort"),
        () => loadIPLocation(),
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 600000 }
      );
    } else { loadIPLocation(); }
  }, []);

  const addEinkauf = async (artikelName?: string) => {
    const text = (artikelName || neuerArtikel).trim();
    if (!text) return;
    const newItem: EinkaufItem = { rowIndex: einkauf.length + 2, artikel: text, status: "Offen", kategorie: ermittleKategorie(text) };
    setEinkauf([...einkauf, newItem]);
    if (!artikelName) setNeuerArtikel("");
    
    await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Einkauf", values: [newItem.artikel, newItem.status] }) });
    await fetch("https://ntfy.sh/HaushaltLenaJonas", {
      method: "POST",
      body: `🛒 "${newItem.artikel}" wurde von ${activeUser} hinzugefügt.`,
      headers: { "Title": "Haushalt OS", "Tags": "shopping_cart", "Priority": "default" }
    });
    fetchData(); 
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

  const markEinkaufErledigt = async (item: EinkaufItem, status: "Erledigt" | "Offen") => {
    setEinkauf(einkauf.map(e => e.rowIndex === item.rowIndex ? { ...e, status } : e));
    await fetch("/api/data", { method: "PUT", body: JSON.stringify({ sheetName: "Einkauf", rowIndex: item.rowIndex, values: [item.artikel, status] }) });
  };

  const markAufgabeErledigt = async (item: PutzItem) => {
    const today = new Date().toISOString().split("T")[0];
    setAufgaben(aufgaben.map(a => a.rowIndex === item.rowIndex ? { ...a, letztesDatum: today } : a));
    // Speichert den aktuell aktiven User (Jonas oder Lena) in Spalte D
    await fetch("/api/data", { method: "PUT", body: JSON.stringify({ sheetName: "Haushalt", rowIndex: item.rowIndex, values: [item.aufgabe, today, item.intervall, activeUser] }) });
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
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const offeneEinkaeufe = einkauf.filter(e => e.status !== "Erledigt");
  const erledigteEinkaeufe = einkauf.filter(e => e.status === "Erledigt");

  const einkaufNachKategorien = KATEGORIEN.reduce((acc, kat) => {
    const items = offeneEinkaeufe.filter(i => (i.kategorie || ermittleKategorie(i.artikel)) === kat);
    if (items.length > 0) acc[kat] = items;
    return acc;
  }, {} as Record<string, EinkaufItem[]>);

  const TABS = [
    { id: "home", icon: Home, label: "Home" },
    { id: "einkauf", icon: ShoppingCart, label: "Einkauf" },
    { id: "putzplan", icon: ClipboardList, label: "Putzplan" },
    { id: "vorrat", icon: Package, label: "Vorrat" },
    { id: "kalender", icon: CalendarIcon, label: "Termine" }
  ];

  const bgMain = isDarkMode ? "bg-[#05070A] text-slate-300" : "bg-slate-50 text-slate-800";
  const bgSidebar = isDarkMode ? "bg-[#05070A] border-[#1e293b]" : "bg-white border-slate-200";
  const bgCard = isDarkMode ? "bg-[#0C1017] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm";
  const bgInput = isDarkMode ? "bg-[#05070A] border-[#1e293b] text-slate-200" : "bg-slate-50 border-slate-300 text-slate-900";
  const textTitle = isDarkMode ? "text-slate-100" : "text-slate-900";
  const textSub = isDarkMode ? "text-slate-400" : "text-slate-500";
  const bgItem = isDarkMode ? "bg-[#05070A] border-[#1e293b]" : "bg-slate-50 border-slate-200";

  return (
    <div className={`flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden ${bgMain} font-sans transition-colors duration-300`}>
      
      {/* SIDEBAR */}
      <aside className={`hidden md:flex w-64 ${bgSidebar} border-r flex-col justify-between p-4 h-full transition-colors duration-300`}>
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <span className={`font-semibold text-sm tracking-wide ${textTitle}`}>Haushalt OS</span>
          </div>

          <nav className="space-y-1">
            <div className={`px-3 text-[10px] font-semibold ${textSub} uppercase tracking-wider mb-2 mt-4`}>Dashboard</div>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const activeClass = isDarkMode 
                ? "bg-[#1A2332] text-blue-400 border border-[#2A3649] shadow-[0_0_10px_rgba(59,130,246,0.05)]" 
                : "bg-blue-50 text-blue-600 border border-blue-200 shadow-sm";
              const inactiveClass = isDarkMode 
                ? "text-slate-400 hover:text-slate-200 hover:bg-[#0C1017]" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100";

              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${isActive ? activeClass : inactiveClass}`}>
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* PROFIL UMSCHALTER */}
        <div className={`pt-4 border-t ${isDarkMode ? "border-[#1e293b]" : "border-slate-200"} flex items-center justify-between px-2`}>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => switchUser(activeUser === "Jonas" ? "Lena" : "Jonas")}
              className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${isDarkMode ? "bg-[#1A2332] text-blue-400 border border-[#2A3649]" : "bg-blue-50 text-blue-600 border border-blue-200"}`}
              title="Profil wechseln"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>{activeUser}</span>
            </button>
          </div>
          <button className={`${textSub} hover:text-blue-500`}><Settings className="h-4 w-4" /></button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative">
        
        {/* HEADER mit Safe Area */}
        <header className={`pt-safe sticky top-0 z-30 ${isDarkMode ? "border-[#1e293b] bg-[#05070A]/85" : "border-slate-200 bg-white/85"} backdrop-blur-xl border-b transition-colors duration-300`}>
          <div className="h-14 px-4 md:px-8 flex items-center justify-between">
            <div className={`flex items-center gap-2 text-xs ${textSub} font-medium tracking-wide`}>
              <span>Dashboard</span>
              <span>&gt;</span>
              <span className={`capitalize ${textTitle}`}>{activeTab}</span>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              {/* Profil Switcher auf Mobile */}
              <button 
                onClick={() => switchUser(activeUser === "Jonas" ? "Lena" : "Jonas")}
                className={`md:hidden px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 border ${isDarkMode ? "bg-[#1A2332] text-blue-400 border-[#2A3649]" : "bg-blue-50 text-blue-600 border-blue-200"}`}
              >
                {activeUser}
              </button>

              <div className={`hidden sm:flex items-center gap-2 ${isDarkMode ? "bg-[#0C1017] border-[#1e293b] text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"} border rounded-md px-3 py-1.5 text-xs`}>
                <CalendarIcon className="h-3 w-3 text-slate-400" /> {todayStr}
              </div>
              
              <button onClick={toggleTheme} className={`h-8 w-8 flex items-center justify-center rounded-md ${isDarkMode ? "bg-[#0C1017] border-[#1e293b] text-slate-400 hover:text-slate-200" : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"} border transition-colors shadow-sm`}>
                {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
              </button>

              <button className={`h-8 w-8 flex items-center justify-center rounded-md ${isDarkMode ? "bg-[#0C1017] border-[#1e293b] text-slate-400 hover:text-slate-200" : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"} border transition-colors shadow-sm`}>
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 pb-24 md:pb-12 max-w-[1400px] mx-auto w-full space-y-6 md:space-y-8">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "home" && (
            <>
              <div><h2 className={`text-lg font-semibold ${textTitle}`}>Hallo {activeUser}! 👋</h2></div>
              
              {/* COUNTDOWN WIDGETS */}
              {countdowns.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {countdowns.map((cd, idx) => {
                    const days = calculateDaysLeft(cd.date);
                    return (
                      <div key={idx} className={`${bgCard} border rounded-xl p-4 flex items-center justify-between relative overflow-hidden group hover:border-blue-500/40 transition-all`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">{cd.icon}</span>
                          <div>
                            <h4 className={`text-sm font-semibold ${textTitle}`}>{cd.title}</h4>
                            <p className="text-[11px] text-slate-500">{new Date(cd.date).toLocaleDateString("de-DE", { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xl font-bold font-mono ${days <= 3 ? "text-amber-500" : "text-blue-500"}`}>
                            {days >= 0 ? `${days}d` : "Vorbei"}
                          </span>
                          <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                            {days === 0 ? "Heute!" : days > 0 ? "verbleibend" : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STATISTIK KARTEN */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`${bgCard} border rounded-xl p-5 transition-colors`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-xs font-medium ${textSub}`}>{weatherLabel}</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Live</span>
                  </div>
                  <div className={`text-2xl md:text-3xl font-bold ${textTitle} tracking-tight`}>{weather}</div>
                  <div className="text-[10px] text-slate-500 mt-2">Aktuelle Temperatur</div>
                </div>

                <div className={`${bgCard} border rounded-xl p-5 transition-colors`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-xs font-medium ${textSub}`}>To-Dos</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">Aktiv</span>
                  </div>
                  <div className={`text-2xl md:text-3xl font-bold ${textTitle} tracking-tight`}>{aufgaben.length}</div>
                  <div className="text-[10px] text-slate-500 mt-2">Offene Hausarbeiten</div>
                </div>

                <div className={`${bgCard} border rounded-xl p-5 transition-colors`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-xs font-medium ${textSub}`}>Einkaufsliste</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Sync</span>
                  </div>
                  <div className={`text-2xl md:text-3xl font-bold ${textTitle} tracking-tight`}>{offeneEinkaeufe.length}</div>
                  <div className="text-[10px] text-slate-500 mt-2">Artikel fehlen</div>
                </div>

                <div className={`${isDarkMode ? "bg-gradient-to-br from-[#121B2A] to-[#0C1017] border-[#2A3649]" : "bg-gradient-to-br from-blue-50 to-white border-blue-200"} border rounded-xl p-5 relative overflow-hidden shadow-sm`}>
                  <div className="absolute top-0 right-0 p-4 opacity-10"><CalendarIcon className="h-16 w-16 text-blue-500" /></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <span className={`text-xs font-medium ${isDarkMode ? "text-blue-300" : "text-blue-600"}`}>Termine & Events</span>
                  </div>
                  <div className={`text-2xl md:text-3xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"} tracking-tight relative z-10`}>{termine.length}</div>
                  <div className="text-[10px] text-blue-500 mt-2 relative z-10">iCloud synchronisiert</div>
                  <button onClick={() => setActiveTab("kalender")} className={`mt-4 text-[10px] ${isDarkMode ? "bg-white text-black hover:bg-slate-200" : "bg-blue-600 text-white hover:bg-blue-700"} px-3 py-1.5 rounded font-medium transition-colors relative z-10`}>
                    Details & Countdowns &gt;
                  </button>
                </div>
              </div>

              {/* MVG & KALENDER LISTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
                <div className={`${bgCard} border rounded-xl flex flex-col h-[300px]`}>
                  <div className={`p-5 border-b ${isDarkMode ? "border-[#1e293b]" : "border-slate-200"} flex justify-between items-center`}>
                    <h3 className={`text-xs font-semibold ${textTitle}`}>Abfahrten OEZ</h3>
                    <span className="text-[10px] text-slate-500">Live MVG</span>
                  </div>
                  <div className="p-5 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                      {departures.map((d, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">{d.line}</span>
                            <span className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{d.destination}</span>
                          </div>
                          <span className="text-xs font-mono text-slate-500">{d.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`${bgCard} border rounded-xl flex flex-col h-[300px]`}>
                  <div className={`p-5 border-b ${isDarkMode ? "border-[#1e293b]" : "border-slate-200"} flex justify-between items-center`}>
                    <h3 className={`text-xs font-semibold ${textTitle}`}>Nächste Termine</h3>
                    <span className="text-[10px] text-slate-500">iCloud</span>
                  </div>
                  <div className="p-5 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                      {termine.slice(0,5).map((t, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-700"} truncate pr-4`}>{t.title}</span>
                          <span className="text-[10px] font-mono text-blue-500 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 whitespace-nowrap">{t.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: EINKAUFSLISTE */}
          {activeTab === "einkauf" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-lg font-semibold ${textTitle}`}>Einkaufsliste</h2>
                  <p className={`text-xs ${textSub}`}>Sortiert nach Supermarkt-Gängen</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 font-medium">
                  {offeneEinkaeufe.length} offen
                </span>
              </div>

              <div className={`${bgCard} border rounded-xl p-4 space-y-2`}>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                  <Sparkles className="h-3 w-3 text-amber-400" /> Schnellwahl Favoriten:
                </div>
                <div className="flex flex-wrap gap-2">
                  {SCHNELLWAHL_FAVORITEN.map((fav, idx) => (
                    <button key={idx} onClick={() => addEinkauf(fav)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${isDarkMode ? "bg-[#05070A] border-[#1e293b] hover:border-blue-500/50 text-slate-300" : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800"}`}>
                      + {fav}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${bgCard} border rounded-xl p-5 md:p-6`}>
                <div className={`flex flex-col md:flex-row gap-3 mb-6 pb-6 border-b ${isDarkMode ? "border-[#1e293b]" : "border-slate-200"}`}>
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Plus className="h-4 w-4 text-slate-500" />
                    </div>
                    <input type="text" placeholder="Neuer Artikel (z.B. Hafermilch)..." value={neuerArtikel} onChange={(e) => setNeuerArtikel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addEinkauf()} className={`w-full ${bgInput} border rounded-md pl-10 pr-4 py-2.5 text-[16px] md:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all`} />
                  </div>
                  <button onClick={() => addEinkauf()} className={`w-full md:w-auto h-11 md:h-auto px-6 ${isDarkMode ? "bg-slate-100 text-slate-900 hover:bg-white" : "bg-blue-600 text-white hover:bg-blue-700"} text-sm font-semibold rounded-md transition-colors`}>
                    Hinzufügen
                  </button>
                </div>

                <div className="space-y-6">
                  {Object.keys(einkaufNachKategorien).length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">Alles erledigt! Keine offenen Artikel.</p>
                  ) : (
                    Object.entries(einkaufNachKategorien).map(([kategorie, items]) => (
                      <div key={kategorie} className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
                          <span>{kategorie}</span>
                          <span className="text-[10px] font-normal text-slate-500">{items.length}</span>
                        </div>
                        <div className="space-y-1">
                          {items.map((item) => (
                            <div key={item.rowIndex} className={`flex items-center justify-between p-3 rounded-md border border-transparent ${isDarkMode ? "hover:bg-[#05070A] hover:border-[#1e293b]" : "hover:bg-slate-100 hover:border-slate-200"} transition-colors`}>
                              <span className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{item.artikel}</span>
                              <button onClick={() => markEinkaufErledigt(item, "Erledigt")} className="h-7 px-3 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                                <Check className="h-3 w-3" /> <span>Erledigt</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {erledigteEinkaeufe.length > 0 && (
                  <div className={`mt-8 pt-6 border-t ${isDarkMode ? "border-[#1e293b]" : "border-slate-200"}`}>
                    <button onClick={() => setShowErledigt(!showErledigt)} className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 py-1">
                      <span>Bereits gekauft ({erledigteEinkaeufe.length})</span>
                      {showErledigt ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {showErledigt && (
                      <div className="space-y-1 mt-3 opacity-60">
                        {erledigteEinkaeufe.map((item) => (
                          <div key={item.rowIndex} className="flex items-center justify-between p-2 text-xs line-through text-slate-500">
                            <span>{item.artikel}</span>
                            <button onClick={() => markEinkaufErledigt(item, "Offen")} className="text-[10px] text-blue-400 hover:underline">Wiederherstellen</button>
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
              <div><h2 className={`text-lg font-semibold ${textTitle}`}>Putzplan</h2></div>
              <div className={`${bgCard} border rounded-xl p-5 md:p-6`}>
                <div className="space-y-3">
                  {aufgaben.map((a, idx) => (
                    <div key={idx} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-md border ${bgItem} gap-4 sm:gap-0`}>
                      <div>
                        <div className={`font-medium text-sm ${textTitle} mb-1`}>{a.aufgabe}</div>
                        <div className="flex gap-3 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Intervall: {a.intervall} Tage</span>
                          <span>Letztes Mal: <span className={isDarkMode ? "text-slate-400" : "text-slate-700"}>{a.letztesDatum}</span></span>
                        </div>
                      </div>
                      <button onClick={() => markAufgabeErledigt(a)} className={`w-full sm:w-auto h-8 px-4 text-xs font-medium rounded ${isDarkMode ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-sm"} border transition-colors`}>
                        Als {activeUser} erledigt
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VORRAT */}
          {activeTab === "vorrat" && (
            <div className="space-y-6">
              <div><h2 className={`text-lg font-semibold ${textTitle}`}>Vorratskammer & KI</h2></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className={`lg:col-span-1 ${bgCard} border rounded-xl p-6 flex flex-col h-[300px]`}>
                  <h3 className={`text-xs font-semibold ${textTitle} mb-4 flex items-center gap-2`}><Camera className="h-4 w-4 text-blue-500" /> Scanner</h3>
                  <div className={`flex-1 border-2 border-dashed ${isDarkMode ? "border-[#1e293b] bg-[#05070A]" : "border-slate-200 bg-slate-50"} rounded-lg flex flex-col items-center justify-center p-6 text-center`}>
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-3"><Loader2 className="h-6 w-6 text-blue-500 animate-spin" /><span className="text-[10px] text-slate-500">Gemini analysiert...</span></div>
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 text-slate-400 mb-3" />
                        <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">Fotografiere ein Produkt, die KI trägt das MHD automatisch ein.</p>
                        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className="text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-md hover:bg-blue-500/20 transition-colors font-medium">
                          Kamera starten
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className={`lg:col-span-2 ${bgCard} border rounded-xl flex flex-col min-h-[300px]`}>
                  <div className={`p-5 border-b ${isDarkMode ? "border-[#1e293b]" : "border-slate-200"}`}>
                    <h3 className={`text-xs font-semibold ${textTitle}`}>Aktueller Bestand</h3>
                  </div>
                  <div className="p-5 flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? "border-[#1e293b]" : "border-slate-200"}`}>
                          <th className="pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Artikel</th>
                          <th className="pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">MHD</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? "divide-[#1e293b]/50" : "divide-slate-100"}`}>
                        {vorrat.map((v, idx) => (
                          <tr key={idx} className={isDarkMode ? "hover:bg-[#05070A]/50" : "hover:bg-slate-50"}>
                            <td className={`py-3 text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{v.artikel}</td>
                            <td className="py-3 text-[11px] text-slate-500 text-right font-mono">{v.ablaufdatum}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: KALENDER & COUNTDOWNS */}
          {activeTab === "kalender" && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className={`text-lg font-semibold ${textTitle} flex items-center gap-2`}>
                  <Hourglass className="h-5 w-5 text-blue-500" /> Countdowns anlegen
                </h2>
                <div className={`${bgCard} border rounded-xl p-5 md:p-6`}>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input 
                      type="text" 
                      placeholder="Event Name (z.B. Urlaub Spanien)..." 
                      value={newCdTitle} 
                      onChange={e => setNewCdTitle(e.target.value)} 
                      className={`sm:col-span-2 ${bgInput} border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500`}
                    />
                    <input 
                      type="date" 
                      value={newCdDate} 
                      onChange={e => setNewCdDate(e.target.value)} 
                      className={`${bgInput} border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500`}
                    />
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Emoji (✈️)" 
                        value={newCdIcon} 
                        onChange={e => setNewCdIcon(e.target.value)} 
                        className={`w-16 text-center ${bgInput} border rounded-md px-2 py-2 text-sm focus:outline-none focus:border-blue-500`}
                      />
                      <button 
                        onClick={addCountdown} 
                        className={`flex-1 ${isDarkMode ? "bg-slate-100 text-slate-900 hover:bg-white" : "bg-blue-600 text-white hover:bg-blue-700"} text-xs font-semibold rounded-md transition-colors`}
                      >
                        Erstellen
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
                    {countdowns.map((cd, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${bgItem} flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cd.icon}</span>
                          <div>
                            <span className={`text-xs font-medium ${textTitle}`}>{cd.title}</span>
                            <span className="block text-[10px] text-slate-500">{cd.date}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-blue-500">{calculateDaysLeft(cd.date)} Tage</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className={`text-lg font-semibold ${textTitle}`}>iCloud Kalender Termine</h2>
                <div className={`${bgCard} border rounded-xl p-5 md:p-6`}>
                  <div className="space-y-2">
                    {termine.length === 0 ? <p className="text-sm text-slate-500 text-center py-8">Keine Termine gefunden.</p> : termine.map((t, idx) => (
                      <div key={idx} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-md border ${bgItem} mb-2 gap-2 md:gap-0`}>
                        <span className={`text-sm font-medium ${textTitle}`}>{t.title}</span>
                        <span className="text-xs font-mono text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20 w-fit">{t.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 ${isDarkMode ? "bg-[#05070A]/90 border-[#1e293b]" : "bg-white/90 border-slate-200"} backdrop-blur-xl border-t px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] flex justify-around items-center transition-colors duration-300`}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const activeBtn = isDarkMode ? "text-slate-100 bg-[#1A2332]" : "text-blue-600 bg-blue-50";
          const inactiveBtn = isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-700";

          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center w-14 h-11 gap-1 rounded-lg transition-all ${isActive ? activeBtn : inactiveBtn}`}>
              <tab.icon className={`h-4 w-4 ${isActive ? "text-blue-500" : ""}`} />
              <span className="text-[9px] font-medium tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}