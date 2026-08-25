"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  ShoppingCart,
  Package,
  Calendar as CalendarIcon,
  Plus,
  Check,
  ClipboardList,
  Camera,
  Loader2,
  Bell,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sparkle,
  UserCheck,
  Trash2,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Dumbbell,
  Activity
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

import {
  Departure,
  CalendarEvent,
  TodoItem,
  EinkaufItem,
  PutzItem,
  VorratItem,
  CountdownItem,
  NoteItem,
  EINKAUF_KATEGORIEN,
  TODO_KATEGORIEN,
  SCHNELLWAHL_FAVORITEN
} from "../types";
import { ermittleKategorie, formatDauer, calculateDaysLeft } from "../lib/mciEngine";

import { useWeather } from "../hooks/useWeather";
import { useSupabaseData } from "../hooks/useSupabaseData";
import { useWorkoutSession } from "../hooks/useWorkoutSession";
import { ActiveWorkoutView, GymDashboardView } from "../components/GymViews";

const springConfig = { type: "spring" as const, stiffness: 400, damping: 25, mass: 0.8 };
const tapGesture = {
  scale: 0.96,
  transition: { type: "spring" as const, stiffness: 500, damping: 30 }
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeUser, setActiveUser] = useState<"Jonas" | "Lena">("Jonas");
  const [isFabOpen, setIsFabOpen] = useState(false);

  const [departures, setDepartures] = useState<Departure[]>([]);
  const [calendarMode, setCalendarMode] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [termine, setTermine] = useState<CalendarEvent[]>([]);

  // 1. Daten über Custom Hooks laden
  const { weather, weatherTip, locationName } = useWeather();
  const {
    todos,
    setTodos,
    einkauf,
    setEinkauf,
    gymData,
    setGymData,
    aufgaben,
    setAufgaben,
    vorrat,
    setVorrat,
    countdowns,
    setCountdowns,
    notes,
    setNotes
  } = useSupabaseData();

  // 2. Workout-Session-Hook für die Gym-Performance
  const workout = useWorkoutSession(activeUser, gymData, setGymData);

  const [neuerArtikel, setNeuerArtikel] = useState("");
  const [einkaufFuer, setEinkaufFuer] = useState<string>("Beide");
  const [neuesTodo, setNeuesTodo] = useState("");
  const [todoKategorie, setTodoKategorie] = useState<string>("Haushalt & Reparatur");
  const [todoZustaendig, setTodoZustaendig] = useState<string>("Beide");
  const [activeTodoFilter, setActiveTodoFilter] = useState<string>("Alle");

  const [activeNoteCategory, setActiveNoteCategory] = useState<string>("Alle");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("Allgemein");

  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date());

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        let width = img.width,
          height = img.height;
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
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
        try {
          const res = await fetch("/api/vision", {
            method: "POST",
            body: JSON.stringify({ imageBase64: compressedBase64 })
          });
          const aiData = await res.json();
          if (aiData.artikel && aiData.mhd) {
            const newItem: VorratItem = {
              id: crypto.randomUUID(),
              artikel: aiData.artikel,
              ablaufdatum: aiData.mhd,
              anbruch: ""
            };
            setVorrat((prev) => [...prev, newItem]);
            await supabase.from("vorrat").insert(newItem);
          } else {
            alert(aiData.error || "Konnte kein Produkt erkennen.");
          }
        } catch (err) {
          alert("Fehler bei der Bildanalyse.");
        }
        setIsScanning(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("haushalt_theme");
    if (savedTheme === "dark") setIsDarkMode(true);
    const savedUser = localStorage.getItem("haushalt_user") as "Jonas" | "Lena" | null;
    if (savedUser) setActiveUser(savedUser);
  }, []);

  useEffect(() => {
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((data) => setTermine(data.events || []))
      .catch(() => {});
    fetch("https://www.mvg.de/api/bgw-pt/v3/departures?globalId=de:09162:70")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data))
          setDepartures(
            data
              .slice(0, 5)
              .map((d: any) => ({
                line: d.label || "U",
                destination: d.destination || "Unbekannt",
                time: new Date(
                  d.realtimeDepartureTime || d.plannedDepartureTime
                ).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
              }))
          );
      })
      .catch(() => {});
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

  const addEinkauf = async (artikelName?: string) => {
    const text = (artikelName || neuerArtikel).trim();
    if (!text) return;
    const targetUser = artikelName ? "Beide" : einkaufFuer;
    const newItem: EinkaufItem = {
      id: crypto.randomUUID(),
      artikel: text,
      status: "Offen",
      kategorie: ermittleKategorie(text),
      fuer: targetUser
    };
    setEinkauf((prev) => [...prev, newItem]);
    if (!artikelName) setNeuerArtikel("");
    setIsFabOpen(false);
    await supabase.from("einkauf").insert(newItem);
    if (targetUser !== activeUser)
      fetch("https://ntfy.sh/HaushaltLenaJonas", {
        method: "POST",
        body: `${activeUser} hat "${text}" auf die Einkaufsliste gesetzt (${targetUser}).`,
        headers: { Title: "Neuer Einkauf", Tags: "shopping_cart" }
      });
  };

  const markEinkaufErledigt = async (item: EinkaufItem, status: "Erledigt" | "Offen") => {
    setEinkauf((prev) => prev.map((e) => (e.id === item.id ? { ...e, status } : e)));
    await supabase.from("einkauf").update({ status }).eq("id", item.id);
  };
  const deleteEinkauf = async (item: EinkaufItem) => {
    setEinkauf((prev) => prev.filter((e) => e.id !== item.id));
    await supabase.from("einkauf").delete().eq("id", item.id);
  };

  const addTodo = async () => {
    const text = neuesTodo.trim();
    if (!text) return;
    const newItem: TodoItem = {
      id: crypto.randomUUID(),
      aufgabe: text,
      kategorie: todoKategorie,
      status: "Offen",
      zustaendig: todoZustaendig
    };
    setTodos((prev) => [...prev, newItem]);
    setNeuesTodo("");
    setIsFabOpen(false);
    await supabase.from("todos").insert(newItem);
    if (todoZustaendig !== activeUser) {
      const appUrl =
        typeof window !== "undefined" ? window.location.origin : "https://haushaltos.vercel.app";
      fetch("https://ntfy.sh/HaushaltLenaJonas", {
        method: "POST",
        body: `${activeUser} hat ein neues To-Do angelegt: "${text}" (${todoZustaendig})`,
        headers: {
          Title: "Neues To-Do",
          Tags: "memo",
          Actions: `http, ✅ Erledigen, ${appUrl}/api/action, method=POST, body='{"type":"todo","id":"${newItem.id}","action":"erledigt"}', clear=true`
        }
      });
    }
  };

  const markTodoErledigt = async (item: TodoItem, status: "Erledigt" | "Offen") => {
    setTodos((prev) => prev.map((t) => (t.id === item.id ? { ...t, status } : t)));
    await supabase.from("todos").update({ status }).eq("id", item.id);
    if (status === "Erledigt")
      fetch("https://ntfy.sh/HaushaltLenaJonas", {
        method: "POST",
        body: `✅ ${activeUser} hat die Aufgabe "${item.aufgabe}" erledigt!`,
        headers: { Title: "To-Do erledigt", Tags: "white_check_mark" }
      });
  };
  const deleteTodo = async (item: TodoItem) => {
    setTodos((prev) => prev.filter((t) => t.id !== item.id));
    await supabase.from("todos").delete().eq("id", item.id);
  };

  const markAufgabeErledigt = async (item: PutzItem) => {
    const today = new Date().toISOString().split("T")[0];
    setAufgaben((prev) => prev.map((a) => (a.id === item.id ? { ...a, letztes_datum: today } : a)));
    await supabase.from("haushalt").update({ letztes_datum: today }).eq("id", item.id);
  };
  const addNote = async () => {
    if (!newNoteTitle || !newNoteContent) return;
    const newItem: NoteItem = {
      id: crypto.randomUUID(),
      title: newNoteTitle,
      content: newNoteContent,
      category: newNoteCategory,
      color: "green"
    };
    setNotes((prev) => [...prev, newItem]);
    setNewNoteTitle("");
    setNewNoteContent("");
    setShowNoteModal(false);
    setIsFabOpen(false);
    await supabase.from("notizen").insert(newItem);
  };

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
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    const isoStr = `${y}-${m}-${d}`;
    const gerStr = `${d}.${m}.`;
    const iEvents = termine
      .filter((t) => t.date.includes(isoStr) || t.date.includes(gerStr))
      .map((t) => ({ title: t.title, type: "termin" as const }));
    const pEvents: { title: string; type: "putz" }[] = [];
    aufgaben.forEach((a) => {
      if (!a.letztes_datum || !a.intervall) return;
      const dueDate = new Date(a.letztes_datum);
      dueDate.setDate(dueDate.getDate() + parseInt(a.intervall, 10));
      if (dueDate.toDateString() === dateObj.toDateString())
        pEvents.push({ title: `🧹 ${a.aufgabe}`, type: "putz" });
    });
    return [...iEvents, ...pEvents];
  };

  const offeneEinkaeufe = einkauf.filter((e) => e.status !== "Erledigt");
  const offeneTodos = todos.filter((t) => t.status !== "Erledigt");
  const filteredTodos =
    activeTodoFilter === "Alle"
      ? offeneTodos
      : offeneTodos.filter(
          (t) => t.kategorie === activeTodoFilter || t.zustaendig === activeTodoFilter
        );
  const einkaufNachKategorien = EINKAUF_KATEGORIEN.reduce(
    (acc, kat) => {
      const items = offeneEinkaeufe.filter(
        (i) => (i.kategorie || ermittleKategorie(i.artikel)) === kat
      );
      if (items.length > 0) acc[kat] = items;
      return acc;
    },
    {} as Record<string, EinkaufItem[]>
  );
  const noteCategories = ["Alle", ...Array.from(new Set(notes.map((n) => n.category)))];
  const filteredNotes =
    activeNoteCategory === "Alle" ? notes : notes.filter((n) => n.category === activeNoteCategory);

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

  const themeProps = {
    bgMain: isDarkMode ? "bg-[#100A0B] text-[#EDE7E3]" : "bg-[#FAF8F5] text-[#2D2A26]",
    bgSidebar: isDarkMode ? "bg-[#180F12] border-white/[0.08]" : "bg-[#FFFFFF] border-[#E8E2D9]",
    bgCard: isDarkMode
      ? "bg-[#1E1418] border border-white/[0.08] text-[#FAF8F5] shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
      : "bg-[#FFFFFF] border border-[#E8E2D9] shadow-[0_2px_8px_rgba(80,36,25,0.04)] text-[#2D2A26]",
    bgInput: isDarkMode
      ? "bg-[#140C0E] border-white/[0.1] text-white focus:border-[#CFD186]"
      : "bg-[#FAF8F5] border-[#E8E2D9] text-[#2D2A26] focus:border-[#005377]",
    bgItem: isDarkMode ? "bg-[#251A1E] border-white/[0.05]" : "bg-[#F7F4EF] border-[#E8E2D9]",
    textTitle: isDarkMode ? "text-[#FAF8F5]" : "text-[#2D2A26]",
    textSub: isDarkMode ? "text-[#A89F91]" : "text-[#7A7265]",
    accentBlue: isDarkMode ? "text-[#82CBEE]" : "text-[#005377]",
    accentGreen: isDarkMode ? "text-[#7DB47C]" : "text-[#5B8C5A]",
    badgeGreen: isDarkMode
      ? "bg-[#5B8C5A]/20 text-[#9ED09D] border border-[#5B8C5A]/40"
      : "bg-[#5B8C5A]/15 text-[#2C522B] border border-[#5B8C5A]/30",
    badgeBlue: isDarkMode
      ? "bg-[#005377]/30 text-[#6BB9E0] border border-[#005377]/50"
      : "bg-[#005377]/10 text-[#005377] border border-[#005377]/25",
    buttonPrimary: isDarkMode
      ? "bg-[#005377] hover:bg-[#006894] text-white"
      : "bg-[#005377] hover:bg-[#00415E] text-white shadow-sm",
    isDarkMode
  };

  const {
    bgMain,
    bgSidebar,
    bgCard,
    bgInput,
    bgItem,
    textTitle,
    textSub,
    accentBlue,
    accentGreen,
    badgeGreen,
    badgeBlue,
    buttonPrimary
  } = themeProps;

  // Render Active Workout Fullscreen (wurde in GymViews ausgelagert)
  if (workout.isWorkoutActive && !workout.isWorkoutMinimized) {
    return (
      <ActiveWorkoutView
        activeUser={activeUser}
        gymData={gymData}
        workout={workout}
        theme={themeProps}
      />
    );
  }

  return (
    <div
      className={`flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden ${bgMain} relative font-sans transition-colors duration-300`}
    >
      <aside
        className={`hidden w-64 md:flex ${bgSidebar} z-20 h-full flex-col justify-between border-r p-4`}
      >
        <div>
          <div className="mb-4 flex items-center gap-3 px-3 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#005377] shadow-md shadow-[#005377]/20">
              <Sparkles className="h-4 w-4 text-[#CFD186]" />
            </div>
            <div>
              <span className={`text-sm font-bold tracking-tight ${textTitle} block leading-none`}>
                Haushalt OS
              </span>
              <span className={`text-[10px] ${textSub} font-medium`}>Workspace Jonas & Lena</span>
            </div>
          </div>
          <nav className="space-y-1">
            <div
              className={`px-3 text-[10px] font-bold ${textSub} mt-4 mb-2 tracking-wider uppercase`}
            >
              Navigation
            </div>
            {TABS.map((tab) => (
              <motion.button
                whileTap={tapGesture}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${activeTab === tab.id ? (isDarkMode ? "border border-[#005377]/50 bg-[#005377]/30 text-[#82CBEE]" : "border border-[#005377]/20 bg-[#005377]/10 text-[#005377]") : `${textSub} hover:bg-black/5 dark:hover:bg-white/5`}`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? accentBlue : ""}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`py-0.2 rounded-md px-1.5 font-mono text-[10px] font-bold ${badgeBlue}`}
                  >
                    {tab.count}
                  </span>
                )}
              </motion.button>
            ))}
          </nav>
        </div>
        <div
          className={`border-t pt-4 ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} flex items-center justify-between px-2`}
        >
          <button
            onClick={() => switchUser(activeUser === "Jonas" ? "Lena" : "Jonas")}
            className={`flex h-8 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition-all ${isDarkMode ? "border-white/[0.08] bg-[#251A1E] text-white hover:border-[#CFD186]/40" : "border-[#E8E2D9] bg-[#FAF8F5] text-[#2D2A26] shadow-sm hover:border-[#005377]/40"}`}
          >
            <UserCheck className={`h-3.5 w-3.5 ${accentGreen}`} /> {activeUser}
          </button>
          <button onClick={toggleTheme} className={`${textSub} hover:text-[#005377]`}>
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <main className="relative z-10 flex h-full flex-1 flex-col overflow-y-auto">
        <header
          className={`sticky top-0 z-30 ${isDarkMode ? "border-white/[0.08] bg-[#100A0B]/85" : "border-[#E8E2D9] bg-[#FAF8F5]/85"} border-b pt-[env(safe-area-inset-top)] backdrop-blur-md transition-colors duration-300`}
        >
          <div className="flex h-14 items-center justify-between px-4 md:px-8">
            <div className={`flex items-center gap-2 text-xs ${textSub} font-medium tracking-wide`}>
              <span>Workspace</span>
              <span>/</span>
              <span className={`font-bold capitalize ${textTitle}`}>{activeTab}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => switchUser(activeUser === "Jonas" ? "Lena" : "Jonas")}
                className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition-all md:hidden ${isDarkMode ? "border-white/[0.08] bg-[#251A1E] text-white" : "border-[#E8E2D9] bg-[#FAF8F5] text-[#2D2A26]"}`}
              >
                <UserCheck className={`h-3.5 w-3.5 ${accentGreen}`} /> <span>{activeUser}</span>
              </button>
              <button
                onClick={toggleTheme}
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgCard} transition-transform active:scale-95`}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-[#CFD186]" />
                ) : (
                  <Moon className="h-4 w-4 text-[#49111C]" />
                )}
              </button>
              <button className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgCard}`}>
                <Bell className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1400px] space-y-5 p-3.5 pb-[calc(env(safe-area-inset-bottom)+7rem)] md:space-y-8 md:p-8">
          {/* Gym Tab ist jetzt extrem kompakt weil komplett in GymViews ausgelagert */}
          {activeTab === "gym" && !workout.isWorkoutActive && (
            <GymDashboardView
              activeUser={activeUser}
              gymData={gymData}
              workout={workout}
              theme={themeProps}
            />
          )}

          {activeTab === "home" && (
            <div className="space-y-8">
              <div className="flex flex-col justify-between gap-4 border-b border-[#E8E2D9] pb-2 md:flex-row md:items-end dark:border-white/[0.08]">
                <div>
                  <div
                    className={`flex items-center gap-2 text-xs font-bold tracking-wider uppercase ${accentGreen} mb-1`}
                  >
                    <Sparkle className="h-3.5 w-3.5 fill-current" /> {todayStr}
                  </div>
                  <h1 className={`text-3xl font-extrabold tracking-tight md:text-4xl ${textTitle}`}>
                    Guten Tag, {activeUser}!
                  </h1>
                </div>
                {/* Wetter- & Outfit-Empfehlungs-Kachel */}
                <div className={`rounded-2xl border p-4 ${bgCard} flex items-center gap-3`}>
                  <div className="shrink-0 text-2xl">💡</div>
                  <div>
                    <span
                      className={`text-[10px] font-bold tracking-wider uppercase ${textSub} block`}
                    >
                      Tages- & Outfit-Empfehlung ({locationName})
                    </span>
                    <p className={`text-xs font-semibold ${textTitle} mt-0.5`}>{weatherTip}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-base leading-none font-extrabold ${textTitle}`}>
                    {weather}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${badgeGreen}`}>
                    {locationName}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-7">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                        Meilensteine
                      </h3>
                      <span
                        className={`text-xs ${accentBlue} cursor-pointer font-semibold`}
                        onClick={() => setActiveTab("kalender")}
                      >
                        Verwalten &gt;
                      </span>
                    </div>
                    {countdowns.length > 0 ? (
                      <div className="space-y-2.5">
                        {countdowns.map((cd, idx) => (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            transition={springConfig}
                            key={idx}
                            className={`${bgCard} relative flex items-center justify-between overflow-hidden rounded-2xl border p-3 md:p-4`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="shrink-0 rounded-xl border border-[#5B8C5A]/30 bg-[#5B8C5A]/15 p-1.5 text-xl md:p-2 md:text-2xl">
                                {cd.icon}
                              </span>
                              <div className="truncate">
                                <h4
                                  className={`text-xs font-bold md:text-sm ${textTitle} truncate`}
                                >
                                  {cd.title}
                                </h4>
                                <p className={`text-[10px] md:text-xs ${textSub} font-medium`}>
                                  {cd.date}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-baseline gap-1 text-right">
                              <span
                                className={`font-mono text-lg font-black md:text-xl ${accentGreen}`}
                              >
                                {Math.max(0, calculateDaysLeft(cd.date))}
                              </span>
                              <span className={`text-[10px] font-bold md:text-[11px] ${textSub}`}>
                                Tage
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`${bgCard} rounded-2xl border p-6 text-center text-xs ${textSub}`}
                      >
                        Keine Meilensteine eingetragen.
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between px-1">
                      <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                        Termine & Putzplan
                      </h3>
                      <span className={`text-[10px] ${textSub}`}>System OS</span>
                    </div>
                    <div className={`${bgCard} space-y-3 rounded-3xl border p-6`}>
                      {termine.slice(0, 4).map((t, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between rounded-2xl border p-3 ${bgItem} gap-4`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-[#005377]" />
                            <span
                              className={`text-xs font-bold ${textTitle} max-w-[220px] truncate sm:max-w-none`}
                            >
                              {t.title}
                            </span>
                          </div>
                          <span
                            className={`font-mono text-[10px] font-bold ${badgeBlue} shrink-0 rounded-lg px-2.5 py-1`}
                          >
                            {t.date}
                          </span>
                        </div>
                      ))}
                      {termine.length === 0 && (
                        <p className={`text-xs ${textSub} py-4 text-center`}>
                          Keine Termine synchronisiert.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-6 lg:col-span-5">
                  <div className="space-y-3">
                    <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub} px-1`}>
                      Schnellübersicht
                    </h3>
                    <div
                      onClick={() => setActiveTab("todos")}
                      className={`${bgCard} group cursor-pointer rounded-3xl border p-5 transition-all hover:border-[#005377]/50`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ListTodo className={`h-4 w-4 ${accentBlue}`} />
                          <span className={`text-xs font-bold ${textTitle}`}>To-Do Liste</span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeBlue}`}
                        >
                          {offeneTodos.length} offen
                        </span>
                      </div>
                      <div className="mb-3 space-y-1.5">
                        {offeneTodos.slice(0, 3).map((item, i) => (
                          <div
                            key={i}
                            className={`text-xs ${textSub} flex items-center justify-between gap-2`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="h-1 w-1 rounded-full bg-[#005377]" />
                              <span className="truncate">{item.aufgabe}</span>
                            </div>
                            <span className="shrink-0 font-mono text-[10px] font-medium opacity-70">
                              {item.zustaendig}
                            </span>
                          </div>
                        ))}
                        {offeneTodos.length === 0 && (
                          <span className={`text-xs ${textSub}`}>Keine offenen To-Dos! 🎉</span>
                        )}
                      </div>
                    </div>
                    <div
                      onClick={() => setActiveTab("einkauf")}
                      className={`${bgCard} group cursor-pointer rounded-3xl border p-5 transition-all hover:border-[#5B8C5A]/50`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className={`h-4 w-4 ${accentGreen}`} />
                          <span className={`text-xs font-bold ${textTitle}`}>Einkaufsliste</span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeGreen}`}
                        >
                          {offeneEinkaeufe.length} offen
                        </span>
                      </div>
                      <div className="mb-3 space-y-1.5">
                        {offeneEinkaeufe.slice(0, 2).map((item, i) => (
                          <div key={i} className={`text-xs ${textSub} flex items-center gap-2`}>
                            <span className="h-1 w-1 rounded-full bg-slate-400" />
                            <span className="truncate">{item.artikel}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={`${bgCard} space-y-4 rounded-3xl border p-6`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`text-xs font-bold ${textTitle}`}>Abfahrten Erfurt</h3>
                        <p className={`text-[10px] ${textSub}`}>Live</p>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${badgeBlue}`}
                      >
                        LIVE
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {departures.slice(0, 3).map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${badgeBlue}`}
                            >
                              {d.line}
                            </span>
                            <span className={`max-w-[120px] truncate font-semibold ${textTitle}`}>
                              {d.destination}
                            </span>
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

          {activeTab === "todos" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>To-Do Liste</h2>
                  <p className={`text-xs ${textSub}`}>
                    Wischen: Links = Erledigen, Rechts = Löschen
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 font-mono text-xs font-bold ${badgeBlue}`}>
                  {offeneTodos.length} offen
                </span>
              </div>

              <div className={`${bgCard} space-y-4 rounded-2xl p-6`}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <input
                    type="text"
                    placeholder="Neue Aufgabe..."
                    value={neuesTodo}
                    onChange={(e) => setNeuesTodo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTodo()}
                    className={`w-full sm:col-span-6 ${bgInput} rounded-xl border px-4 py-2.5 text-sm font-medium focus:outline-none`}
                  />
                  <select
                    value={todoKategorie}
                    onChange={(e) => setTodoKategorie(e.target.value)}
                    className={`w-full sm:col-span-3 ${bgInput} rounded-xl border px-3 py-2.5 text-xs font-semibold focus:outline-none`}
                  >
                    {TODO_KATEGORIEN.map((kat) => (
                      <option key={kat} value={kat}>
                        {kat}
                      </option>
                    ))}
                  </select>
                  <select
                    value={todoZustaendig}
                    onChange={(e) => setTodoZustaendig(e.target.value)}
                    className={`sm:col-span-1.5 w-full ${bgInput} rounded-xl border px-3 py-2.5 text-xs font-semibold focus:outline-none`}
                  >
                    <option value="Beide">Beide</option>
                    <option value="Jonas">Jonas</option>
                    <option value="Lena">Lena</option>
                  </select>
                  <motion.button
                    whileTap={tapGesture}
                    onClick={addTodo}
                    className={`sm:col-span-1.5 w-full px-4 py-2.5 ${buttonPrimary} flex items-center justify-center rounded-xl text-xs font-bold`}
                  >
                    Hinzufügen
                  </motion.button>
                </div>

                <div className="scrollbar-hide flex gap-2 overflow-x-auto pt-2 pb-1">
                  {["Alle", ...TODO_KATEGORIEN, "Jonas", "Lena", "Beide"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveTodoFilter(filter)}
                      className={`rounded-xl px-3 py-1 text-xs font-bold whitespace-nowrap transition-all ${activeTodoFilter === filter ? `${badgeBlue} shadow-sm` : `${bgItem} ${textSub}`}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${bgCard} space-y-3 rounded-2xl p-6`}>
                {filteredTodos.map((todo) => (
                  <div key={todo.id} className="relative overflow-hidden rounded-xl">
                    <div className="absolute inset-0 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#49111C] via-[#251A1E] to-[#5B8C5A] px-4 text-white">
                      <div className="flex items-center gap-1 text-xs font-bold text-rose-200">
                        <Trash2 className="h-4 w-4" /> Löschen
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-200">
                        Erledigt <Check className="h-4 w-4" />
                      </div>
                    </div>
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.8}
                      whileTap={tapGesture}
                      layout
                      transition={springConfig}
                      onDragEnd={(_, info) => {
                        const isSwipeRight = info.offset.x > 80 || info.velocity.x > 500;
                        const isSwipeLeft = info.offset.x < -80 || info.velocity.x < -500;
                        if (isSwipeRight) deleteTodo(todo);
                        else if (isSwipeLeft) markTodoErledigt(todo, "Erledigt");
                      }}
                      className={`relative z-10 flex justify-between rounded-xl border p-4 ${bgItem} ${bgCard} cursor-grab shadow-sm`}
                    >
                      <div>
                        <span className={`text-sm font-semibold ${textTitle} block`}>
                          {todo.aufgabe}
                        </span>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${badgeBlue}`}
                          >
                            {todo.kategorie}
                          </span>
                          <span className="text-[10px] font-bold opacity-70">
                            👤 {todo.zustaendig}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => markTodoErledigt(todo, "Erledigt")}
                          className={`h-7 rounded-lg px-3 text-[11px] font-bold ${badgeGreen} flex items-center gap-1 hover:opacity-80`}
                        >
                          <Check className="h-3.5 w-3.5" /> <span>Erledigen</span>
                        </button>
                      </div>
                    </motion.div>
                  </div>
                ))}
                {filteredTodos.length === 0 && (
                  <div className={`p-6 text-center text-xs ${textSub}`}>
                    Keine offenen To-Dos vorhanden. 🎉
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "einkauf" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Einkaufsliste</h2>
                  <p className={`text-xs ${textSub}`}>
                    Wischen: Links = Erledigen, Rechts = Löschen
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 font-mono text-xs font-bold ${badgeBlue}`}>
                  {offeneEinkaeufe.length} offen
                </span>
              </div>

              <div className={`${bgCard} space-y-2 rounded-2xl p-5`}>
                <div className={`text-[11px] font-bold ${textSub}`}>Schnellwahl:</div>
                <div className="flex flex-wrap gap-2">
                  {SCHNELLWAHL_FAVORITEN.map((fav, idx) => (
                    <button
                      key={idx}
                      onClick={() => addEinkauf(fav)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${bgItem} ${textTitle}`}
                    >
                      + {fav}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${bgCard} rounded-2xl p-6`}>
                <div
                  className={`mb-6 grid grid-cols-1 gap-3 border-b pb-6 sm:grid-cols-12 ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"}`}
                >
                  <input
                    type="text"
                    placeholder="Neuer Artikel..."
                    value={neuerArtikel}
                    onChange={(e) => setNeuerArtikel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addEinkauf()}
                    className={`w-full sm:col-span-8 ${bgInput} rounded-xl border px-4 py-2.5 text-sm font-medium focus:outline-none`}
                  />
                  <select
                    value={einkaufFuer}
                    onChange={(e) => setEinkaufFuer(e.target.value)}
                    className={`w-full sm:col-span-2 ${bgInput} rounded-xl border px-3 py-2.5 text-xs font-semibold focus:outline-none`}
                  >
                    <option value="Beide">👥 Beide</option>
                    <option value="Jonas">👤 Nur Jonas</option>
                    <option value="Lena">👤 Nur Lena</option>
                  </select>
                  <motion.button
                    whileTap={tapGesture}
                    onClick={() => addEinkauf()}
                    className={`w-full px-4 py-2.5 sm:col-span-2 ${buttonPrimary} flex items-center justify-center rounded-xl text-xs font-bold`}
                  >
                    Hinzufügen
                  </motion.button>
                </div>

                <div className="space-y-6">
                  {Object.entries(einkaufNachKategorien).map(([kategorie, items]) => (
                    <div key={kategorie} className="space-y-2">
                      <div
                        className={`text-[10px] font-bold ${textSub} px-1 tracking-wider uppercase`}
                      >
                        {kategorie}
                      </div>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="relative overflow-hidden rounded-xl">
                            <div className="absolute inset-0 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#49111C] via-[#251A1E] to-[#5B8C5A] px-4 text-white">
                              <div className="flex items-center gap-1 text-xs font-bold text-rose-200">
                                <Trash2 className="h-4 w-4" /> Löschen
                              </div>
                              <div className="flex items-center gap-1 text-xs font-bold text-emerald-200">
                                Erledigt <Check className="h-4 w-4" />
                              </div>
                            </div>
                            <motion.div
                              drag="x"
                              dragConstraints={{ left: 0, right: 0 }}
                              dragElastic={0.8}
                              whileTap={tapGesture}
                              layout
                              transition={springConfig}
                              onDragEnd={(_, info) => {
                                const isSwipeRight = info.offset.x > 80 || info.velocity.x > 500;
                                const isSwipeLeft = info.offset.x < -80 || info.velocity.x < -500;
                                if (isSwipeRight) deleteEinkauf(item);
                                else if (isSwipeLeft) markEinkaufErledigt(item, "Erledigt");
                              }}
                              className={`relative z-10 flex items-center justify-between rounded-xl border p-3.5 ${bgItem} ${bgCard} cursor-grab shadow-sm`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold ${textTitle}`}>
                                  {item.artikel}
                                </span>
                                {item.fuer && item.fuer !== "Beide" && (
                                  <span
                                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${badgeBlue}`}
                                  >
                                    👤 {item.fuer}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => markEinkaufErledigt(item, "Erledigt")}
                                className={`h-7 rounded-lg px-3 text-[11px] font-bold ${badgeGreen} flex items-center gap-1 hover:opacity-80`}
                              >
                                <Check className="h-3.5 w-3.5" /> Erledigt
                              </button>
                            </motion.div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(einkaufNachKategorien).length === 0 && (
                    <div className={`p-6 text-center text-xs ${textSub}`}>
                      Einkaufsliste ist leer. ✨
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "putzplan" && (
            <div className="space-y-6">
              <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Putzplan</h2>
              <div className={`${bgCard} space-y-3 rounded-2xl p-6`}>
                {aufgaben.map((a, idx) => (
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
          )}

          {activeTab === "vorrat" && (
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
                <div
                  className={`lg:col-span-2 ${bgCard} flex min-h-[280px] flex-col rounded-2xl p-6`}
                >
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
                          <th className={`pb-2 text-[10px] font-bold ${textSub} text-right`}>
                            MHD
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {vorrat.map((v, idx) => (
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
          )}

          {activeTab === "notizen" && (
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
                      onClick={addNote}
                      className={`px-6 py-2 ${buttonPrimary} rounded-xl text-xs font-bold`}
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              )}

              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
                {noteCategories.map((cat) => (
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
                {filteredNotes.map((note) => {
                  const lines = note.content.split("\n");

                  const toggleCheckItem = async (lineIdx: number) => {
                    const updatedLines = lines.map((line, idx) => {
                      if (idx !== lineIdx) return line;
                      if (line.includes("- [ ]")) return line.replace("- [ ]", "- [x]");
                      if (line.includes("- [x]")) return line.replace("- [x]", "- [ ]");
                      return line;
                    });
                    const newContent = updatedLines.join("\n");
                    setNotes((prev) =>
                      prev.map((n) => (n.id === note.id ? { ...n, content: newContent } : n))
                    );
                    await supabase
                      .from("notizen")
                      .update({ content: newContent })
                      .eq("id", note.id);
                  };

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
                          const isTodo =
                            line.trim().startsWith("- [ ]") || line.trim().startsWith("- [x]");
                          const isChecked = line.trim().startsWith("- [x]");
                          const itemText = line.replace(/^- \[[ x]\]\s*/, "");

                          if (isTodo) {
                            return (
                              <div
                                key={idx}
                                onClick={() => toggleCheckItem(idx)}
                                className="flex cursor-pointer items-center gap-2 py-0.5 select-none hover:opacity-80"
                              >
                                <div
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${isChecked ? "border-[#5B8C5A] bg-[#5B8C5A] text-white" : "border-slate-400"}`}
                                >
                                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                </div>
                                <span
                                  className={`${isChecked ? "line-through opacity-50" : textTitle}`}
                                >
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
          )}

          {activeTab === "kalender" && (
            <div className="space-y-6">
              <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>
                Kalender & Termine
              </h2>
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
                              {dayEvents.map((ev, idx) => (
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
                            {dayEvents.map((ev, idx) => (
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
          )}
        </div>
      </main>

      {/* Persistente Live-Workout Leiste bei minimiertem Training */}
      <AnimatePresence>
        {workout.isWorkoutActive && workout.isWorkoutMinimized && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={springConfig}
            className="fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+4.2rem)] left-3 z-40 md:right-8 md:bottom-6 md:left-72"
          >
            <div className="flex items-center justify-between rounded-2xl border border-[#0A84FF]/40 bg-[#121214] p-3.5 text-white shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A84FF]/20 text-[#0A84FF]">
                  <Activity className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wide text-white uppercase">
                      Laufendes Workout
                    </span>
                    <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                  </div>
                  <p className="font-mono text-[11px] text-slate-400">
                    ⏱️ {formatDauer(workout.workoutDauer)} • {workout.currentWorkoutSets} Sätze •{" "}
                    {workout.currentWorkoutVolume} kg
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => workout.setIsWorkoutMinimized(false)}
                className="flex items-center gap-1.5 rounded-xl bg-[#0A84FF] px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-[#0070E0]"
              >
                <span>Fortsetzen</span>
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-50 md:right-8 md:bottom-8">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 15 }}
              className="absolute right-0 bottom-16 mb-2 flex w-max flex-col items-end gap-2.5"
            >
              <button
                onClick={() => {
                  setActiveTab("todos");
                  setIsFabOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 shadow-lg ${bgCard} ${textTitle} text-xs font-bold transition-all hover:scale-105`}
              >
                <span>To-Do erstellen</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#005377] text-white">
                  <ListTodo className="h-4 w-4" />
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab("notizen");
                  setShowNoteModal(true);
                  setIsFabOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 shadow-lg ${bgCard} ${textTitle} text-xs font-bold transition-all hover:scale-105`}
              >
                <span>Notiz schreiben</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5B8C5A] text-white">
                  <StickyNote className="h-4 w-4" />
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab("einkauf");
                  setIsFabOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 shadow-lg ${bgCard} ${textTitle} text-xs font-bold transition-all hover:scale-105`}
              >
                <span>Einkauf hinzufügen</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#502419] text-white">
                  <ShoppingCart className="h-4 w-4" />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl transition-all duration-300 ${isFabOpen ? "rotate-45 bg-[#49111C] text-white" : "bg-[#005377] text-white shadow-[#005377]/40 hover:scale-105"}`}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <nav
        className={`fixed right-0 bottom-0 left-0 z-40 md:hidden ${isDarkMode ? "border-white/[0.08] bg-[#100A0B]/90" : "border-[#E8E2D9] bg-[#FAF8F5]/90"} flex items-center justify-around border-t px-3 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] backdrop-blur-xl`}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex h-11 min-w-[42px] flex-col items-center justify-center gap-0.5 rounded-lg ${activeTab === tab.id ? `${accentBlue} font-bold` : textSub}`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="text-[9px] tracking-tight">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
