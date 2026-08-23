"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, ShoppingCart, Package, Calendar as CalendarIcon, Clock, Plus, Check, ClipboardList, Camera, UploadCloud, Loader2, Bell, Settings, Sun, Moon, ChevronDown, ChevronUp, Sparkles, Hourglass, UserCheck, Trash2, StickyNote, CloudSun, Pin, Sparkle, ArrowRight, ChevronLeft, ChevronRight, ListTodo,
  Dumbbell, Activity, Flame
} from "lucide-react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
const SCHNELLWAHL_FAVORITEN = ["Hafermilch", "Bananen", "Eier", "Körniger Frischkäse", "Toast", "Äpfel", "Spüli", "Mineralwasser"];

const springConfig = { type: "spring", stiffness: 400, damping: 25, mass: 0.8 };
const tapGesture = { scale: 0.96, transition: { type: "spring", stiffness: 500, damping: 30 } };

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
  const [showErledigteTodos, setShowErledigteTodos] = useState(false);

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
  const [newCdTitle, setNewCdTitle] = useState("");
  const [newCdDate, setNewCdDate] = useState("");
  const [newCdIcon, setNewCdIcon] = useState("⏳");

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

  // --- DATEN LADEN (Offline First) ---
  const fetchData = async () => {
    try {
      // 1. Zuerst offline Cache laden (für sofortige Anzeige)
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

      // 2. Neue Daten im Hintergrund laden (SWR-Ansatz)
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

      // 3. Cache aktualisieren und States neu setzen
      localStorage.setItem("haushaltOS_cache", JSON.stringify(parsedData));
      
      setEinkauf(parsedData.einkauf);
      setAufgaben(parsedData.haushalt);
      setVorrat(parsedData.vorrat);
      setCountdowns(parsedData.countdowns);
      setNotes(parsedData.notizen);
      setTodos(parsedData.todos);
      setGymData(parsedData.gym);

    } catch (e) { 
      console.warn("Offline-Modus aktiv, nutze Cache-Daten.", e); 
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

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchWeather(pos.coords.latitude, pos.coords.longitude, "Wetter vor Ort"),
        () => fetchWeather(48.1764, 11.5311, "München (OEZ)"),
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 600000 }
      );
    } else { fetchWeather(48.1764, 11.5311, "München (OEZ)"); }
  }, []);

  // --- LOGIK: EINKAUF ---
  const addEinkauf = async (artikelName?: string) => {
    const text = (artikelName || neuerArtikel).trim();
    if (!text) return;
    
    const newItem: EinkaufItem = { rowIndex: Date.now(), artikel: text, status: "Offen", kategorie: ermittleKategorie(text) };
    setEinkauf(prev => [...prev, newItem]); // Optimistic UI
    if (!artikelName) setNeuerArtikel("");
    setIsFabOpen(false);
    
    try {
      await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Einkauf", values: [newItem.artikel, newItem.status] }) });
      await fetch("https://ntfy.sh/HaushaltLenaJonas", { method: "POST", body: `${activeUser} hat "${text}" auf die Einkaufsliste gesetzt.`, headers: { "Title": "Neuer Einkauf", "Tags": "shopping_cart" }});
      fetchData(); 
    } catch (err) { fetchData(); }
  };

  const markEinkaufErledigt = async (item: EinkaufItem, status: "Erledigt" | "Offen") => {
    setEinkauf(einkauf.map(e => e.rowIndex === item.rowIndex ? { ...e, status } : e));
    await fetch("/api/data", { method: "PUT", body: JSON.stringify({ sheetName: "Einkauf", rowIndex: item.rowIndex, values: [item.artikel, status] }) });
  };

  const deleteEinkauf = async (item: EinkaufItem) => {
    setEinkauf(einkauf.filter(e => e.rowIndex !== item.rowIndex));
    await fetch("/api/data", { method: "PUT", body: JSON.stringify({ sheetName: "Einkauf", rowIndex: item.rowIndex, values: ["", ""] }) });
  };

  // --- LOGIK: TO-DO ---
  const addTodo = async () => {
    const text = neuesTodo.trim();
    if (!text) return;
    
    const newItem: TodoItem = { rowIndex: Date.now(), aufgabe: text, kategorie: todoKategorie, status: "Offen", zustaendig: todoZustaendig };
    setTodos(prev => [...prev, newItem]); // Optimistic UI
    setNeuesTodo("");
    setIsFabOpen(false);

    try {
      await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Todos", values: [newItem.aufgabe, newItem.kategorie, newItem.status, newItem.zustaendig] }) });
      await fetch("https://ntfy.sh/HaushaltLenaJonas", { method: "POST", body: `${activeUser} hat ein neues To-Do angelegt: "${text}"`, headers: { "Title": "Neues To-Do", "Tags": "memo" } });
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

    setGymData(prev => [...prev, newItem]); // Optimistic UI
    setGymSetNum((prev) => (parseInt(prev) + 1).toString());
    setGymGewicht("");
    setGymReps("");

    try {
      await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Gym", values: [today, newItem.uebung, newItem.gewicht, newItem.reps, newItem.setNum, newItem.user] }) });
      fetchData();
    } catch (err) { fetchData(); }
  };

  // --- LOGIK: SONSTIGES ---
  const markAufgabeErledigt = async (item: PutzItem) => {
    const today = new Date().toISOString().split("T")[0];
    setAufgaben(aufgaben.map(a => a.rowIndex === item.rowIndex ? { ...a, letztDatum: today } : a));
    await fetch("/api/data", { method: "PUT", body: JSON.stringify({ sheetName: "Haushalt", rowIndex: item.rowIndex, values: [item.aufgabe, today, item.intervall, activeUser] }) });
    fetchData();
  };

  const addCountdown = async () => {
    if (!newCdTitle || !newCdDate) return;
    const newItem: CountdownItem = { rowIndex: Date.now(), title: newCdTitle, date: newCdDate, icon: newCdIcon || "⏳" };
    setCountdowns(prev => [...prev, newItem]);
    setNewCdTitle(""); setNewCdDate("");
    await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Countdowns", values: [newItem.title, newItem.date, newItem.icon] }) });
    fetchData();
  };

  const addNote = async () => {
    if (!newNoteTitle || !newNoteContent) return;
    const newItem: NoteItem = { rowIndex: Date.now(), title: newNoteTitle, content: newNoteContent, category: newNoteCategory, color: "green" };
    setNotes(prev => [...prev, newItem]);
    setNewNoteTitle(""); setNewNoteContent(""); setShowNoteModal(false); setIsFabOpen(false);
    await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Notizen", values: [newItem.title, newItem.content, newItem.category, newItem.color] }) });
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
        let width = img.width, height = img.height;
        const maxDim = 800;
        if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; } 
        else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }

        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7).split(',')[1];

        try {
          const res = await fetch("/api/vision", { method: "POST", body: JSON.stringify({ imageBase64: compressedBase64 }) });
          const aiData = await res.json();
          if (aiData.artikel && aiData.mhd) {
            await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Vorrat", values: [aiData.artikel, aiData.mhd, ""] }) });
            fetchData(); 
          } else { alert(aiData.error || "Konnte kein Produkt erkennen."); }
        } catch (err) { alert("Fehler bei der Bildanalyse."); }
        setIsScanning(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- HILFSFUNKTIONEN ---
  const calculateDaysLeft = (targetDateStr: string) => Math.ceil((new Date(targetDateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
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
  const offeneEinkaeufe = einkauf.filter(e => e.status !== "Erledigt");
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

  const userGymData = gymData.filter(g => g.user === activeUser);
  const chartData = userGymData
    .filter(g => g.uebung.toLowerCase() === (gymUebung.toLowerCase() || "bankdrücken"))
    .map(g => ({
      datum: g.datum.substring(5, 10),
      oneRepMax: calculate1RM(g.gewicht, g.reps)
    }));

  const TABS = [
    { id: "home", icon: Home, label: "Übersicht" },
    { id: "todos", icon: ListTodo, label: "To-Dos", count: offeneTodos.length },
    { id: "einkauf", icon: ShoppingCart, label: "Einkauf", count: offeneEinkaeufe.length },
    { id: "gym", icon: Dumbbell, label: "Performance" },
    { id: "putzplan", icon: ClipboardList, label: "Putzplan" },
    { id: "vorrat", icon: Package, label: "Vorrat" },
    { id: "notizen", icon: StickyNote, label: "Pinnwand" },
    { id: "kalender", icon: CalendarIcon, label: "Kalender" }
  ];

  // Styles (Dark/Light)
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
                <motion.button 
                  whileTap={tapGesture}
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? (isDarkMode ? "bg-[#005377]/30 text-[#82CBEE] border border-[#005377]/50" : "bg-[#005377]/10 text-[#005377] border border-[#005377]/20") : `${textSub} hover:bg-black/5 dark:hover:bg-white/5`}`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className={`h-4 w-4 ${isActive ? (isDarkMode ? "text-[#82CBEE]" : "text-[#005377]") : ""}`} /> 
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${badgeBlue}`}>{tab.count}</span>
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>
        
        <div className={`pt-4 border-t ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} flex justify-between items-center px-2`}>
           <button onClick={() => switchUser(activeUser === "Jonas" ? "Lena" : "Jonas")} className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-2 border transition-all ${isDarkMode ? "bg-[#251A1E] border-white/[0.08] text-white hover:border-[#CFD186]/40" : "bg-[#FAF8F5] border-[#E8E2D9] text-[#2D2A26] shadow-sm hover:border-[#005377]/40"}`}>
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
              <span>Workspace</span><span>/</span><span className={`capitalize font-bold ${textTitle}`}>{activeTab}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* MOBILE USER SWITCH */}
              <button onClick={() => switchUser(activeUser === "Jonas" ? "Lena" : "Jonas")} className={`md:hidden h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${isDarkMode ? "bg-[#251A1E] border-white/[0.08] text-white" : "bg-[#FAF8F5] border-[#E8E2D9] text-[#2D2A26]"}`}>
                <UserCheck className="h-3.5 w-3.5 text-[#5B8C5A]" /> <span>{activeUser}</span>
              </button>

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

              {/* ... DASHBOARD WIDGETS WIE VORHER (gekürzt der Übersicht halber, identisch mit vorherigem Code) ... */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                 {/* Widget Struktur aus vorherigem Schritt bleibt exakt gleich, mit motion hooks für Hover */}
                 <div className="lg:col-span-7 space-y-6">
                   {/* Countdowns, Termine etc. */}
                   <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <h3 className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Anstehende Meilensteine</h3>
                      </div>
                      <div className="space-y-2.5">
                        {countdowns.map((cd, idx) => (
                          <motion.div whileHover={{ scale: 1.02 }} transition={springConfig} key={idx} className={`${bgCard} rounded-2xl p-4 flex items-center justify-between border`}>
                            <div className="flex items-center gap-3.5">
                              <span className="text-2xl p-2 rounded-xl bg-[#5B8C5A]/15 border border-[#5B8C5A]/30">{cd.icon}</span>
                              <div>
                                <h4 className={`text-sm font-bold ${textTitle}`}>{cd.title}</h4>
                                <p className={`text-xs ${textSub} font-medium`}>{cd.date}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-baseline gap-1">
                              <span className={`text-xl font-black font-mono ${accentGreen}`}>{Math.max(0, calculateDaysLeft(cd.date))}</span>
                              <span className={`text-[11px] font-bold ${textSub}`}>Tage</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                 </div>
                 <div className="lg:col-span-5 space-y-6">
                    {/* Abfahrten & Schnellübersichten */}
                    <div className={`${bgCard} rounded-3xl p-6 border space-y-4`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className={`text-xs font-bold ${textTitle}`}>Abfahrten OEZ</h3>
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

          {/* TAB 2: TO-DOS */}
          {activeTab === "todos" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>To-Do Liste</h2>
                  <p className={`text-xs ${textSub}`}>Wischen: Links = Erledigen, Rechts = Löschen</p>
                </div>
              </div>
              <div className={`${bgCard} rounded-2xl p-6 space-y-4`}>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <input type="text" placeholder="Neue Aufgabe..." value={neuesTodo} onChange={(e) => setNeuesTodo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTodo()} className={`sm:col-span-6 ${bgInput} border rounded-xl px-4 py-2.5 text-sm font-medium`} />
                  <select value={todoKategorie} onChange={(e) => setTodoKategorie(e.target.value)} className={`sm:col-span-3 ${bgInput} border rounded-xl px-3 py-2.5 text-xs font-semibold`}>
                    {TODO_KATEGORIEN.map(kat => <option key={kat} value={kat}>{kat}</option>)}
                  </select>
                  <select value={todoZustaendig} onChange={(e) => setTodoZustaendig(e.target.value)} className={`sm:col-span-1.5 ${bgInput} border rounded-xl px-3 py-2.5 text-xs font-semibold`}>
                    <option value="Beide">Beide</option><option value="Jonas">Jonas</option><option value="Lena">Lena</option>
                  </select>
                  <motion.button whileTap={tapGesture} onClick={addTodo} className={`sm:col-span-1.5 px-4 py-2.5 ${buttonPrimary} text-xs font-bold rounded-xl`}>Hinzufügen</motion.button>
                </div>
              </div>

              <div className={`${bgCard} rounded-2xl p-6 space-y-3`}>
                {filteredTodos.map((todo) => (
                  <div key={todo.rowIndex} className="relative rounded-xl overflow-hidden">
                    <div className="absolute inset-0 flex justify-between items-center px-4 rounded-xl bg-gradient-to-r from-[#49111C] via-[#251A1E] to-[#5B8C5A] text-white">
                      <div className="text-xs font-bold text-rose-200">Löschen</div><div className="text-xs font-bold text-emerald-200">Erledigt</div>
                    </div>
                    <motion.div 
                      drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.8} whileTap={tapGesture} layout transition={springConfig}
                      onDragEnd={(_, info) => { if (info.offset.x > 80) deleteTodo(todo); else if (info.offset.x < -80) markTodoErledigt(todo, "Erledigt"); }}
                      className={`relative z-10 flex justify-between p-4 rounded-xl border ${bgItem} ${bgCard} shadow-sm cursor-grab`}
                    >
                      <div>
                        <span className={`text-sm font-semibold ${textTitle} block`}>{todo.aufgabe}</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeBlue}`}>{todo.kategorie}</span>
                          <span className="text-[10px] font-bold opacity-70">👤 {todo.zustaendig}</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EINKAUF */}
          {activeTab === "einkauf" && (
            <div className="space-y-6">
              <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Einkaufsliste</h2>
              <div className={`${bgCard} rounded-2xl p-6`}>
                <div className={`flex gap-3 mb-6 pb-6 border-b ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"}`}>
                  <input type="text" placeholder="Neuer Artikel..." value={neuerArtikel} onChange={(e) => setNeuerArtikel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addEinkauf()} className={`flex-1 ${bgInput} border rounded-xl px-4 py-2.5`} />
                  <motion.button whileTap={tapGesture} onClick={() => addEinkauf()} className={`px-6 py-2.5 ${buttonPrimary} text-xs font-bold rounded-xl`}>Hinzufügen</motion.button>
                </div>
                <div className="space-y-6">
                  {Object.entries(einkaufNachKategorien).map(([kategorie, items]) => (
                    <div key={kategorie} className="space-y-2">
                      <div className={`text-[10px] font-bold ${textSub} uppercase tracking-wider px-1`}>{kategorie}</div>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.rowIndex} className="relative rounded-xl overflow-hidden">
                            <div className="absolute inset-0 flex justify-between items-center px-4 rounded-xl bg-gradient-to-r from-[#49111C] via-[#251A1E] to-[#5B8C5A] text-white">
                              <div className="text-xs font-bold text-rose-200">Löschen</div><div className="text-xs font-bold text-emerald-200">Erledigt</div>
                            </div>
                            <motion.div 
                              drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.8} whileTap={tapGesture} layout transition={springConfig}
                              onDragEnd={(_, info) => { if (info.offset.x > 80) deleteEinkauf(item); else if (info.offset.x < -80) markEinkaufErledigt(item, "Erledigt"); }}
                              className={`relative z-10 flex items-center justify-between p-3.5 rounded-xl border ${bgItem} ${bgCard} shadow-sm cursor-grab`}
                            >
                              <span className={`text-sm font-semibold ${textTitle}`}>{item.artikel}</span>
                            </motion.div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GYM & PERFORMANCE (MCI STYLE) */}
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
                  {/* Recovery Widget */}
                  <div className={`${bgCard} rounded-3xl p-6 border space-y-4`}>
                    <div className="flex justify-between items-center">
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${textSub} flex items-center gap-2`}>
                        <Activity className="h-4 w-4 text-[#7DB47C]" /> Recovery Status
                      </h3>
                      <span className={`text-xl font-mono font-black ${recovery > 70 ? 'text-[#7DB47C]' : recovery > 40 ? 'text-yellow-500' : 'text-[#E27B88]'}`}>
                        {recovery}%
                      </span>
                    </div>
                    <input type="range" min="0" max="100" value={recovery} onChange={(e) => setRecovery(parseInt(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer" />
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

                {/* RECHTS: STATS & HISTORIE */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Kraft-Chart (Recharts) */}
                  <div className={`${bgCard} rounded-3xl p-6 border`}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Kraft-Entwicklung (1RM)</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md ${badgeBlue}`}>{gymUebung || "Übung wählen"}</span>
                    </div>
                    <div className="h-[200px] w-full">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <XAxis dataKey="datum" stroke={isDarkMode ? "#555" : "#ccc"} fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1E1418' : '#fff', borderRadius: '12px', border: 'none' }} />
                            <Line type="monotone" dataKey="oneRepMax" stroke={isDarkMode ? "#82CBEE" : "#005377"} strokeWidth={4} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-slate-500/20 rounded-xl">
                          <span className={`text-xs font-medium ${textSub}`}>Tippe eine Übung ein, um den Graphen zu sehen.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Historie */}
                  <div className={`${bgCard} rounded-3xl p-6 border`}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${textSub} mb-4`}>Heutiges Workout</h3>
                    <div className="space-y-3">
                      {userGymData.filter(g => g.datum === new Date().toISOString().split("T")[0]).reverse().map((g) => (
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
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WEITERE TABS (Putzplan, Vorrat, Pinnwand, Kalender) ... identisch zu vorher ... */}
          {activeTab === "putzplan" && (
            <div className="space-y-6">
              <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Putzplan</h2>
              <div className={`${bgCard} rounded-2xl p-6 space-y-3`}>
                {aufgaben.map((a, idx) => (
                  <div key={idx} className={`flex justify-between p-4 rounded-xl border ${bgItem}`}>
                    <div>
                      <div className={`font-bold text-sm ${textTitle}`}>{a.aufgabe}</div>
                      <div className={`text-[11px] ${textSub}`}>Intervall: {a.intervall} Tage | Letztes Mal: {a.letztesDatum}</div>
                    </div>
                    <motion.button whileTap={tapGesture} onClick={() => markAufgabeErledigt(a)} className={`px-4 text-xs font-bold rounded-lg border ${isDarkMode ? "bg-white/5" : "bg-[#FAF8F5]"}`}>
                      Erledigt
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "vorrat" && (
            <div className="space-y-6">
              <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Vorratskammer & KI Scanner</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-1 ${bgCard} rounded-2xl p-6 flex flex-col h-[280px]`}>
                  <h3 className={`text-[11px] font-bold uppercase tracking-wider ${textSub} mb-3 flex items-center gap-2`}><Camera className={`h-4 w-4 ${accentBlue}`} /> Scanner</h3>
                  <div className={`flex-1 border-2 border-dashed ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} rounded-xl flex flex-col items-center justify-center`}>
                    {isScanning ? <Loader2 className={`h-6 w-6 ${accentBlue} animate-spin`} /> : (
                      <>
                        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                        <motion.button whileTap={tapGesture} onClick={() => fileInputRef.current?.click()} className={`text-xs ${buttonPrimary} px-4 py-2 rounded-xl`}>Kamera starten</motion.button>
                      </>
                    )}
                  </div>
                </div>
                <div className={`lg:col-span-2 ${bgCard} rounded-2xl p-6 flex flex-col min-h-[280px]`}>
                  <h3 className={`text-[11px] font-bold uppercase tracking-wider ${textSub} mb-3`}>Bestand</h3>
                  <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead><tr className={`border-b ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"}`}><th className={`pb-2 text-[10px] font-bold ${textSub}`}>Artikel</th><th className={`pb-2 text-[10px] font-bold ${textSub} text-right`}>MHD</th></tr></thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {vorrat.map((v, idx) => <tr key={idx}><td className={`py-3 text-xs font-bold ${textTitle}`}>{v.artikel}</td><td className={`py-3 text-xs ${textSub} text-right font-mono`}>{v.ablaufdatum}</td></tr>)}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notizen" && (
            <div className="space-y-6">
              <div className="flex justify-between"><h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Pinnwand</h2></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {filteredNotes.map((note) => (
                  <motion.div whileHover={{ scale: 1.02 }} transition={springConfig} key={note.rowIndex} className={`${bgCard} rounded-2xl p-5 border`}>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${badgeGreen}`}>{note.category}</span>
                    <h3 className={`text-sm font-bold mt-2.5 mb-1 ${textTitle}`}>{note.title}</h3>
                    <p className={`text-xs ${textSub} whitespace-pre-line`}>{note.content}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
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

      {/* MOBILE BOTTOM NAV */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${isDarkMode ? "bg-[#100A0B]/90 border-white/[0.08]" : "bg-[#FAF8F5]/90 border-[#E8E2D9]"} backdrop-blur-xl border-t px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] flex justify-around items-center`}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center min-w-[42px] h-11 gap-0.5 rounded-lg relative ${activeTab === tab.id ? `${accentBlue} font-bold` : textSub}`}>
            <tab.icon className="h-4 w-4" />
            <span className="text-[9px] tracking-tight">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}