"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  ShoppingCart,
  Package,
  Calendar as CalendarIcon,
  Plus,
  ClipboardList,
  Bell,
  Settings,
  Sun,
  Moon,
  Sparkles,
  UserCheck,
  StickyNote,
  ListTodo,
  Dumbbell,
  Activity,
  ChevronUp,
  Mic
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";

import {
  Departure,
  CalendarEvent,
  TodoItem,
  EinkaufItem,
  PutzItem,
  VorratItem,
  NoteItem
} from "../types";
import { ermittleKategorie, formatDauer } from "../lib/mciEngine";

import { useWeather } from "../hooks/useWeather";
import { useSupabaseData } from "../hooks/useSupabaseData";
import { useWorkoutSession } from "../hooks/useWorkoutSession";

import { HomeView } from "../components/HomeView";
import { TodoView } from "../components/ToDoView";
import { ShoppingView } from "../components/ShoppingView";
import { ActiveWorkoutView, GymDashboardView } from "../components/GymViews";
import { KalenderView } from "../components/KalenderView";
import { PutzplanView, VorratView, NotizenView } from "../components/OtherViews";

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
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isListeningGlobal, setIsListeningGlobal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [departures, setDepartures] = useState<Departure[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [termine, setTermine] = useState<CalendarEvent[]>([]);

  // 1. Custom Hooks
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
    notes,
    setNotes
  } = useSupabaseData();
  const workout = useWorkoutSession(activeUser, gymData, setGymData);

  const todayStr = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date());

  useEffect(() => {
    const savedTheme = localStorage.getItem("haushalt_theme");
    if (savedTheme === "dark") setIsDarkMode(true);
    const savedUser = localStorage.getItem("haushalt_user") as "Jonas" | "Lena" | null;
    if (savedUser) setActiveUser(savedUser);

    fetch("/api/calendar")
      .then((res) => res.json())
      .then((d) => setTermine(d.events || []))
      .catch(() => {});
    fetch("https://www.mvg.de/api/bgw-pt/v3/departures?globalId=de:09162:70")
      .then((res) => res.json())
      .then((d) => {
        if (Array.isArray(d))
          setDepartures(
            d.slice(0, 5).map((x: any) => ({
              line: x.label || "U",
              destination: x.destination || "Unbekannt",
              time: new Date(x.realtimeDepartureTime || x.plannedDepartureTime).toLocaleTimeString(
                "de-DE",
                { hour: "2-digit", minute: "2-digit" }
              )
            }))
          );
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("haushalt_theme", next ? "dark" : "light");
  };
  const switchUser = (u: "Jonas" | "Lena") => {
    setActiveUser(u);
    localStorage.setItem("haushalt_user", u);
  };

  // Helper Actions
  const addEinkauf = async (artikelName?: string, userFuer = "Beide") => {
    if (!artikelName?.trim()) return;
    const item: EinkaufItem = {
      id: crypto.randomUUID(),
      artikel: artikelName.trim(),
      status: "Offen",
      kategorie: ermittleKategorie(artikelName),
      fuer: userFuer
    };
    setEinkauf((p) => [...p, item]);
    setIsFabOpen(false);
    toast.success(`"${item.artikel}" auf die Einkaufsliste gesetzt`, {
      description: `Kategorie: ${item.kategorie} • Für: ${userFuer}`
    });
    await supabase.from("einkauf").insert(item);
    if (userFuer !== activeUser)
      fetch("https://ntfy.sh/HaushaltLenaJonas", {
        method: "POST",
        body: `${activeUser} hat "${item.artikel}" auf die Einkaufsliste gesetzt (${userFuer}).`,
        headers: { Title: "Neuer Einkauf", Tags: "shopping_cart" }
      });
  };
  const markEinkaufErledigt = async (item: EinkaufItem, status: "Erledigt" | "Offen") => {
    setEinkauf((p) => p.map((e) => (e.id === item.id ? { ...e, status } : e)));
    await supabase.from("einkauf").update({ status }).eq("id", item.id);
  };
  const deleteEinkauf = async (item: EinkaufItem) => {
    setEinkauf((p) => p.filter((e) => e.id !== item.id));
    await supabase.from("einkauf").delete().eq("id", item.id);
  };

  const addTodo = async (text: string, kat: string, zust: string) => {
    const item: TodoItem = {
      id: crypto.randomUUID(),
      aufgabe: text,
      kategorie: kat,
      status: "Offen",
      zustaendig: zust
    };
    setTodos((p) => [...p, item]);
    setIsFabOpen(false);
    toast.success("To-Do angelegt!", { description: `${text} (${zust})` });
    await supabase.from("todos").insert(item);
    if (zust !== activeUser) {
      const appUrl =
        typeof window !== "undefined" ? window.location.origin : "https://haushaltos.vercel.app";
      fetch("https://ntfy.sh/HaushaltLenaJonas", {
        method: "POST",
        body: `${activeUser} hat ein neues To-Do angelegt: "${text}" (${zust})`,
        headers: {
          Title: "Neues To-Do",
          Tags: "memo",
          Actions: `http, ✅ Erledigen, ${appUrl}/api/action, method=POST, body='{"type":"todo","id":"${item.id}","action":"erledigt"}', clear=true`
        }
      });
    }
  };
  const markTodoErledigt = async (item: TodoItem, status: "Erledigt" | "Offen") => {
    setTodos((p) => p.map((t) => (t.id === item.id ? { ...t, status } : t)));
    if (status === "Erledigt") {
      toast.success("To-Do erledigt! 🎉", { description: item.aufgabe });
      fetch("https://ntfy.sh/HaushaltLenaJonas", {
        method: "POST",
        body: `✅ ${activeUser} hat die Aufgabe "${item.aufgabe}" erledigt!`,
        headers: { Title: "To-Do erledigt", Tags: "white_check_mark" }
      });
    }
    await supabase.from("todos").update({ status }).eq("id", item.id);
  };
  const deleteTodo = async (item: TodoItem) => {
    setTodos((p) => p.filter((t) => t.id !== item.id));
    await supabase.from("todos").delete().eq("id", item.id);
  };

  const markAufgabeErledigt = async (item: PutzItem) => {
    const today = new Date().toISOString().split("T")[0];
    setAufgaben((p) => p.map((a) => (a.id === item.id ? { ...a, letztes_datum: today } : a)));
    await supabase.from("haushalt").update({ letztes_datum: today }).eq("id", item.id);
  };
  const addNote = async (title: string, content: string, category: string) => {
    const item: NoteItem = { id: crypto.randomUUID(), title, content, category, color: "green" };
    setNotes((p) => [...p, item]);
    setIsFabOpen(false);
    toast.success("Notiz angeheftet!", { description: title });
    await supabase.from("notizen").insert(item);
  };
  const toggleCheckItem = async (note: NoteItem, lineIdx: number) => {
    const lines = note.content
      .split("\n")
      .map((line, idx) =>
        idx !== lineIdx
          ? line
          : line.includes("- [ ]")
            ? line.replace("- [ ]", "- [x]")
            : line.replace("- [x]", "- [ ]")
      );
    const newContent = lines.join("\n");
    setNotes((p) => p.map((n) => (n.id === note.id ? { ...n, content: newContent } : n)));
    await supabase.from("notizen").update({ content: newContent }).eq("id", note.id);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const toastId = toast.loading("Analysiere Produkt & MHD per KI...");
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
        const b64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
        try {
          const res = await fetch("/api/vision", {
            method: "POST",
            body: JSON.stringify({ imageBase64: b64 })
          });
          const data = await res.json();
          if (data.artikel && data.mhd) {
            const item: VorratItem = {
              id: crypto.randomUUID(),
              artikel: data.artikel,
              ablaufdatum: data.mhd,
              anbruch: ""
            };
            setVorrat((p) => [...p, item]);
            await supabase.from("vorrat").insert(item);
            toast.success("Produkt erkannt!", {
              id: toastId,
              description: `${data.artikel} (MHD: ${data.mhd})`
            });
          } else
            toast.error("Produkt nicht erkannt", {
              id: toastId,
              description: data.error || "Bitte erneut versuchen."
            });
        } catch {
          toast.error("Fehler bei der Bildanalyse", { id: toastId });
        }
        setIsScanning(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------
  // INTELLIGENTER GLOBALER KI-VOICE ASSISTANT (Home & FAB)
  // -------------------------------------------------------------
  const startGlobalVoice = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Spracherkennung im Browser nicht unterstützt.");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListeningGlobal(true);
      toast.info("Ich höre zu... (z. B. 'Lena soll morgen Milch kaufen')", { id: "voice-toast" });
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      toast.loading(`Verarbeite: "${transcript}"...`, { id: "voice-toast" });

      try {
        const res = await fetch("/api/parse-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: transcript, defaultUser: activeUser })
        });
        const parsed = await res.json();

        if (parsed.type === "einkauf") {
          await addEinkauf(parsed.text, parsed.user || "Beide");
          toast.success(`🛒 Auf Einkaufsliste gesetzt!`, {
            id: "voice-toast",
            description: `${parsed.text} (${parsed.user || "Beide"})`
          });
        } else if (parsed.type === "notiz") {
          await addNote(parsed.text, parsed.text, parsed.kategorie || "Allgemein");
          toast.success(`📌 Notiz angeheftet!`, { id: "voice-toast", description: parsed.text });
        } else {
          await addTodo(
            parsed.text,
            parsed.kategorie || "Haushalt & Reparatur",
            parsed.user || "Beide"
          );
          toast.success(`✅ To-Do erstellt!`, {
            id: "voice-toast",
            description: `${parsed.text} (${parsed.user || "Beide"})`
          });
        }
      } catch {
        toast.error("Konnte Spracheingabe nicht analysieren", { id: "voice-toast" });
      }
      setIsListeningGlobal(false);
    };

    recognition.onerror = () => {
      setIsListeningGlobal(false);
      toast.error("Spracheingabe abgebrochen", { id: "voice-toast" });
    };

    recognition.start();
  };

  const getEventsForDate = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    const ger = `${d}.${m}.`;
    const iEvents = termine
      .filter((t) => t.date.includes(iso) || t.date.includes(ger))
      .map((t) => ({ title: t.title, type: "termin" as const }));
    const pEvents: { title: string; type: "putz" }[] = [];
    aufgaben.forEach((a) => {
      if (!a.letztes_datum || !a.intervall) return;
      const due = new Date(a.letztes_datum);
      due.setDate(due.getDate() + parseInt(a.intervall, 10));
      if (due.toDateString() === dateObj.toDateString())
        pEvents.push({ title: `🧹 ${a.aufgabe}`, type: "putz" });
    });
    return [...iEvents, ...pEvents];
  };

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

  const TABS = [
    { id: "home", icon: Home, label: "Übersicht" },
    {
      id: "todos",
      icon: ListTodo,
      label: "To-Dos",
      count: todos.filter((t) => t.status !== "Erledigt").length
    },
    {
      id: "einkauf",
      icon: ShoppingCart,
      label: "Einkauf",
      count: einkauf.filter((e) => e.status !== "Erledigt").length
    },
    { id: "gym", icon: Dumbbell, label: "Performance" },
    { id: "putzplan", icon: ClipboardList, label: "Putzplan" },
    { id: "vorrat", icon: Package, label: "Vorrat" },
    { id: "notizen", icon: StickyNote, label: "Pinnwand" },
    { id: "kalender", icon: CalendarIcon, label: "Kalender" }
  ];

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
      className={`flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden ${themeProps.bgMain} relative font-sans transition-colors duration-300`}
    >
      <aside
        className={`hidden w-64 md:flex ${themeProps.bgSidebar} z-20 h-full flex-col justify-between border-r p-4`}
      >
        <div>
          <div className="mb-4 flex items-center gap-3 px-3 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#005377] shadow-md shadow-[#005377]/20">
              <Sparkles className="h-4 w-4 text-[#CFD186]" />
            </div>
            <div>
              <span
                className={`text-sm font-bold tracking-tight ${themeProps.textTitle} block leading-none`}
              >
                Haushalt OS
              </span>
              <span className={`text-[10px] ${themeProps.textSub} font-medium`}>
                Workspace Jonas & Lena
              </span>
            </div>
          </div>
          <nav className="space-y-1">
            <div
              className={`px-3 text-[10px] font-bold ${themeProps.textSub} mt-4 mb-2 tracking-wider uppercase`}
            >
              Navigation
            </div>
            {TABS.map((tab) => (
              <motion.button
                whileTap={tapGesture}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${activeTab === tab.id ? (isDarkMode ? "border border-[#005377]/50 bg-[#005377]/30 text-[#82CBEE]" : "border border-[#005377]/20 bg-[#005377]/10 text-[#005377]") : `${themeProps.textSub} hover:bg-black/5 dark:hover:bg-white/5`}`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon
                    className={`h-4 w-4 ${activeTab === tab.id ? themeProps.accentBlue : ""}`}
                  />
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`py-0.2 rounded-md px-1.5 font-mono text-[10px] font-bold ${themeProps.badgeBlue}`}
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
            <UserCheck className={`h-3.5 w-3.5 ${themeProps.accentGreen}`} /> {activeUser}
          </button>
          <button onClick={toggleTheme} className={`${themeProps.textSub} hover:text-[#005377]`}>
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <main className="relative z-10 flex h-full flex-1 flex-col overflow-y-auto">
        <header
          className={`sticky top-0 z-30 ${isDarkMode ? "border-white/[0.08] bg-[#100A0B]/85" : "border-[#E8E2D9] bg-[#FAF8F5]/85"} border-b pt-[env(safe-area-inset-top)] backdrop-blur-md transition-colors duration-300`}
        >
          <div className="flex h-14 items-center justify-between px-4 md:px-8">
            <div
              className={`flex items-center gap-2 text-xs ${themeProps.textSub} font-medium tracking-wide`}
            >
              <span>Workspace</span>
              <span>/</span>
              <span className={`font-bold capitalize ${themeProps.textTitle}`}>{activeTab}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => switchUser(activeUser === "Jonas" ? "Lena" : "Jonas")}
                className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition-all md:hidden ${isDarkMode ? "border-white/[0.08] bg-[#251A1E] text-white" : "border-[#E8E2D9] bg-[#FAF8F5] text-[#2D2A26]"}`}
              >
                <UserCheck className={`h-3.5 w-3.5 ${themeProps.accentGreen}`} />{" "}
                <span>{activeUser}</span>
              </button>
              <button
                onClick={toggleTheme}
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${themeProps.bgCard} transition-transform active:scale-95`}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-[#CFD186]" />
                ) : (
                  <Moon className="h-4 w-4 text-[#49111C]" />
                )}
              </button>
              <button
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${themeProps.bgCard}`}
              >
                <Bell className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1400px] space-y-5 p-3.5 pb-[calc(env(safe-area-inset-bottom)+7rem)] md:space-y-8 md:p-8">
          {activeTab === "home" && (
            <HomeView
              activeUser={activeUser}
              todayStr={todayStr}
              weather={weather}
              weatherTip={weatherTip}
              locationName={locationName}
              countdowns={countdowns}
              termine={termine}
              offeneTodos={todos.filter((t) => t.status !== "Erledigt")}
              offeneEinkaeufe={einkauf.filter((e) => e.status !== "Erledigt")}
              departures={departures}
              setActiveTab={setActiveTab}
              startGlobalVoice={startGlobalVoice}
              isListening={isListeningGlobal}
              springConfig={springConfig}
              theme={themeProps}
            />
          )}

          {activeTab === "todos" && (
            <TodoView
              todos={todos}
              activeUser={activeUser}
              addTodo={addTodo}
              markTodoErledigt={markTodoErledigt}
              deleteTodo={deleteTodo}
              springConfig={springConfig}
              tapGesture={tapGesture}
              theme={themeProps}
            />
          )}
          {activeTab === "einkauf" && (
            <ShoppingView
              einkauf={einkauf}
              addEinkauf={addEinkauf}
              markEinkaufErledigt={markEinkaufErledigt}
              deleteEinkauf={deleteEinkauf}
              springConfig={springConfig}
              tapGesture={tapGesture}
              theme={themeProps}
            />
          )}
          {activeTab === "gym" && !workout.isWorkoutActive && (
            <GymDashboardView
              activeUser={activeUser}
              gymData={gymData}
              workout={workout}
              theme={themeProps}
            />
          )}
          {activeTab === "putzplan" && (
            <PutzplanView
              aufgaben={aufgaben}
              markAufgabeErledigt={markAufgabeErledigt}
              tapGesture={tapGesture}
              theme={themeProps}
            />
          )}
          {activeTab === "vorrat" && (
            <VorratView
              vorrat={vorrat}
              isScanning={isScanning}
              handleImageUpload={handleImageUpload}
              fileInputRef={fileInputRef}
              tapGesture={tapGesture}
              theme={themeProps}
            />
          )}
          {activeTab === "notizen" && (
            <NotizenView
              notes={notes}
              addNote={addNote}
              toggleCheckItem={toggleCheckItem}
              showNoteModal={showNoteModal}
              setShowNoteModal={setShowNoteModal}
              springConfig={springConfig}
              tapGesture={tapGesture}
              theme={themeProps}
            />
          )}

          {/* ECHTER APPLE KALENDER VIEW */}
          {activeTab === "kalender" && (
            <KalenderView
              currentDate={currentDate}
              getEventsForDate={getEventsForDate}
              theme={themeProps}
            />
          )}
        </div>
      </main>

      {/* Mini-Player Leiste bei minimiertem Workout */}
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

      {/* Floating Action Button */}
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
                  startGlobalVoice();
                  setIsFabOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 shadow-lg ${themeProps.bgCard} ${themeProps.textTitle} text-xs font-bold transition-all hover:scale-105`}
              >
                <span>KI Voice Assistent</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white">
                  <Mic className="h-4 w-4" />
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab("todos");
                  setIsFabOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 shadow-lg ${themeProps.bgCard} ${themeProps.textTitle} text-xs font-bold transition-all hover:scale-105`}
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
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 shadow-lg ${themeProps.bgCard} ${themeProps.textTitle} text-xs font-bold transition-all hover:scale-105`}
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
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 shadow-lg ${themeProps.bgCard} ${themeProps.textTitle} text-xs font-bold transition-all hover:scale-105`}
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
            className={`relative flex h-11 min-w-[42px] flex-col items-center justify-center gap-0.5 rounded-lg ${activeTab === tab.id ? `${themeProps.accentBlue} font-bold` : themeProps.textSub}`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="text-[9px] tracking-tight">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
