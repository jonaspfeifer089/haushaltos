"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, ShoppingCart, Package, Calendar as CalendarIcon, Clock, Plus, Check, ClipboardList, Camera, UploadCloud, Loader2, Bell, Settings, Sun, Moon, ChevronDown, ChevronUp, Sparkles, Hourglass, UserCheck, Trash2, StickyNote, CloudSun, Pin, Sparkle, ArrowRight, ChevronLeft, ChevronRight, ListTodo,
  Dumbbell, Activity, Flame
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- INTERFACES ---
interface Departure { line: string; destination: string; time: string; }
interface EinkaufItem { rowIndex: number; artikel: string; status: string; kategorie?: string; }
interface PutzItem { rowIndex: number; aufgabe: string; letztesDatum: string; intervall: string; }
interface VorratItem { rowIndex: number; artikel: string; ablaufdatum: string; anbruch: string; }
interface CountdownItem { rowIndex: number; title: string; date: string; icon: string; }
interface NoteItem { rowIndex: number; title: string; content: string; category: string; color: string; }
interface CalendarEvent { title: string; date: string; type?: "termin" | "putz"; }
interface TodoItem { rowIndex: number; aufgabe: string; kategorie: string; status: string; zustaendig: string; }
interface GymItem { rowIndex: number; datum: string; uebung: string; gewicht: number; reps: number; setNum: number; user: string; }

// --- KONSTANTEN & PHYSIK ---
const EINKAUF_KATEGORIEN = ["Obst & Gemüse", "Kühlregal", "Vorrat & Teigwaren", "Getränke", "Drogerie & Haushalt", "Sonstiges"] as const;
const TODO_KATEGORIEN = ["Haushalt & Reparatur", "Bürokratie & Verträge", "Besorgungen", "Freizeit & Projekte", "Sonstiges"] as const;

const springConfig = { type: "spring" as const, stiffness: 400, damping: 25, mass: 0.8 };
const tapGesture = { scale: 0.96, transition: { type: "spring" as const, stiffness: 500, damping: 30 } };

function ermittleKategorie(artikel: string): string {
  const a = artikel.toLowerCase();
  if (/apfel|äpfel|banane|beere|salat|tomate|gurke|zitrone|kartoffel|zwiebel|avocado|paprika|obst|gemüse|birne/.test(a)) return "Obst & Gemüse";
  if (/milch|käse|joghurt|butter|quark|tofu|sahne|frischkäse|fleisch|wurst|ei|eier/.test(a)) return "Kühlregal";
  if (/brot|toast|pasta|nudel|reis|mehl|zucker|öl|hafer|müsli|konserve|bohnen|kichererbsen/.test(a)) return "Vorrat & Teigwaren";
  if (/wasser|saft|bier|wein|cola|limo|sprudel|tee|kaffee/.test(a)) return "Getränke";
  if (/spüli|papier|seife|shampoo|zahnpasta|putzmittel|waschmittel|müllbeutel|deo/.test(a)) return "Drogerie & Haushalt";
  return "Sonstiges";
}

// 1RM Berechnung
const calculate1RM = (weight: number, reps: number) => Math.round(weight * (1 + reps / 30));

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeUser, setActiveUser] = useState<"Jonas" | "Lena">("Jonas");
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  // Dashboard & APIs
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [weather, setWeather] = useState<string>("Lädt...");
  const [weatherLabel, setWeatherLabel] = useState<string>("Standort");
  const [termine, setTermine] = useState<CalendarEvent[]>([]);
  const [calendarMode, setCalendarMode] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Einkauf
  const [einkauf, setEinkauf] = useState<EinkaufItem[]>([]);
  const [neuerArtikel, setNeuerArtikel] = useState("");

  // To-Dos
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [neuesTodo, setNeuesTodo] = useState("");
  const [todoKategorie, setTodoKategorie] = useState<string>("Haushalt & Reparatur");
  const [todoZustaendig, setTodoZustaendig] = useState<string>("Beide");
  const [activeTodoFilter, setActiveTodoFilter] = useState<string>("Alle");

  // Gym & Performance
  const [gymData, setGymData] = useState<GymItem[]>([]);
  const [gymUebung, setGymUebung] = useState("");
  const [gymGewicht, setGymGewicht] = useState("");
  const [gymReps, setGymReps] = useState("");
  const [gymSetNum, setGymSetNum] = useState("1");
  const [recovery, setRecovery] = useState<number>(80);

  // Sonstiges
  const [aufgaben, setAufgaben] = useState<PutzItem[]>([]);
  const [vorrat, setVorrat] = useState<VorratItem[]>([]);
  const [countdowns, setCountdowns] = useState<CountdownItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  
  const [activeNoteCategory, setActiveNoteCategory] = useState<string>("Alle");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("Allgemein");

  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());

  // --- INITIALISIERUNG ---
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

  // --- DATEN LADEN ---
  const fetchData = async () => {
    try {
      const cachedData = localStorage.getItem("haushaltOS_cache");
      if (cachedData) {
        const data = JSON.parse(cachedData);
        if (data.einkauf) setEinkauf(data.einkauf);
        if (data.todos) setTodos(data.todos);
        if (data.haushalt) setAufgaben(data.haushalt);
        if (data.vorrat) setVorrat(data.vorrat);
        if (data.countdowns) setCountdowns(data.countdowns);
        if (data.notizen) setNotes(data.notizen);
        if (data.gym) setGymData(data.gym);
      }

      const res = await fetch("/api/data");
      if (!res.ok) throw new Error("Offline");
      const raw = await res.json();
      
      const parsedData = {
        einkauf: raw.einkauf?.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, artikel: r[0], status: r[1] || "Offen", kategorie: ermittleKategorie(r[0]) })).filter((x: any) => x.artikel) || [],
        haushalt: raw.haushalt?.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, aufgabe: r[0], letztesDatum: r[1], intervall: r[2] })).filter((x: any) => x.aufgabe) || [],
        vorrat: raw.vorrat?.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, artikel: r[0], ablaufdatum: r[1], anbruch: r[2] || "" })).filter((x: any) => x.artikel) || [],
        countdowns: raw.countdowns?.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, title: r[0], date: r[1], icon: r[2] || "⏳" })).filter((x: any) => x.title) || [],
        notizen: raw.notizen?.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, title: r[0], content: r[1], category: r[2] || "Allgemein", color: r[3] || "green" })).filter((x: any) => x.title) || [],
        todos: raw.todos?.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, aufgabe: r[0], kategorie: r[1] || "Sonstiges", status: r[2] || "Offen", zustaendig: r[3] || "Beide" })).filter((x: any) => x.aufgabe) || [],
        gym: raw.gym?.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, datum: r[0], uebung: r[1], gewicht: parseFloat(r[2]), reps: parseInt(r[3]), setNum: parseInt(r[4]), user: r[5] })).filter((x: any) => x.uebung) || [],
      };

      localStorage.setItem("haushaltOS_cache", JSON.stringify(parsedData));
      
      setEinkauf(parsedData.einkauf); setAufgaben(parsedData.haushalt); setVorrat(parsedData.vorrat);
      setCountdowns(parsedData.countdowns); setNotes(parsedData.notizen); setTodos(parsedData.todos); setGymData(parsedData.gym);
    } catch (e) { 
      console.warn("Offline-Modus aktiv.", e); 
    }
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
    fetchWeather(48.1764, 11.5311, "München (OEZ)");
  }, []);

  // --- LOGIK: GYM & PERFORMANCE ---
  const addGymEntry = async () => {
    if (!gymUebung || !gymGewicht || !gymReps) return;

    const today = new Date().toISOString().split("T")[0];
    const newItem: GymItem = {
      rowIndex: Date.now(),
      datum: today,
      uebung: gymUebung.trim(),
      gewicht: parseFloat(gymGewicht),
      reps: parseInt(gymReps, 10),
      setNum: parseInt(gymSetNum, 10),
      user: activeUser,
    };

    setGymData(prev => [...prev, newItem]); 
    setGymSetNum((prev) => (parseInt(prev) + 1).toString());
    setGymGewicht(""); setGymReps("");

    try {
      await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Gym", values: [today, newItem.uebung, newItem.gewicht, newItem.reps, newItem.setNum, newItem.user] }) });
      fetchData();
    } catch (err) { fetchData(); }
  };

  // --- LOGIK: TO-DO ---
  const addTodo = async () => {
    const text = neuesTodo.trim();
    if (!text) return;
    const newItem: TodoItem = { rowIndex: Date.now(), aufgabe: text, kategorie: todoKategorie, status: "Offen", zustaendig: todoZustaendig };
    setTodos(prev => [...prev, newItem]); 
    setNeuesTodo(""); setIsFabOpen(false);
    try {
      await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Todos", values: [newItem.aufgabe, newItem.kategorie, newItem.status, newItem.zustaendig] }) });
      fetchData();
    } catch (err) { fetchData(); }
  };
  const markTodoErledigt = async (item: TodoItem, status: "Erledigt" | "Offen") => {
    setTodos(todos.map(t => t.rowIndex === item.rowIndex ? { ...t, status } : t));
    await fetch("/api/data", { method: "PUT", body: JSON.stringify({ sheetName: "Todos", rowIndex: item.rowIndex, values: [item.aufgabe, item.kategorie, status, item.zustaendig] }) });
  };
  const deleteTodo = async (item: TodoItem) => {
    setTodos(todos.filter(t => t.rowIndex !== item.rowIndex));
    await fetch("/api/data", { method: "PUT", body: JSON.stringify({ sheetName: "Todos", rowIndex: item.rowIndex, values: ["", "", "", ""] }) });
  };

  // --- KALENDER BERECHNUNGEN ---
  const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (calendarMode === "month") newDate.setMonth(newDate.getMonth() - 1);
    else newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };
  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (calendarMode === "month") newDate.setMonth(newDate.getMonth() + 1);
    else newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

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

  const getEventsForDate = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    const isoStr = `${y}-${m}-${d}`;
    const gerStr = `${d}.${m}.`;

    const iEvents = termine.filter(t => t.date.includes(isoStr) || t.date.includes(gerStr)).map(t => ({ title: t.title, type: "termin" as const }));
    const pEvents: { title: string; type: "putz" }[] = [];
    aufgaben.forEach(a => {
      if (!a.letztesDatum || !a.intervall) return;
      const dueDate = new Date(a.letztesDatum);
      dueDate.setDate(dueDate.getDate() + parseInt(a.intervall, 10));
      if (dueDate.toDateString() === dateObj.toDateString()) pEvents.push({ title: `🧹 ${a.aufgabe}`, type: "putz" });
    });
    return [...iEvents, ...pEvents];
  };

  // --- RENDER PREPARATION ---
  const offeneTodos = todos.filter(t => t.status !== "Erledigt");
  const filteredTodos = activeTodoFilter === "Alle" ? offeneTodos : offeneTodos.filter(t => t.kategorie === activeTodoFilter || t.zustaendig === activeTodoFilter);
  
  const userGymData = gymData.filter(g => g.user === activeUser);
  const selectedExercise = gymUebung.trim().toLowerCase();
  
  // Chart Daten bereiten - Neues Volumen Feld
  const chartData = userGymData
    .filter(g => selectedExercise === "" || g.uebung.toLowerCase() === selectedExercise)
    .map(g => ({
      datum: g.datum.substring(5, 10),
      oneRepMax: calculate1RM(g.gewicht, g.reps),
      volumen: g.gewicht * g.reps // Workload pro Satz
    }));

  const TABS = [
    { id: "home", icon: Home, label: "Übersicht" },
    { id: "todos", icon: ListTodo, label: "To-Dos", count: offeneTodos.length },
    { id: "gym", icon: Dumbbell, label: "Performance" },
    { id: "kalender", icon: CalendarIcon, label: "Kalender" }
  ];

  // Styles
  const bgMain = isDarkMode ? "bg-[#100A0B] text-[#EDE7E3]" : "bg-[#FAF8F5] text-[#2D2A26]";
  const bgSidebar = isDarkMode ? "bg-[#180F12] border-white/[0.08]" : "bg-[#FFFFFF] border-[#E8E2D9]";
  const bgCard = isDarkMode ? "bg-[#1E1418] border border-white/[0.08] text-[#FAF8F5] shadow-[0_4px_20px_rgba(0,0,0,0.4)]" : "bg-[#FFFFFF] border border-[#E8E2D9] shadow-[0_2px_8px_rgba(80,36,25,0.04)] text-[#2D2A26]";
  const bgInput = isDarkMode ? "bg-[#140C0E] border-white/[0.1] text-white focus:border-[#CFD186]" : "bg-[#FAF8F5] border-[#E8E2D9] text-[#2D2A26] focus:border-[#005377]";
  const bgItem = isDarkMode ? "bg-[#251A1E] border-white/[0.05]" : "bg-[#F7F4EF] border-[#E8E2D9]";
  const textTitle = isDarkMode ? "text-[#FAF8F5]" : "text-[#2D2A26]";
  const textSub = isDarkMode ? "text-[#A89F91]" : "text-[#7A7265]";
  const accentBlue = isDarkMode ? "text-[#3A8EBA]" : "text-[#005377]";
  const badgeBlue = isDarkMode ? "bg-[#005377]/30 text-[#6BB9E0] border border-[#005377]/50" : "bg-[#005377]/10 text-[#005377] border border-[#005377]/25";
  const buttonPrimary = isDarkMode ? "bg-[#005377] hover:bg-[#006894] text-white" : "bg-[#005377] hover:bg-[#00415E] text-white shadow-sm";

  return (
    <div className={`flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden ${bgMain} font-sans transition-colors duration-300 relative`}>
      
      <aside className={`hidden md:flex w-64 ${bgSidebar} border-r flex-col justify-between p-4 h-full z-20`}>
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="h-8 w-8 rounded-xl bg-[#005377] flex items-center justify-center shadow-md shadow-[#005377]/20"><Sparkles className="w-4 h-4 text-[#CFD186]" /></div>
            <div><span className={`font-bold text-sm tracking-tight ${textTitle} block leading-none`}>Haushalt OS</span><span className={`text-[10px] ${textSub} font-medium`}>Workspace Jonas & Lena</span></div>
          </div>
          <nav className="space-y-1">
            {TABS.map(tab => (
              <motion.button whileTap={tapGesture} key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === tab.id ? (isDarkMode ? "bg-[#005377]/30 text-[#82CBEE] border border-[#005377]/50" : "bg-[#005377]/10 text-[#005377] border border-[#005377]/20") : `${textSub} hover:bg-black/5`}`}>
                <div className="flex items-center gap-3"><tab.icon className={`h-4 w-4 ${activeTab === tab.id ? (isDarkMode ? "text-[#82CBEE]" : "text-[#005377]") : ""}`} /><span>{tab.label}</span></div>
                {tab.count !== undefined && tab.count > 0 && <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${badgeBlue}`}>{tab.count}</span>}
              </motion.button>
            ))}
          </nav>
        </div>
        <div className={`pt-4 border-t ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} flex justify-between items-center px-2`}>
           <button onClick={() => switchUser(activeUser === "Jonas" ? "Lena" : "Jonas")} className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-2 border transition-all ${isDarkMode ? "bg-[#251A1E] border-white/[0.08] text-white" : "bg-[#FAF8F5] border-[#E8E2D9] text-[#2D2A26]"}`}>
             <UserCheck className="h-3.5 w-3.5 text-[#5B8C5A]" /> {activeUser}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
        <header className={`pt-safe sticky top-0 z-30 ${isDarkMode ? "bg-[#100A0B]/85 border-white/[0.08]" : "bg-[#FAF8F5]/85 border-[#E8E2D9]"} backdrop-blur-md border-b transition-colors duration-300`}>
          <div className="h-14 px-4 md:px-8 flex items-center justify-between">
            <div className={`flex items-center gap-2 text-xs ${textSub} font-medium tracking-wide`}><span>Workspace</span><span>/</span><span className={`capitalize font-bold ${textTitle}`}>{activeTab}</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => switchUser(activeUser === "Jonas" ? "Lena" : "Jonas")} className={`md:hidden h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${isDarkMode ? "bg-[#251A1E] border-white/[0.08] text-white" : "bg-[#FAF8F5] border-[#E8E2D9] text-[#2D2A26]"}`}>
                <UserCheck className="h-3.5 w-3.5 text-[#5B8C5A]" /> <span>{activeUser}</span>
              </button>
              <button onClick={toggleTheme} className={`h-8 w-8 flex items-center justify-center rounded-lg ${bgCard} transition-transform active:scale-95`}>
                {isDarkMode ? <Sun className="h-4 w-4 text-[#CFD186]" /> : <Moon className="h-4 w-4 text-[#49111C]" />}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 pb-32 md:pb-12 max-w-[1400px] mx-auto w-full space-y-8">
          
          {/* TAB 1: ÜBERSICHT */}
          {activeTab === "home" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#E8E2D9] dark:border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5B8C5A] mb-1"><Sparkle className="h-3.5 w-3.5 fill-current" /> {todayStr}</div>
                  <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${textTitle}`}>Guten Tag, {activeUser}!</h1>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GYM & PERFORMANCE (MCI STYLE) - UPGRADED */}
          {activeTab === "gym" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${textTitle} flex items-center gap-2`}>
                    <Dumbbell className="h-5 w-5 text-[#82CBEE]" /> Performance OS
                  </h2>
                  <p className={`text-xs ${textSub}`}>Progressive Overload & Recovery für {activeUser}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LINKS: QUICK LOGGER & RECOVERY */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Recovery Widget (CSS Fixes for the Slider Thumb) */}
                  <div className={`${bgCard} rounded-3xl p-6 border space-y-4`}>
                    <div className="flex justify-between items-center">
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${textSub} flex items-center gap-2`}>
                        <Activity className="h-4 w-4 text-[#7DB47C]" /> Recovery Status
                      </h3>
                      <span className={`text-xl font-mono font-black ${recovery > 70 ? 'text-[#7DB47C]' : recovery > 40 ? 'text-yellow-500' : 'text-[#E27B88]'}`}>
                        {recovery}%
                      </span>
                    </div>
                    {/* Tailwind Fix für Range Slider */}
                    <input 
                      type="range" min="0" max="100" value={recovery} onChange={(e) => setRecovery(parseInt(e.target.value))} 
                      className={`w-full h-2 rounded-lg appearance-none cursor-pointer outline-none ${isDarkMode ? "bg-white/10" : "bg-black/10"} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#005377] dark:[&::-webkit-slider-thumb]:bg-[#82CBEE]`}
                    />
                  </div>

                  {/* MCI Style Quick-Logger */}
                  <div className={`${bgCard} rounded-3xl p-6 border relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Flame className="h-24 w-24" /></div>
                    <h3 className={`text-sm font-bold ${textTitle} mb-4 relative z-10`}>Neuer Satz (Track)</h3>
                    <div className="space-y-4 relative z-10">
                      <div>
                        <label className={`text-[10px] font-bold uppercase tracking-wider ${textSub}`}>Übung</label>
                        <input type="text" placeholder="z.B. Bankdrücken" value={gymUebung} onChange={e => setGymUebung(e.target.value)} className={`w-full mt-1 ${bgInput} border rounded-xl px-4 py-2.5 text-sm font-bold`} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className={`text-[10px] font-bold uppercase tracking-wider ${textSub}`}>Gewicht</label>
                          <input type="number" placeholder="kg" value={gymGewicht} onChange={e => setGymGewicht(e.target.value)} className={`w-full mt-1 ${bgInput} border rounded-xl px-3 py-2.5 text-sm font-mono font-bold`} />
                        </div>
                        <div>
                          <label className={`text-[10px] font-bold uppercase tracking-wider ${textSub}`}>Reps</label>
                          <input type="number" value={gymReps} onChange={e => setGymReps(e.target.value)} className={`w-full mt-1 ${bgInput} border rounded-xl px-3 py-2.5 text-sm font-mono font-bold`} />
                        </div>
                        <div>
                          <label className={`text-[10px] font-bold uppercase tracking-wider ${textSub}`}>Satz</label>
                          <input type="number" value={gymSetNum} onChange={e => setGymSetNum(e.target.value)} className={`w-full mt-1 ${bgInput} border rounded-xl px-3 py-2.5 text-sm font-mono font-bold`} />
                        </div>
                      </div>
                      <motion.button whileTap={tapGesture} onClick={addGymEntry} className={`w-full py-3 ${buttonPrimary} text-xs font-bold rounded-xl shadow-lg`}>
                        Satz eintragen
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* RECHTS: 2 DIAGRAMME & HISTORIE */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Diagramm-Grid: 1RM und Volume nebeneinander oder gestapelt */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1RM Chart */}
                    <div className={`${bgCard} rounded-3xl p-6 border`}>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider ${textSub}`}>1RM Verlauf</h3>
                        <span className={`text-[9px] px-2 py-0.5 rounded-md ${badgeBlue}`}>{gymUebung || "Übersicht"}</span>
                      </div>
                      <div className="h-[140px] w-full">
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <XAxis dataKey="datum" stroke={isDarkMode ? "#555" : "#ccc"} fontSize={9} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1E1418' : '#fff', borderRadius: '12px', border: 'none' }} />
                              <Line type="monotone" dataKey="oneRepMax" stroke={isDarkMode ? "#82CBEE" : "#005377"} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-500/20 rounded-xl px-4 text-center">
                            <span className={`text-xs font-medium ${textSub}`}>Gib eine Übung ein, um deinen Max-Kraft-Graphen zu sehen.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Workload / Volume Chart */}
                    <div className={`${bgCard} rounded-3xl p-6 border`}>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider ${textSub}`}>Volumen (Workload)</h3>
                        <span className={`text-[9px] px-2 py-0.5 rounded-md ${isDarkMode ? "bg-[#7DB47C]/20 text-[#7DB47C]" : "bg-[#5B8C5A]/15 text-[#3D693C]"}`}>Pro Satz (kg)</span>
                      </div>
                      <div className="h-[140px] w-full">
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <XAxis dataKey="datum" stroke={isDarkMode ? "#555" : "#ccc"} fontSize={9} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1E1418' : '#fff', borderRadius: '12px', border: 'none' }} cursor={{fill: isDarkMode ? '#ffffff05' : '#00000005'}}/>
                              <Bar dataKey="volumen" fill={isDarkMode ? "#7DB47C" : "#5B8C5A"} radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-slate-500/20 rounded-xl">
                            <span className={`text-[10px] font-medium ${textSub}`}>Keine Sätze gefunden.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Historie */}
                  <div className={`${bgCard} rounded-3xl p-6 border`}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${textSub} mb-4`}>Heutiges Workout</h3>
                    <div className="space-y-3">
                      {userGymData.filter(g => g.datum === new Date().toISOString().split("T")[0]).length === 0 ? (
                        <div className={`p-4 rounded-xl border border-dashed border-slate-500/20 text-center`}>
                           <p className={`text-xs ${textSub}`}>Noch keine Sätze heute absolviert. Let's go! 🚀</p>
                        </div>
                      ) : (
                        userGymData.filter(g => g.datum === new Date().toISOString().split("T")[0]).reverse().map((g) => (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={g.rowIndex} className={`flex items-center justify-between p-3.5 rounded-xl border ${bgItem}`}>
                            <div className="flex flex-col">
                              <span className={`text-sm font-bold ${textTitle}`}>{g.uebung}</span>
                              <span className={`text-[10px] font-bold ${textSub}`}>Satz {g.setNum}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className={`text-sm font-mono font-bold ${textTitle}`}>{g.gewicht} kg</span>
                                <span className={`text-[10px] font-mono text-slate-500 block`}>× {g.reps} Reps</span>
                              </div>
                              {calculate1RM(g.gewicht, g.reps) > 100 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#5B8C5A]/20 text-[#7DB47C]">PR 🏆</span>
                              )}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* TAB: KALENDER (MONATS-ANSICHT REPARIERT) */}
          {activeTab === "kalender" && (
            <div className="space-y-6">
              <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Kalender & Termine</h2>
              <div className={`${bgCard} rounded-3xl p-6 border`}>
                <div className="flex justify-between mb-4">
                  <div className={`flex p-1 rounded-xl border ${bgItem}`}>
                    <button onClick={() => setCalendarMode("month")} className={`px-3 py-1 rounded-lg text-xs font-bold ${calendarMode === "month" ? "bg-[#005377] text-white" : textSub}`}>Monat</button>
                    <button onClick={() => setCalendarMode("week")} className={`px-3 py-1 rounded-lg text-xs font-bold ${calendarMode === "week" ? "bg-[#005377] text-white" : textSub}`}>Woche</button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={handlePrev} className={`p-2 rounded-xl border ${bgItem}`}><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={handleNext} className={`p-2 rounded-xl border ${bgItem}`}><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
                
                {/* WIEDER HERGESTELLT: MONATSANSICHT */}
                {calendarMode === "month" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-7 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 py-2">
                      <span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: startDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-24 rounded-2xl opacity-10 bg-black/5 dark:bg-white/5" />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateObj = new Date(year, month, dayNum);
                        const dayEvents = getEventsForDate(dateObj);
                        const isToday = new Date().toDateString() === dateObj.toDateString();

                        return (
                          <div key={`day-${dayNum}`} className={`h-28 rounded-2xl p-2.5 border flex flex-col justify-between transition-all ${isToday ? "border-[#005377] bg-[#005377]/10" : `${bgItem} hover:border-slate-400`}`}>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-bold font-mono ${isToday ? accentBlue : textTitle}`}>{dayNum}</span>
                            </div>
                            
                            <div className="space-y-1 overflow-y-auto max-h-[60px] scrollbar-hide">
                              {dayEvents.map((ev, idx) => (
                                <div key={idx} className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate ${ev.type === "putz" ? "bg-[#49111C]/20 text-[#E27B88] border border-[#49111C]/30" : "bg-[#005377]/20 text-[#3A8EBA] dark:text-[#82CBEE]"}`}>
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

                {/* WOCHENANSICHT */}
                {calendarMode === "week" && (
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                    {getWeekDays().map((d, i) => {
                      const dayEvents = getEventsForDate(d);
                      const isToday = new Date().toDateString() === d.toDateString();
                      return (
                        <div key={i} className={`min-h-[150px] rounded-2xl p-4 border flex flex-col ${isToday ? "border-[#005377] bg-[#005377]/10" : bgItem}`}>
                          <div className={`text-[10px] font-bold ${textSub}`}>{d.toLocaleDateString("de-DE", { weekday: 'short' })}</div>
                          <div className={`text-lg font-extrabold font-mono mb-3 ${isToday ? accentBlue : textTitle}`}>{d.getDate()}. {d.toLocaleDateString("de-DE", { month: 'short' })}</div>
                          <div className="space-y-2 flex-1">
                            {dayEvents.map((ev, idx) => <div key={idx} className={`p-2 rounded-xl text-xs font-bold truncate ${ev.type === "putz" ? "bg-[#49111C]/20 text-[#E27B88]" : "bg-[#005377]/20 text-[#3A8EBA]"}`}>{ev.title}</div>)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}