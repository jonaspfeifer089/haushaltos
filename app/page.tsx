"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, ShoppingCart, Package, Calendar as CalendarIcon, Clock, Plus, Check, ClipboardList, Camera, UploadCloud, Loader2, Bell, Settings, Sun, Moon, ChevronDown, ChevronUp, Sparkles, Hourglass, UserCheck, Trash2, StickyNote, ArrowUpRight, CloudSun, Pin, Sparkle, ArrowRight, X, ChevronLeft, ChevronRight, CheckSquare, ListTodo, Tag
} from "lucide-react";

interface Departure { line: string; destination: string; time: string; }
interface EinkaufItem { rowIndex: number; artikel: string; status: string; kategorie?: string; }
interface PutzItem { rowIndex: number; aufgabe: string; letztesDatum: string; intervall: string; }
interface VorratItem { rowIndex: number; artikel: string; ablaufdatum: string; anbruch: string; }
interface CountdownItem { rowIndex: number; title: string; date: string; icon: string; }
interface NoteItem { rowIndex: number; title: string; content: string; category: string; color: string; }
interface CalendarEvent { title: string; date: string; type?: "termin" | "putz"; }
interface TodoItem { rowIndex: number; aufgabe: string; kategorie: string; status: string; zustaendig: string; }

const EINKAUF_KATEGORIEN = ["Obst & Gemüse", "Kühlregal", "Vorrat & Teigwaren", "Getränke", "Drogerie & Haushalt", "Sonstiges"] as const;
const TODO_KATEGORIEN = ["Haushalt & Reparatur", "Bürokratie & Verträge", "Besorgungen", "Freizeit & Projekte", "Sonstiges"] as const;

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
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [weather, setWeather] = useState<string>("Lädt...");
  const [weatherLabel, setWeatherLabel] = useState<string>("Standort");
  const [termine, setTermine] = useState<CalendarEvent[]>([]);
  
  const [calendarMode, setCalendarMode] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [einkauf, setEinkauf] = useState<EinkaufItem[]>([]);
  const [neuerArtikel, setNeuerArtikel] = useState("");
  const [showErledigt, setShowErledigt] = useState(false);

  // To-Do State
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [neuesTodo, setNeuesTodo] = useState("");
  const [todoKategorie, setTodoKategorie] = useState<string>("Haushalt & Reparatur");
  const [todoZustaendig, setTodoZustaendig] = useState<string>("Beide");
  const [activeTodoFilter, setActiveTodoFilter] = useState<string>("Alle");
  const [showErledigteTodos, setShowErledigteTodos] = useState(false);

  const [aufgaben, setAufgaben] = useState<PutzItem[]>([]);
  const [vorrat, setVorrat] = useState<VorratItem[]>([]);
  const [countdowns, setCountdowns] = useState<CountdownItem[]>([]);
  const [newCdTitle, setNewCdTitle] = useState("");
  const [newCdDate, setNewCdDate] = useState("");
  const [newCdIcon, setNewCdIcon] = useState("✈️");

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNoteCategory, setActiveNoteCategory] = useState<string>("Alle");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("Allgemein");

  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());

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
      if (data.todos) setTodos(data.todos.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, aufgabe: r[0], kategorie: r[1] || "Sonstiges", status: r[2] || "Offen", zustaendig: r[3] || "Beide" })).filter((x: any) => x.aufgabe));
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
    setIsFabOpen(false);
    
    await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Einkauf", values: [newItem.artikel, newItem.status] }) });
    
    try {
      await fetch("https://ntfy.sh/HaushaltLenaJonas", {
        method: "POST",
        body: `${activeUser} hat "${text}" auf die Einkaufsliste gesetzt.`,
        headers: { "Title": "Haushalt OS - Neuer Einkauf", "Tags": "shopping_cart", "Priority": "default" }
      });
    } catch (err) { console.error("ntfy Push Error:", err); }

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

  // TO-DO LOGIK & NTFY PUSH
  const addTodo = async () => {
    const text = neuesTodo.trim();
    if (!text) return;
    const newItem: TodoItem = { 
      rowIndex: todos.length + 2, 
      aufgabe: text, 
      kategorie: todoKategorie, 
      status: "Offen", 
      zustaendig: todoZustaendig 
    };
    setTodos([...todos, newItem]);
    setNeuesTodo("");
    setIsFabOpen(false);

    await fetch("/api/data", { 
      method: "POST", 
      body: JSON.stringify({ sheetName: "Todos", values: [newItem.aufgabe, newItem.kategorie, newItem.status, newItem.zustaendig] }) 
    });

    try {
      await fetch("https://ntfy.sh/HaushaltLenaJonas", {
        method: "POST",
        body: `${activeUser} hat ein neues To-Do angelegt: "${text}" (${todoKategorie} · für ${todoZustaendig})`,
        headers: { "Title": "Haushalt OS - Neues To-Do", "Tags": "ballot_box_with_check,memo", "Priority": "default" }
      });
    } catch (err) { console.error("ntfy Push Error:", err); }

    fetchData();
  };

  const markTodoErledigt = async (item: TodoItem, status: "Erledigt" | "Offen") => {
    setTodos(todos.map(t => t.rowIndex === item.rowIndex ? { ...t, status } : t));
    await fetch("/api/data", { 
      method: "PUT", 
      body: JSON.stringify({ sheetName: "Todos", rowIndex: item.rowIndex, values: [item.aufgabe, item.kategorie, status, item.zustaendig] }) 
    });
  };

  const deleteTodo = async (item: TodoItem) => {
    setTodos(todos.filter(t => t.rowIndex !== item.rowIndex));
    await fetch("/api/data", { 
      method: "PUT", 
      body: JSON.stringify({ sheetName: "Todos", rowIndex: item.rowIndex, values: ["", "", "", ""] }) 
    });
  };

  const markAufgabeErledigt = async (item: PutzItem) => {
    const today = new Date().toISOString().split("T")[0];
    setAufgaben(aufgaben.map(a => a.rowIndex === item.rowIndex ? { ...a, letztDatum: today } : a));
    await fetch("/api/data", { method: "PUT", body: JSON.stringify({ sheetName: "Haushalt", rowIndex: item.rowIndex, values: [item.aufgabe, today, item.intervall, activeUser] }) });
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

  const addNote = async () => {
    if (!newNoteTitle || !newNoteContent) return;
    const newItem: NoteItem = { rowIndex: notes.length + 2, title: newNoteTitle, content: newNoteContent, category: newNoteCategory, color: "green" };
    setNotes([...notes, newItem]);
    setNewNoteTitle("");
    setNewNoteContent("");
    setShowNoteModal(false);
    setIsFabOpen(false);

    await fetch("/api/data", { 
      method: "POST", 
      body: JSON.stringify({ sheetName: "Notizen", values: [newItem.title, newItem.content, newItem.category, newItem.color] }) 
    });
    fetchData();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7).split(',')[1];

        try {
          const res = await fetch("/api/vision", { 
            method: "POST", 
            body: JSON.stringify({ imageBase64: compressedBase64 }) 
          });
          const aiData = await res.json();
          
          if (aiData.artikel && aiData.mhd) {
            await fetch("/api/data", { 
              method: "POST", 
              body: JSON.stringify({ sheetName: "Vorrat", values: [aiData.artikel, aiData.mhd, ""] }) 
            });
            fetchData(); 
          } else {
            alert(aiData.error || "Konnte kein Produkt erkennen.");
          }
        } catch (err) {
          console.error("Scan Upload Fehler:", err);
          alert("Fehler bei der Bildanalyse.");
        }
        setIsScanning(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const calculateDaysLeft = (targetDateStr: string) => {
    const target = new Date(targetDateStr);
    const now = new Date();
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getPutzEventsForDate = (dateObj: Date) => {
    const events: { title: string; type: "putz" }[] = [];
    aufgaben.forEach(a => {
      if (!a.letztesDatum || !a.intervall) return;
      const lastDate = new Date(a.letztesDatum);
      const intervalDays = parseInt(a.intervall, 10);
      const dueDate = new Date(lastDate);
      dueDate.setDate(dueDate.getDate() + intervalDays);

      if (dueDate.toDateString() === dateObj.toDateString()) {
        events.push({ title: `🧹 ${a.aufgabe}`, type: "putz" });
      }
    });
    return events;
  };

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

  const handleToday = () => setCurrentDate(new Date());

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

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  };

  const getEventsForDate = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    const isoDateStr = `${y}-${m}-${d}`;
    const germanDateStr = `${d}.${m}.`;

    const icloudEvents = termine.filter(t => t.date.includes(isoDateStr) || t.date.includes(germanDateStr)).map(t => ({ title: t.title, type: "termin" as const }));
    const putzEvents = getPutzEventsForDate(dateObj);

    return [...icloudEvents, ...putzEvents];
  };

  const offeneEinkaeufe = einkauf.filter(e => e.status !== "Erledigt");
  const erledigteEinkaeufe = einkauf.filter(e => e.status === "Erledigt");

  const offeneTodos = todos.filter(t => t.status !== "Erledigt");
  const erledigteTodos = todos.filter(t => t.status === "Erledigt");

  const filteredTodos = activeTodoFilter === "Alle" 
    ? offeneTodos 
    : offeneTodos.filter(t => t.kategorie === activeTodoFilter || t.zustaendig === activeTodoFilter);

  const einkaufNachKategorien = EINKAUF_KATEGORIEN.reduce((acc, kat) => {
    const items = offeneEinkaeufe.filter(i => (i.kategorie || ermittleKategorie(i.artikel)) === kat);
    if (items.length > 0) acc[kat] = items;
    return acc;
  }, {} as Record<string, EinkaufItem[]>);

  const noteCategories = ["Alle", ...Array.from(new Set(notes.map(n => n.category)))];
  const filteredNotes = activeNoteCategory === "Alle" ? notes : notes.filter(n => n.category === activeNoteCategory);

  const TABS = [
    { id: "home", icon: Home, label: "Übersicht" },
    { id: "todos", icon: ListTodo, label: "To-Dos", count: offeneTodos.length },
    { id: "einkauf", icon: ShoppingCart, label: "Einkauf", count: offeneEinkaeufe.length },
    { id: "putzplan", icon: ClipboardList, label: "Putzplan" },
    { id: "vorrat", icon: Package, label: "Vorrat" },
    { id: "notizen", icon: StickyNote, label: "Pinnwand" },
    { id: "kalender", icon: CalendarIcon, label: "Kalender" }
  ];

  const bgMain = isDarkMode ? "bg-[#100A0B] text-[#EDE7E3]" : "bg-[#FAF8F5] text-[#2D2A26]";
  const bgSidebar = isDarkMode ? "bg-[#180F12] border-white/[0.08]" : "bg-[#FFFFFF] border-[#E8E2D9]";
  const bgCard = isDarkMode ? "bg-[#1E1418] border border-white/[0.08] text-[#FAF8F5] shadow-[0_4px_20px_rgba(0,0,0,0.4)]" : "bg-[#FFFFFF] border border-[#E8E2D9] shadow-[0_2px_8px_rgba(80,36,25,0.04)] text-[#2D2A26]";
  const bgInput = isDarkMode ? "bg-[#140C0E] border-white/[0.1] text-white focus:border-[#CFD186]" : "bg-[#FAF8F5] border-[#E8E2D9] text-[#2D2A26] focus:border-[#005377]";
  const bgItem = isDarkMode ? "bg-[#251A1E] border-white/[0.05]" : "bg-[#F7F4EF] border-[#E8E2D9]";
  const textTitle = isDarkMode ? "text-[#FAF8F5]" : "text-[#2D2A26]";
  const textSub = isDarkMode ? "text-[#A89F91]" : "text-[#7A7265]";
  
  const accentGreen = isDarkMode ? "text-[#7DB47C]" : "text-[#3D693C]";
  const accentBlue = isDarkMode ? "text-[#3A8EBA]" : "text-[#005377]";
  const badgeGreen = isDarkMode ? "bg-[#5B8C5A]/20 text-[#9ED09D] border border-[#5B8C5A]/40" : "bg-[#5B8C5A]/15 text-[#2C522B] border border-[#5B8C5A]/30";
  const badgeBlue = isDarkMode ? "bg-[#005377]/30 text-[#6BB9E0] border border-[#005377]/50" : "bg-[#005377]/10 text-[#005377] border border-[#005377]/25";
  const buttonPrimary = isDarkMode ? "bg-[#005377] hover:bg-[#006894] text-white" : "bg-[#005377] hover:bg-[#00415E] text-white shadow-sm";

  return (
    <div className={`flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden ${bgMain} font-sans transition-colors duration-300 relative`}>
      
      {/* SIDEBAR */}
      <aside className={`hidden md:flex w-64 ${bgSidebar} border-r flex-col justify-between p-4 h-full z-20`}>
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="h-8 w-8 rounded-xl bg-[#005377] flex items-center justify-center shadow-md shadow-[#005377]/20">
              <Sparkles className="w-4 h-4 text-[#CFD186]" />
            </div>
            <div>
              <span className={`font-bold text-sm tracking-tight ${textTitle} block leading-none`}>Haushalt OS</span>
              <span className={`text-[10px] ${textSub} font-medium`}>Workspace Jonas & Lena</span>
            </div>
          </div>

          <nav className="space-y-1">
            <div className={`px-3 text-[10px] font-bold ${textSub} uppercase tracking-wider mb-2 mt-4`}>Navigation</div>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? (isDarkMode ? "bg-[#005377]/30 text-[#82CBEE] border border-[#005377]/50" : "bg-[#005377]/10 text-[#005377] border border-[#005377]/20") 
                      : `${textSub} hover:bg-black/5 dark:hover:bg-white/5`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className={`h-4 w-4 ${isActive ? (isDarkMode ? "text-[#82CBEE]" : "text-[#005377]") : ""}`} /> 
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${badgeBlue}`}>
                      {tab.count}
                    </span>
                  )}
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
        
        <header className={`pt-safe sticky top-0 z-30 ${isDarkMode ? "bg-[#100A0B]/85 border-white/[0.08]" : "bg-[#FAF8F5]/85 border-[#E8E2D9]"} backdrop-blur-md border-b transition-colors duration-300`}>
          <div className="h-14 px-4 md:px-8 flex items-center justify-between">
            <div className={`flex items-center gap-2 text-xs ${textSub} font-medium tracking-wide`}>
              <span>Workspace</span>
              <span>/</span>
              <span className={`capitalize font-bold ${textTitle}`}>{activeTab}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className={`h-8 w-8 flex items-center justify-center rounded-lg ${bgCard} transition-transform active:scale-95`}>
                {isDarkMode ? <Sun className="h-4 w-4 text-[#CFD186]" /> : <Moon className="h-4 w-4 text-[#49111C]" />}
              </button>
              <button className={`h-8 w-8 flex items-center justify-center rounded-lg ${bgCard}`}>
                <Bell className="h-4 w-4 text-slate-400" />
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
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5B8C5A] mb-1">
                    <Sparkle className="h-3.5 w-3.5 fill-current" /> {todayStr}
                  </div>
                  <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${textTitle}`}>
                    Guten Tag, {activeUser}!
                  </h1>
                </div>

                <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl ${bgCard}`}>
                  <CloudSun className={`h-6 w-6 ${accentBlue}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-extrabold font-mono leading-none ${textTitle}`}>{weather}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeGreen}`}>München</span>
                    </div>
                    <span className={`text-[11px] ${textSub} font-medium`}>Perfektes Wetter draußen</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-6">
                  {countdowns.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <h3 className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Anstehende Meilensteine</h3>
                        <span className={`text-xs ${accentBlue} font-semibold cursor-pointer`} onClick={() => setActiveTab("kalender")}>Verwalten &gt;</span>
                      </div>

                      <div className="space-y-2.5">
                        {countdowns.map((cd, idx) => {
                          const days = calculateDaysLeft(cd.date);
                          return (
                            <motion.div whileHover={{ x: 4 }} key={idx} className={`${bgCard} rounded-2xl p-4 flex items-center justify-between border relative overflow-hidden transition-all`}>
                              <div className="flex items-center gap-3.5">
                                <span className="text-2xl p-2 rounded-xl bg-[#5B8C5A]/15 border border-[#5B8C5A]/30">{cd.icon}</span>
                                <div>
                                  <h4 className={`text-sm font-bold ${textTitle}`}>{cd.title}</h4>
                                  <p className={`text-xs ${textSub} font-medium`}>{cd.date}</p>
                                </div>
                              </div>
                              <div className="text-right flex items-baseline gap-1">
                                <span className={`text-xl font-black font-mono ${accentGreen}`}>{days >= 0 ? days : 0}</span>
                                <span className={`text-[11px] font-bold ${textSub}`}>Tage</span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center px-1">
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Termine & Putzplan</h3>
                      <span className={`text-[10px] ${textSub}`}>iCloud & Haushalt OS</span>
                    </div>

                    <div className={`${bgCard} rounded-3xl p-6 border space-y-3`}>
                      {termine.slice(0, 4).map((t, i) => (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-2xl border ${bgItem} gap-4`}>
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-[#005377]" />
                            <span className={`text-xs font-bold ${textTitle} truncate max-w-[220px] sm:max-w-none`}>{t.title}</span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold ${badgeBlue} px-2.5 py-1 rounded-lg shrink-0`}>{t.date}</span>
                        </div>
                      ))}
                      {termine.length === 0 && <p className={`text-xs ${textSub} py-4 text-center`}>Keine Termine synchronisiert.</p>}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-3">
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${textSub} px-1`}>Schnellübersicht</h3>
                    
                    {/* TO-DO WIDGET */}
                    <div onClick={() => setActiveTab("todos")} className={`${bgCard} rounded-3xl p-5 border cursor-pointer hover:border-[#005377]/50 transition-all group`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <ListTodo className={`h-4 w-4 ${accentBlue}`} />
                          <span className={`text-xs font-bold ${textTitle}`}>To-Do Liste</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeBlue}`}>{offeneTodos.length} offen</span>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {offeneTodos.slice(0, 3).map((item, i) => (
                          <div key={i} className={`text-xs ${textSub} flex items-center justify-between gap-2`}>
                            <div className="flex items-center gap-2 truncate">
                              <span className="h-1 w-1 rounded-full bg-[#005377]" />
                              <span className="truncate">{item.aufgabe}</span>
                            </div>
                            <span className="text-[10px] font-mono font-medium opacity-70 shrink-0">{item.zustaendig}</span>
                          </div>
                        ))}
                        {offeneTodos.length === 0 && <span className={`text-xs ${textSub}`}>Keine offenen To-Dos! 🎉</span>}
                      </div>
                      <div className={`text-[11px] font-bold ${accentBlue} flex items-center gap-1 group-hover:translate-x-1 transition-transform`}>
                        Alle To-Dos ansehen <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>

                    <div onClick={() => setActiveTab("einkauf")} className={`${bgCard} rounded-3xl p-5 border cursor-pointer hover:border-[#5B8C5A]/50 transition-all group`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className={`h-4 w-4 ${accentGreen}`} />
                          <span className={`text-xs font-bold ${textTitle}`}>Einkaufsliste</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeGreen}`}>{offeneEinkaeufe.length} offen</span>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {offeneEinkaeufe.slice(0, 2).map((item, i) => (
                          <div key={i} className={`text-xs ${textSub} flex items-center gap-2`}>
                            <span className="h-1 w-1 rounded-full bg-slate-400" />
                            <span className="truncate">{item.artikel}</span>
                          </div>
                        ))}
                      </div>
                      <div className={`text-[11px] font-bold ${accentGreen} flex items-center gap-1 group-hover:translate-x-1 transition-transform`}>
                        Zur Einkaufsliste <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>

                    <div onClick={() => setActiveTab("putzplan")} className={`${bgCard} rounded-3xl p-5 border cursor-pointer hover:border-[#49111C]/40 transition-all group`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-[#49111C] dark:text-[#E27B88]" />
                          <span className={`text-xs font-bold ${textTitle}`}>Putzaufgaben</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#49111C]/15 text-[#49111C] dark:text-[#E27B88] border border-[#49111C]/30">{aufgaben.length} aktiv</span>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {aufgaben.slice(0, 2).map((a, i) => (
                          <div key={i} className={`text-xs ${textSub} flex items-center justify-between`}>
                            <span className="truncate">{a.aufgabe}</span>
                            <span className="font-mono text-[10px]">{a.letztesDatum}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[11px] font-bold text-[#49111C] dark:text-[#E27B88] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Putzplan ansehen <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>

                  <div className={`${bgCard} rounded-3xl p-6 border space-y-4`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className={`text-xs font-bold ${textTitle}`}>Abfahrten OEZ</h3>
                        <p className={`text-[10px] ${textSub}`}>Münchner Verkehrsgesellschaft</p>
                      </div>
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${badgeBlue}`}>LIVE</span>
                    </div>
                    <div className="space-y-2.5">
                      {departures.slice(0, 3).map((d, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${badgeBlue}`}>{d.line}</span>
                            <span className={`truncate max-w-[120px] font-semibold ${textTitle}`}>{d.destination}</span>
                          </div>
                          <span className={`font-mono font-bold ${textSub}`}>{d.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TO-DOS */}
          {activeTab === "todos" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>To-Do Liste</h2>
                  <p className={`text-xs ${textSub}`}>Wischen: Links = Erledigen, Rechts = Löschen</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-mono font-bold ${badgeBlue}`}>
                  {offeneTodos.length} offen
                </span>
              </div>

              {/* To-Do Eingabe & Kategorien */}
              <div className={`${bgCard} rounded-2xl p-6 space-y-4`}>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <input 
                    type="text" 
                    placeholder="Neue Aufgabe (z.B. Keller aufräumen, Stromvertrag kündigen)..." 
                    value={neuesTodo} 
                    onChange={(e) => setNeuesTodo(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && addTodo()} 
                    className={`sm:col-span-6 ${bgInput} border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all font-medium`} 
                  />
                  <select 
                    value={todoKategorie} 
                    onChange={(e) => setTodoKategorie(e.target.value)}
                    className={`sm:col-span-3 ${bgInput} border rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none`}
                  >
                    {TODO_KATEGORIEN.map(kat => (
                      <option key={kat} value={kat}>{kat}</option>
                    ))}
                  </select>
                  <select 
                    value={todoZustaendig} 
                    onChange={(e) => setTodoZustaendig(e.target.value)}
                    className={`sm:col-span-1.5 ${bgInput} border rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none`}
                  >
                    <option value="Beide">Beide</option>
                    <option value="Jonas">Jonas</option>
                    <option value="Lena">Lena</option>
                  </select>
                  <button onClick={addTodo} className={`sm:col-span-1.5 px-4 py-2.5 ${buttonPrimary} text-xs font-bold rounded-xl transition-all`}>
                    Hinzufügen
                  </button>
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pt-2 pb-1 scrollbar-hide">
                  {["Alle", ...TODO_KATEGORIEN, "Jonas", "Lena", "Beide"].map(filter => (
                    <button 
                      key={filter} 
                      onClick={() => setActiveTodoFilter(filter)} 
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        activeTodoFilter === filter ? `${badgeBlue} shadow-sm` : `${bgItem} ${textSub}`
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* To-Do Liste mit Swipe Support */}
              <div className={`${bgCard} rounded-2xl p-6`}>
                <div className="space-y-3">
                  {filteredTodos.length === 0 ? (
                    <p className={`text-xs ${textSub} text-center py-6 font-medium`}>Keine offenen To-Dos in diesem Bereich!</p>
                  ) : (
                    filteredTodos.map((todo) => (
                      <div key={todo.rowIndex} className="relative rounded-xl overflow-hidden">
                        <div className="absolute inset-0 flex justify-between items-center px-4 rounded-xl bg-gradient-to-r from-[#49111C] via-[#251A1E] to-[#5B8C5A] text-white">
                          <div className="flex items-center gap-1 text-xs font-bold text-rose-200"><Trash2 className="h-4 w-4" /> Löschen</div>
                          <div className="flex items-center gap-1 text-xs font-bold text-emerald-200">Erledigt <Check className="h-4 w-4" /></div>
                        </div>

                        <motion.div 
                          drag="x"
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.6}
                          onDragEnd={(_, info) => {
                            if (info.offset.x > 75) deleteTodo(todo);
                            else if (info.offset.x < -75) markTodoErledigt(todo, "Erledigt");
                          }}
                          className={`relative z-10 flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${bgItem} ${bgCard} shadow-sm cursor-grab active:cursor-grabbing transition-colors gap-3 sm:gap-0`}
                        >
                          <div>
                            <span className={`text-sm font-semibold ${textTitle} block`}>{todo.aufgabe}</span>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeBlue}`}>{todo.kategorie}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDarkMode ? "bg-white/5 text-slate-300" : "bg-black/5 text-slate-600"}`}>
                                👤 {todo.zustaendig}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button onClick={() => markTodoErledigt(todo, "Erledigt")} className={`h-7 px-3 text-[11px] font-bold rounded-lg ${badgeGreen} hover:opacity-80 transition-colors flex items-center gap-1`}>
                              <Check className="h-3.5 w-3.5" /> <span>Erledigen</span>
                            </button>
                            <button onClick={() => deleteTodo(todo)} className="p-1.5 text-slate-400 hover:text-[#49111C] transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    ))
                  )}
                </div>

                {/* Erledigte To-Dos Dropdown */}
                {erledigteTodos.length > 0 && (
                  <div className={`mt-6 pt-4 border-t ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"}`}>
                    <button onClick={() => setShowErledigteTodos(!showErledigteTodos)} className={`flex items-center justify-between w-full text-xs font-bold ${textSub}`}>
                      <span>Erledigte Aufgaben ({erledigteTodos.length})</span>
                      {showErledigteTodos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {showErledigteTodos && (
                      <div className="space-y-2 mt-3 opacity-60">
                        {erledigteTodos.map((todo) => (
                          <div key={todo.rowIndex} className="flex items-center justify-between p-2.5 text-xs line-through text-slate-500 rounded-lg">
                            <span>{todo.aufgabe} ({todo.kategorie})</span>
                            <button onClick={() => markTodoErledigt(todo, "Offen")} className={`text-[10px] font-bold ${accentBlue} hover:underline`}>Wieder öffnen</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EINKAUF */}
          {activeTab === "einkauf" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Einkaufsliste</h2>
                  <p className={`text-xs ${textSub}`}>Wischen: Links = Erledigen, Rechts = Löschen</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-mono font-bold ${badgeBlue}`}>
                  {offeneEinkaeufe.length} offen
                </span>
              </div>

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

              <div className={`${bgCard} rounded-2xl p-6`}>
                <div className={`flex flex-col md:flex-row gap-3 mb-6 pb-6 border-b ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"}`}>
                  <input type="text" placeholder="Neuer Artikel (z.B. Hafermilch)..." value={neuerArtikel} onChange={(e) => setNeuerArtikel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addEinkauf()} className={`flex-1 ${bgInput} border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all font-medium`} />
                  <button onClick={() => addEinkauf()} className={`px-6 py-2.5 ${buttonPrimary} text-xs font-bold rounded-xl transition-all`}>Hinzufügen</button>
                </div>

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
                            <div key={item.rowIndex} className="relative rounded-xl overflow-hidden">
                              <div className="absolute inset-0 flex justify-between items-center px-4 rounded-xl bg-gradient-to-r from-[#49111C] via-[#251A1E] to-[#5B8C5A] text-white">
                                <div className="flex items-center gap-1 text-xs font-bold text-rose-200"><Trash2 className="h-4 w-4" /> Löschen</div>
                                <div className="flex items-center gap-1 text-xs font-bold text-emerald-200">Erledigt <Check className="h-4 w-4" /></div>
                              </div>
                              <motion.div 
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.6}
                                onDragEnd={(_, info) => {
                                  if (info.offset.x > 75) deleteEinkauf(item);
                                  else if (info.offset.x < -75) markEinkaufErledigt(item, "Erledigt");
                                }}
                                className={`relative z-10 flex items-center justify-between p-3.5 rounded-xl border ${bgItem} ${bgCard} shadow-sm cursor-grab active:cursor-grabbing transition-colors`}
                              >
                                <span className={`text-sm font-semibold ${textTitle}`}>{item.artikel}</span>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => markEinkaufErledigt(item, "Erledigt")} className={`h-7 px-3 text-[11px] font-bold rounded-lg ${badgeGreen} hover:opacity-80 transition-colors flex items-center gap-1`}>
                                    <Check className="h-3.5 w-3.5" /> <span>Erledigt</span>
                                  </button>
                                  <button onClick={() => deleteEinkauf(item)} className="p-1.5 text-slate-400 hover:text-[#49111C] transition-colors"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </motion.div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
                        <button onClick={() => fileInputRef.current?.click()} className={`text-xs ${buttonPrimary} px-4 py-2 rounded-xl transition-all font-bold`}>Kamera starten</button>
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
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Pinnwand & Notizen</h2>
                  <p className={`text-xs ${textSub}`}>WLAN, Notizen & wichtige Kontakte</p>
                </div>
                <button onClick={() => setShowNoteModal(!showNoteModal)} className={`px-4 py-2 ${buttonPrimary} text-xs font-bold rounded-xl flex items-center gap-2 transition-all`}>
                  <Plus className="h-4 w-4" /> Notiz anlegen
                </button>
              </div>

              {showNoteModal && (
                <div className={`${bgCard} rounded-2xl p-6 border space-y-4`}>
                  <h3 className={`text-sm font-bold ${textTitle}`}>Neue Notiz erstellen</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input type="text" placeholder="Titel..." value={newNoteTitle} onChange={e => setNewNoteTitle(e.target.value)} className={`sm:col-span-2 ${bgInput} border rounded-xl px-4 py-2 text-xs font-medium focus:outline-none`} />
                    <select value={newNoteCategory} onChange={e => setNewNoteCategory(e.target.value)} className={`${bgInput} border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none`}>
                      <option value="Allgemein">Allgemein</option>
                      <option value="WLAN & Haus">WLAN & Haus</option>
                      <option value="Rezepte">Rezepte</option>
                      <option value="Ideen">Ideen</option>
                    </select>
                  </div>
                  <textarea placeholder="Inhalt..." value={newNoteContent} onChange={e => setNewNoteContent(e.target.value)} className={`w-full ${bgInput} border rounded-xl px-4 py-3 text-xs font-medium focus:outline-none h-24`} />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowNoteModal(false)} className={`px-4 py-2 text-xs font-bold ${textSub}`}>Abbrechen</button>
                    <button onClick={addNote} className={`px-6 py-2 ${buttonPrimary} text-xs font-bold rounded-xl`}>Speichern</button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {noteCategories.map(cat => (
                  <button key={cat} onClick={() => setActiveNoteCategory(cat)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeNoteCategory === cat ? `${badgeBlue} shadow-sm` : `${bgCard} ${textSub}`}`}>
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map((note) => (
                  <div key={note.rowIndex} className={`${bgCard} rounded-2xl p-5 border relative overflow-hidden group`}>
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${badgeGreen}`}>{note.category}</span>
                      <Pin className="h-3.5 w-3.5 text-slate-400 opacity-50" />
                    </div>
                    <h3 className={`text-sm font-bold mt-2.5 mb-1 ${textTitle}`}>{note.title}</h3>
                    <p className={`text-xs leading-relaxed ${textSub} whitespace-pre-line font-medium`}>{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: KALENDER */}
          {activeTab === "kalender" && (
            <div className="space-y-6">
              
              <div className={`${bgCard} rounded-3xl p-6 border space-y-6`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>
                      {calendarMode === "month" 
                        ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` 
                        : `Woche vom ${getWeekDays()[0].toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit' })}`
                      }
                    </h2>
                    <button onClick={handleToday} className={`text-xs px-3 py-1 rounded-lg border ${bgItem} font-bold hover:border-[#005377] transition-colors`}>
                      Heute
                    </button>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className={`flex p-1 rounded-xl border ${bgItem}`}>
                      <button onClick={() => setCalendarMode("month")} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${calendarMode === "month" ? "bg-[#005377] text-white shadow-sm" : textSub}`}>
                        Monat
                      </button>
                      <button onClick={() => setCalendarMode("week")} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${calendarMode === "week" ? "bg-[#005377] text-white shadow-sm" : textSub}`}>
                        Woche
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={handlePrev} className={`p-2 rounded-xl border ${bgItem} hover:border-[#005377] transition-colors`}><ChevronLeft className="h-4 w-4" /></button>
                      <button onClick={handleNext} className={`p-2 rounded-xl border ${bgItem} hover:border-[#005377] transition-colors`}><ChevronRight className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>

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
                          <div 
                            key={`day-${dayNum}`} 
                            className={`h-28 rounded-2xl p-2.5 border flex flex-col justify-between transition-all ${isToday ? "border-[#005377] bg-[#005377]/10" : `${bgItem} hover:border-slate-400`}`}
                          >
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-bold font-mono ${isToday ? accentBlue : textTitle}`}>{dayNum}</span>
                              {dayEvents.length > 0 && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#5B8C5A]/20 text-[#7DB47C]">
                                  {dayEvents.length}
                                </span>
                              )}
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

                {calendarMode === "week" && (
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                    {getWeekDays().map((d, i) => {
                      const dayEvents = getEventsForDate(d);
                      const isToday = new Date().toDateString() === d.toDateString();

                      return (
                        <div key={i} className={`min-h-[220px] rounded-2xl p-4 border flex flex-col justify-between ${isToday ? "border-[#005377] bg-[#005377]/10" : bgItem}`}>
                          <div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider ${textSub}`}>
                              {d.toLocaleDateString("de-DE", { weekday: 'short' })}
                            </div>
                            <div className={`text-lg font-extrabold font-mono ${isToday ? accentBlue : textTitle} mb-3`}>
                              {d.getDate()}. {d.toLocaleDateString("de-DE", { month: 'short' })}
                            </div>
                          </div>

                          <div className="space-y-2 flex-1 overflow-y-auto max-h-[150px]">
                            {dayEvents.map((ev, idx) => (
                              <div key={idx} className={`p-2 rounded-xl text-xs font-bold truncate ${ev.type === "putz" ? "bg-[#49111C]/20 text-[#E27B88] border border-[#49111C]/30" : "bg-[#005377]/20 border border-[#005377]/30 text-[#3A8EBA] dark:text-[#82CBEE]"}`}>
                                {ev.title}
                              </div>
                            ))}
                            {dayEvents.length === 0 && <span className="text-[11px] text-slate-500 italic">Keine Termine</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

              <div className="space-y-3">
                <h3 className={`text-base font-bold tracking-tight ${textTitle} flex items-center gap-2`}>
                  <Hourglass className={`h-4 w-4 ${accentBlue}`} /> Countdowns verwalten
                </h3>
                <div className={`${bgCard} rounded-2xl p-5`}>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input type="text" placeholder="Event Name..." value={newCdTitle} onChange={e => setNewCdTitle(e.target.value)} className={`sm:col-span-2 ${bgInput} border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none`} />
                    <input type="date" value={newCdDate} onChange={e => setNewCdDate(e.target.value)} className={`${bgInput} border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none`} />
                    <div className="flex gap-2">
                      <input type="text" placeholder="Emoji" value={newCdIcon} onChange={e => setNewCdIcon(e.target.value)} className={`w-14 text-center ${bgInput} border rounded-xl px-2 py-2 text-xs font-medium focus:outline-none`} />
                      <button onClick={addCountdown} className={`flex-1 ${buttonPrimary} text-xs font-bold rounded-xl transition-all`}>Speichern</button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <div className="fixed bottom-20 md:bottom-8 right-5 md:right-8 z-50">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.85, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.85, y: 15 }}
              className="absolute bottom-16 right-0 flex flex-col gap-2.5 items-end mb-2 w-max"
            >
              <button onClick={() => { setActiveTab("todos"); setIsFabOpen(false); }} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl shadow-lg border ${bgCard} ${textTitle} text-xs font-bold hover:scale-105 transition-all`}>
                <span>To-Do erstellen</span>
                <div className="h-7 w-7 rounded-lg bg-[#005377] text-white flex items-center justify-center"><ListTodo className="h-4 w-4" /></div>
              </button>

              <button onClick={() => { setActiveTab("notizen"); setShowNoteModal(true); setIsFabOpen(false); }} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl shadow-lg border ${bgCard} ${textTitle} text-xs font-bold hover:scale-105 transition-all`}>
                <span>Notiz schreiben</span>
                <div className="h-7 w-7 rounded-lg bg-[#5B8C5A] text-white flex items-center justify-center"><StickyNote className="h-4 w-4" /></div>
              </button>

              <button onClick={() => { setActiveTab("einkauf"); setIsFabOpen(false); }} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl shadow-lg border ${bgCard} ${textTitle} text-xs font-bold hover:scale-105 transition-all`}>
                <span>Einkauf hinzufügen</span>
                <div className="h-7 w-7 rounded-lg bg-[#502419] text-white flex items-center justify-center"><ShoppingCart className="h-4 w-4" /></div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`h-14 w-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 ${isFabOpen ? "bg-[#49111C] text-white rotate-45" : "bg-[#005377] text-white hover:scale-105 shadow-[#005377]/40"}`}
          aria-label="Schnellaktionen"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${isDarkMode ? "bg-[#100A0B]/90 border-white/[0.08]" : "bg-[#FAF8F5]/90 border-[#E8E2D9]"} backdrop-blur-xl border-t px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] flex justify-around items-center`}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center min-w-[42px] h-11 gap-0.5 rounded-lg transition-all relative ${isActive ? `${accentBlue} font-bold` : textSub}`}>
              <tab.icon className="h-4 w-4" />
              <span className="text-[9px] tracking-tight">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="absolute top-0.5 right-1.5 h-2 w-2 rounded-full bg-[#005377]" />
              )}
            </button>
          );
        })}
      </nav>

    </div>
  );
}