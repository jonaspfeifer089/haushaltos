"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, ShoppingCart, Package, Calendar as CalendarIcon, Clock, Plus, Check, ClipboardList, Camera, UploadCloud, Loader2, Bell, Settings, Sun, Moon, ChevronDown, ChevronUp, Sparkles, Hourglass, UserCheck, Trash2, StickyNote, CloudSun, Pin, Sparkle, ArrowRight, X, ChevronLeft, ChevronRight, CheckSquare, ListTodo, Tag, Dumbbell, Activity, Flame, MoreVertical
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from "../lib/supabaseClient";

interface Departure { line: string; destination: string; time: string; }
interface CalendarEvent { title: string; date: string; type?: "termin" | "putz"; }
interface TodoItem { id: string; aufgabe: string; kategorie: string; status: string; zustaendig: string; }
interface EinkaufItem { id: string; artikel: string; status: string; kategorie?: string; fuer?: string; }
interface GymItem { id: string; datum: string; uebung: string; gewicht: number; reps: number; setnum: number; username: string; }
interface PutzItem { id: string; aufgabe: string; letztes_datum: string; intervall: string; username: string; }
interface VorratItem { id: string; artikel: string; ablaufdatum: string; anbruch: string; }
interface CountdownItem { id: string; title: string; date: string; icon: string; }
interface NoteItem { id: string; title: string; content: string; category: string; color: string; }

const EINKAUF_KATEGORIEN = ["Obst & Gemüse", "Kühlregal", "Vorrat & Teigwaren", "Getränke", "Drogerie & Haushalt", "Sonstiges"] as const;
const TODO_KATEGORIEN = ["Haushalt & Reparatur", "Bürokratie & Verträge", "Besorgungen", "Freizeit & Projekte", "Sonstiges"] as const;
const SCHNELLWAHL_FAVORITEN = ["Hafermilch", "Bananen", "Eier", "Körniger Frischkäse", "Toast", "Äpfel", "Spüli", "Mineralwasser"];

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

const calculate1RM = (weight: number, reps: number) => Math.round(weight * (1 + reps / 30));

function getNextSetTarget(
  exerciseName: string,
  setNum: number,
  previousSets: GymItem[],
  targetMin = 8,
  targetMax = 12
) {
  const lastSet = previousSets.find(s => s.setnum === setNum) || previousSets[0];
  
  if (!lastSet) {
    return { targetKg: 20, targetReps: targetMin, label: "Startgewicht" };
  }

  const isCompound = /bank|rudern|drücken|lat|presse/i.test(exerciseName);
  const step = isCompound ? 2.5 : 1.25;

  if (lastSet.reps >= targetMax) {
    return {
      targetKg: lastSet.gewicht + step,
      targetReps: targetMin,
      label: `🔥 +${step}kg Overload!`
    };
  }

  return {
    targetKg: lastSet.gewicht,
    targetReps: lastSet.reps + 1,
    label: `⚡ +1 Rep (${lastSet.reps + 1} WDH)`
  };
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeUser, setActiveUser] = useState<"Jonas" | "Lena">("Jonas");
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [weather, setWeather] = useState<string>("Lädt...");
  const [weatherTip, setWeatherTip] = useState<string>("Guten Tag!");
  const [locationName, setLocationName] = useState<string>("Erfurt");

  // Detaillierte Wetter- & Outfit-Hinweise ermitteln
  const getDetailedWeatherAdvice = (
    currentTemp: number,
    minTemp: number,
    maxTemp: number,
    rainProb: number,
    weatherCode: number
  ) => {
    const parts: string[] = [];

    // 1. Niederschlag & Schirm
    if (rainProb >= 50 || (weatherCode >= 51 && weatherCode <= 67)) {
      parts.push(`🌧️ Regen gemeldet (${rainProb}% Risiko) – Schirm oder Regenjacke einpacken!`);
    }

    // 2. Temperaturunterschied & Outfit
    const tempDiff = maxTemp - minTemp;
    if (tempDiff >= 9 && maxTemp >= 20 && minTemp <= 13) {
      parts.push(`🧥 Morgens frisch (${minTemp}°C), mittags warm (${maxTemp}°C) – Zwiebellook empfohlen!`);
    } else if (maxTemp >= 25) {
      parts.push(`☀️ Heute wird es heiß (bis ${maxTemp}°C) – T-Shirt & leichte Kleidung genügen.`);
    } else if (maxTemp <= 8) {
      parts.push(`🧣 Bleibt kalt (max. ${maxTemp}°C) – dicke Jacke & Schal mitnehmen.`);
    } else if (maxTemp <= 15) {
      parts.push(`🧥 Mäßig kühl (bis ${maxTemp}°C) – Übergangsjacke anziehen.`);
    } else {
      parts.push(`🌤️ Angenehm mild (bis ${maxTemp}°C).`);
    }

    return parts.join(" ");
  };
  const [calendarMode, setCalendarMode] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [termine, setTermine] = useState<CalendarEvent[]>([]);

  const [einkauf, setEinkauf] = useState<EinkaufItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [gymData, setGymData] = useState<GymItem[]>([]);
  const [aufgaben, setAufgaben] = useState<PutzItem[]>([]);
  const [vorrat, setVorrat] = useState<VorratItem[]>([]);
  const [countdowns, setCountdowns] = useState<CountdownItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);

  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isWorkoutMinimized, setIsWorkoutMinimized] = useState(false);
  const [workoutDauer, setWorkoutDauer] = useState(0);
  const [activeExercises, setActiveExercises] = useState<any[]>([]);

  const [neuerArtikel, setNeuerArtikel] = useState("");
  const [einkaufFuer, setEinkaufFuer] = useState<string>("Beide");
  const [neuesTodo, setNeuesTodo] = useState("");
  const [todoKategorie, setTodoKategorie] = useState<string>("Haushalt & Reparatur");
  const [todoZustaendig, setTodoZustaendig] = useState<string>("Beide");
  const [activeTodoFilter, setActiveTodoFilter] = useState<string>("Alle");

  const [gymUebung, setGymUebung] = useState("");
  const [recovery, setRecovery] = useState<number>(80);
  const [newCdTitle, setNewCdTitle] = useState("");
  const [newCdDate, setNewCdDate] = useState("");
  const [activeNoteCategory, setActiveNoteCategory] = useState<string>("Alle");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("Allgemein");

  const [isScanning, setIsScanning] = useState(false);
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
          const newItem: VorratItem = { id: crypto.randomUUID(), artikel: aiData.artikel, ablaufdatum: aiData.mhd, anbruch: "" };
          setVorrat(prev => [...prev, newItem]);
          await supabase.from("vorrat").insert(newItem);
        } else { alert(aiData.error || "Konnte kein Produkt erkennen."); }
      } catch (err) { alert("Fehler bei der Bildanalyse."); }
      setIsScanning(false);
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
};
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const todayStr = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());

  useEffect(() => {
    const savedTheme = localStorage.getItem("haushalt_theme");
    if (savedTheme === "dark") setIsDarkMode(true);
    const savedUser = localStorage.getItem("haushalt_user") as "Jonas" | "Lena" | null;
    if (savedUser) setActiveUser(savedUser);

    const fetchSupabase = async () => {
      const [todosRes, einkaufRes, gymRes, haushaltRes, vorratRes, cdRes, notesRes] = await Promise.all([
        supabase.from("todos").select("*"), supabase.from("einkauf").select("*"), supabase.from("gym").select("*"),
        supabase.from("haushalt").select("*"), supabase.from("vorrat").select("*"), supabase.from("countdowns").select("*"), supabase.from("notizen").select("*")
      ]);
      if (todosRes.data) setTodos(todosRes.data);
      if (einkaufRes.data) setEinkauf(einkaufRes.data);
      if (gymRes.data) setGymData(gymRes.data);
      if (haushaltRes.data) setAufgaben(haushaltRes.data);
      if (vorratRes.data) setVorrat(vorratRes.data);
      if (cdRes.data) setCountdowns(cdRes.data);
      if (notesRes.data) setNotes(notesRes.data);
    };
    fetchSupabase();

    const handlePayload = (payload: any, setState: React.Dispatch<React.SetStateAction<any[]>>) => {
      if (payload.eventType === 'INSERT') setState(prev => prev.find(item => item.id === payload.new.id) ? prev : [...prev, payload.new]);
      else if (payload.eventType === 'UPDATE') setState(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
      else if (payload.eventType === 'DELETE') setState(prev => prev.filter(item => item.id !== payload.old.id));
    };

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, payload => handlePayload(payload, setTodos))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'einkauf' }, payload => handlePayload(payload, setEinkauf))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gym' }, payload => handlePayload(payload, setGymData))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'haushalt' }, payload => handlePayload(payload, setAufgaben))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vorrat' }, payload => handlePayload(payload, setVorrat))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    let interval: any;
    if (isWorkoutActive) interval = setInterval(() => setWorkoutDauer(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  // Workout-Zustand bei jeder Eingabe lokal sichern
  useEffect(() => {
    if (isWorkoutActive) {
      localStorage.setItem("haushalt_active_workout", JSON.stringify({
        activeExercises,
        workoutDauer,
        isWorkoutActive,
        isWorkoutMinimized
      }));
    } else {
      localStorage.removeItem("haushalt_active_workout");
    }
  }, [isWorkoutActive, isWorkoutMinimized, activeExercises, workoutDauer]);

  // Laufendes Workout beim Öffnen/Neuladen wiederherstellen
  useEffect(() => {
    const saved = localStorage.getItem("haushalt_active_workout");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isWorkoutActive && parsed.activeExercises?.length > 0) {
          setActiveExercises(parsed.activeExercises);
          setWorkoutDauer(parsed.workoutDauer || 0);
          setIsWorkoutActive(true);
          setIsWorkoutMinimized(parsed.isWorkoutMinimized ?? true);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    fetch("/api/calendar").then(res => res.json()).then(data => setTermine(data.events || [])).catch(() => {});
    fetch("https://www.mvg.de/api/bgw-pt/v3/departures?globalId=de:09162:70").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setDepartures(data.slice(0, 5).map((d: any) => ({ line: d.label || "U", destination: d.destination || "Unbekannt", time: new Date(d.realtimeDepartureTime || d.plannedDepartureTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) })));
    }).catch(() => {});
    const fetchWeatherForCoords = async (lat: number, lon: number, cityName?: string) => {
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
        );
        const data = await weatherRes.json();
        const curr = Math.round(data?.current?.temperature_2m ?? 0);
        const code = data?.current?.weather_code ?? 0;
        const minT = Math.round(data?.daily?.temperature_2m_min?.[0] ?? curr);
        const maxT = Math.round(data?.daily?.temperature_2m_max?.[0] ?? curr);
        const rainP = data?.daily?.precipitation_probability_max?.[0] ?? 0;

        setWeather(`${curr}°C`);
        setWeatherTip(getDetailedWeatherAdvice(curr, minT, maxT, rainP, code));

        if (cityName) {
          setLocationName(cityName);
        } else {
          try {
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=de`
            );
            const geoData = await geoRes.json();
            setLocationName(geoData.city || geoData.locality || "Vor Ort");
          } catch {
            setLocationName("Vor Ort");
          }
        }
      } catch {
        setWeather("--");
        setWeatherTip("Wetterdaten nicht verfügbar");
      }
    };

    // Prüfen, ob GPS verfügbar ist, sonst Fallback auf Erfurt (50.9803, 11.0291)
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeatherForCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          fetchWeatherForCoords(50.9803, 11.0291, "Erfurt");
        },
        { timeout: 8000 }
      );
    } else {
      fetchWeatherForCoords(50.9803, 11.0291, "Erfurt");
    }
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
    setEinkauf(prev => [...prev, newItem]); 
    if (!artikelName) setNeuerArtikel("");
    setIsFabOpen(false);
    await supabase.from("einkauf").insert(newItem);

    // Push nur senden, wenn es für Beide ist oder dem Partner zugewiesen wurde
    if (targetUser !== activeUser) {
      fetch("https://ntfy.sh/HaushaltLenaJonas", { 
        method: "POST", 
        body: `${activeUser} hat "${text}" auf die Einkaufsliste gesetzt (${targetUser}).`, 
        headers: { "Title": "Neuer Einkauf", "Tags": "shopping_cart" }
      });
    }
  };

  const markEinkaufErledigt = async (item: EinkaufItem, status: "Erledigt" | "Offen") => {
    setEinkauf(prev => prev.map(e => e.id === item.id ? { ...e, status } : e));
    await supabase.from("einkauf").update({ status }).eq("id", item.id);
  };
  const deleteEinkauf = async (item: EinkaufItem) => {
    setEinkauf(prev => prev.filter(e => e.id !== item.id));
    await supabase.from("einkauf").delete().eq("id", item.id);
  };

  const addTodo = async () => {
    const text = neuesTodo.trim();
    if (!text) return;
    const newItem: TodoItem = { id: crypto.randomUUID(), aufgabe: text, kategorie: todoKategorie, status: "Offen", zustaendig: todoZustaendig };
    setTodos(prev => [...prev, newItem]); 
    setNeuesTodo("");
    setIsFabOpen(false);
    await supabase.from("todos").insert(newItem);
    
    // Push nur senden, wenn es für Beide ist oder dem Partner zugewiesen wurde
    if (todoZustaendig !== activeUser) {
      const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://haushaltos.vercel.app';
      fetch("https://ntfy.sh/HaushaltLenaJonas", {
        method: "POST",
        body: `${activeUser} hat ein neues To-Do angelegt: "${text}" (${todoZustaendig})`,
        headers: {
          "Title": "Neues To-Do",
          "Tags": "memo",
          "Actions": `http, ✅ Erledigen, ${appUrl}/api/action, method=POST, body='{"type":"todo","id":"${newItem.id}","action":"erledigt"}', clear=true`
        }
      });
    }
  };

  const markTodoErledigt = async (item: TodoItem, status: "Erledigt" | "Offen") => {
    setTodos(prev => prev.map(t => t.id === item.id ? { ...t, status } : t));
    await supabase.from("todos").update({ status }).eq("id", item.id);

    if (status === "Erledigt") {
      fetch("https://ntfy.sh/HaushaltLenaJonas", {
        method: "POST",
        body: `✅ ${activeUser} hat die Aufgabe "${item.aufgabe}" erledigt!`,
        headers: { "Title": "To-Do erledigt", "Tags": "white_check_mark" }
      });
    }
  };
  const deleteTodo = async (item: TodoItem) => {
    setTodos(prev => prev.filter(t => t.id !== item.id));
    await supabase.from("todos").delete().eq("id", item.id);
  };

  const PUSH_ROUTINE = [
  "Bankdrücken (Langhantel)",
  "Schrägbankdrücken (Kurzhantel)",
  "Tiefe Cable crossovers",
  "Schulterpresse sitzend (Maschine)",
  "Seitheben (Kurzhantel)",
  "Trizepsdrücken mit dem Seil",
  "Überkopf-Trizepsstrecken (Kabelzug)",
  "Einarmiges Seitheben (Kabelzug)"
];

const PULL_ROUTINE = [
  "Sitzendes Rudern am Kabelzug - V-Griff (Kabel)",
  "Latzug (Kabel)",
  "Incline Curl sitzend (Kurzhantel)",
  "Hammer Curl (Kurzhantel)",
  "Preacher Curl (Langhantel)"
];

  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState("");

  const startWorkout = (type: "push" | "pull" | "empty") => {
    setWorkoutDauer(0);
    const exerciseNames = type === "push" ? PUSH_ROUTINE : type === "pull" ? PULL_ROUTINE : ["Bankdrücken (Langhantel)"];

    const builtExercises = exerciseNames.map(name => {
      const previousSets = gymData
        .filter(g => g.username === activeUser && g.uebung.toLowerCase() === name.toLowerCase())
        .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());

      const sets = [1, 2, 3].map(setNum => {
        const lastMatchingSet = previousSets.find(s => s.setnum === setNum) || previousSets[0];
        const prevText = lastMatchingSet ? `${lastMatchingSet.gewicht}kg x ${lastMatchingSet.reps}` : "-";
        return {
          id: crypto.randomUUID(),
          set: setNum,
          prev: prevText,
          kg: "",
          reps: "",
          done: false
        };
      });

      return {
        id: crypto.randomUUID(),
        name,
        targetRange: "8-12",
        sets
      };
    });

    setActiveExercises(builtExercises);
    setIsWorkoutActive(true);
  };

  const addSetToExercise = (exerciseId: string) => {
    setActiveExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const nextSetNum = ex.sets.length + 1;
      return {
        ...ex,
        sets: [
          ...ex.sets,
          {
            id: crypto.randomUUID(),
            set: nextSetNum,
            prev: ex.sets[ex.sets.length - 1]?.prev || "-",
            kg: "",
            reps: "",
            done: false
          }
        ]
      };
    }));
  };

  const removeSetFromExercise = (exerciseId: string, setId: string) => {
    setActiveExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const filtered = ex.sets.filter((s: any) => s.id !== setId);
      // Satznummern 1, 2, 3 neu durchnummerieren
      const renumbered = filtered.map((s: any, idx: number) => ({ ...s, set: idx + 1 }));
      return { ...ex, sets: renumbered };
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setActiveExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  const addExerciseToActiveWorkout = (name: string) => {
    if (!name.trim()) return;
    const previousSets = gymData
      .filter(g => g.username === activeUser && g.uebung.toLowerCase() === name.toLowerCase())
      .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());

    const sets = [1, 2, 3].map(setNum => {
      const lastMatchingSet = previousSets.find(s => s.setnum === setNum) || previousSets[0];
      return {
        id: crypto.randomUUID(),
        set: setNum,
        prev: lastMatchingSet ? `${lastMatchingSet.gewicht}kg x ${lastMatchingSet.reps}` : "-",
        kg: "",
        reps: "",
        done: false
      };
    });

    setActiveExercises(prev => [...prev, { id: crypto.randomUUID(), name: name.trim(), targetRange: "8-12", sets }]);
    setCustomExerciseName("");
    setShowAddExerciseModal(false);
  };

  const updateTargetRange = (exerciseId: string, range: string) => {
    setActiveExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, targetRange: range } : ex));
  };

  const updateSet = (exerciseId: string, setId: string, field: 'kg'|'reps', value: string) => {
    setActiveExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      return { ...ex, sets: ex.sets.map((s: any) => s.id === setId ? { ...s, [field]: value } : s) };
    }));
  };

  const toggleSetDone = (exerciseId: string, setId: string) => {
    setActiveExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      return { ...ex, sets: ex.sets.map((s: any) => s.id === setId ? { ...s, done: !s.done } : s) };
    }));
  };

  const endWorkout = async () => {
    const today = new Date().toISOString().split("T")[0];
    const completedSets: GymItem[] = [];
    activeExercises.forEach(ex => {
      ex.sets.filter((s:any) => s.done && s.kg && s.reps).forEach((s:any) => {
        completedSets.push({
          id: crypto.randomUUID(),
          datum: today,
          uebung: ex.name,
          gewicht: parseFloat(s.kg),
          reps: parseInt(s.reps, 10),
          setnum: s.set,
          username: activeUser
        });
      });
    });

    if (completedSets.length === 0) {
      setIsWorkoutActive(false);
      return;
    }

    setGymData(prev => [...prev, ...completedSets]);
    setIsWorkoutActive(false);
    setIsWorkoutMinimized(false);
    localStorage.removeItem("haushalt_active_workout");

    for (const set of completedSets) {
      await supabase.from("gym").insert(set);
    }
    fetch("https://ntfy.sh/HaushaltLenaJonas", {
      method: "POST",
      body: `${activeUser} hat ein Workout beendet! (${completedSets.length} Sätze absolviert).`,
      headers: { "Title": "Workout abgeschlossen", "Tags": "muscle" }
    });

    if (completedSets.length === 0) {
      setIsWorkoutActive(false);
      return;
    }

    setGymData(prev => [...prev, ...completedSets]);
    setIsWorkoutActive(false);

    for (const set of completedSets) {
      await supabase.from("gym").insert(set);
    }
    const totalSetsCompleted = completedSets.length;
    const totalVolume = completedSets.reduce((sum, s) => sum + (s.gewicht * s.reps), 0);
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://haushaltos.vercel.app';

    const bodyText = `🔥 Workout abgeschlossen!\n🏋️ ${totalSetsCompleted} Sätze | ${(totalVolume / 1000).toFixed(2)}t Tonnage\n🎯 Progressive Overload angewendet. Erholungsphase eingeleitet!`;

    fetch("https://ntfy.sh/HaushaltLenaJonas", {
      method: "POST",
      body: bodyText,
      headers: { 
        "Title": `Workout Beendet (${activeUser})`, 
        "Tags": "muscle,trophy",
        "Actions": `view, App oeffnen, ${appUrl}`
      }
    });
  };

  const markAufgabeErledigt = async (item: PutzItem) => {
    const today = new Date().toISOString().split("T")[0];
    setAufgaben(prev => prev.map(a => a.id === item.id ? { ...a, letztes_datum: today } : a));
    await supabase.from("haushalt").update({ letztes_datum: today }).eq("id", item.id);
  };

  const addCountdown = async () => {
    if (!newCdTitle || !newCdDate) return;
    const newItem: CountdownItem = { id: crypto.randomUUID(), title: newCdTitle, date: newCdDate, icon: "⏳" };
    setCountdowns(prev => [...prev, newItem]);
    setNewCdTitle(""); setNewCdDate("");
    await supabase.from("countdowns").insert(newItem);
  };

  const addNote = async () => {
    if (!newNoteTitle || !newNoteContent) return;
    const newItem: NoteItem = { id: crypto.randomUUID(), title: newNoteTitle, content: newNoteContent, category: newNoteCategory, color: "green" };
    setNotes(prev => [...prev, newItem]);
    setNewNoteTitle(""); setNewNoteContent(""); setShowNoteModal(false); setIsFabOpen(false);
    await supabase.from("notizen").insert(newItem);
  };

  const calculateDaysLeft = (targetDateStr: string) => Math.ceil((new Date(targetDateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const handlePrev = () => { const newDate = new Date(currentDate); if (calendarMode === "month") newDate.setMonth(newDate.getMonth() - 1); else newDate.setDate(newDate.getDate() - 7); setCurrentDate(newDate); };
  const handleNext = () => { const newDate = new Date(currentDate); if (calendarMode === "month") newDate.setMonth(newDate.getMonth() + 1); else newDate.setDate(newDate.getDate() + 7); setCurrentDate(newDate); };

  const formatDauer = (seconds: number) => {
    const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`; if (m > 0) return `${m}m ${s}s`; return `${s}s`;
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
    return Array.from({ length: 7 }).map((_, i) => { const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); return d; });
  };

  const getEventsForDate = (dateObj: Date) => {
    const y = dateObj.getFullYear(); const m = String(dateObj.getMonth() + 1).padStart(2, '0'); const d = String(dateObj.getDate()).padStart(2, '0');
    const isoStr = `${y}-${m}-${d}`; const gerStr = `${d}.${m}.`;
    const iEvents = termine.filter(t => t.date.includes(isoStr) || t.date.includes(gerStr)).map(t => ({ title: t.title, type: "termin" as const }));
    const pEvents: { title: string; type: "putz" }[] = [];
    aufgaben.forEach(a => {
      if (!a.letztes_datum || !a.intervall) return;
      const dueDate = new Date(a.letztes_datum); dueDate.setDate(dueDate.getDate() + parseInt(a.intervall, 10));
      if (dueDate.toDateString() === dateObj.toDateString()) pEvents.push({ title: `🧹 ${a.aufgabe}`, type: "putz" });
    });
    return [...iEvents, ...pEvents];
  };

  const offeneEinkaeufe = einkauf.filter(e => e.status !== "Erledigt");
  const offeneTodos = todos.filter(t => t.status !== "Erledigt");
  const filteredTodos = activeTodoFilter === "Alle" ? offeneTodos : offeneTodos.filter(t => t.kategorie === activeTodoFilter || t.zustaendig === activeTodoFilter);
  const einkaufNachKategorien = EINKAUF_KATEGORIEN.reduce((acc, kat) => {
    const items = offeneEinkaeufe.filter(i => (i.kategorie || ermittleKategorie(i.artikel)) === kat);
    if (items.length > 0) acc[kat] = items;
    return acc;
  }, {} as Record<string, EinkaufItem[]>);
  const noteCategories = ["Alle", ...Array.from(new Set(notes.map(n => n.category)))];
  const filteredNotes = activeNoteCategory === "Alle" ? notes : notes.filter(n => n.category === activeNoteCategory);
  const userGymData = gymData.filter(g => g.username === activeUser);
  const activeExerciseName = gymUebung.trim() || PUSH_ROUTINE[0];

  // 1. ZUERST: Alle Sätze der aktiven Übung ab Tag 1 chronologisch sortieren (alt -> neu)
  const exerciseSets = userGymData
    .filter(g => g.uebung.toLowerCase() === activeExerciseName.toLowerCase())
    .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());

  // 2. ZWEITENS: Sätze pro Workout-Tag aggregieren (All-Time Sessions)
  const sessionsByDate = exerciseSets.reduce((acc, curr) => {
    if (!acc[curr.datum]) {
      acc[curr.datum] = { datum: curr.datum, sets: [] as GymItem[] };
    }
    acc[curr.datum].sets.push(curr);
    return acc;
  }, {} as Record<string, { datum: string; sets: GymItem[] }>);

  // 3. DRITTENS: chartData ab dem ersten Training erstellen
  const chartData = Object.values(sessionsByDate).map(session => {
    const bestSet = session.sets.reduce((prev, curr) => {
      return calculate1RM(curr.gewicht, curr.reps) > calculate1RM(prev.gewicht, prev.reps) ? curr : prev;
    }, session.sets[0]);

    const sessionVolume = session.sets.reduce((sum, s) => sum + (s.gewicht * s.reps), 0);
    const max1RM = calculate1RM(bestSet.gewicht, bestSet.reps);

    // Formatiertes Datum für die X-Achse (z.B. "24.08." oder "24.08.26")
    const d = new Date(session.datum);
    const displayDatum = d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

    return {
      datum: displayDatum,
      rawDatum: session.datum,
      oneRepMax: max1RM,
      bestWeight: bestSet.gewicht,
      bestReps: bestSet.reps,
      volumen: sessionVolume,
      setCount: session.sets.length
    };
  });

  // 4. VIERTENS: Jetzt auf chartData zugreifen (nachdem es existiert)
  const getOverloadRecommendation = () => {
    if (chartData.length < 2) return { status: "Basis aufbauen", desc: "Noch nicht genügend Daten für Empfehlung." };
    const latest = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2];
    
    if (latest.oneRepMax > prev.oneRepMax) {
      return { status: "🔥 Overload aktiv", desc: `+${latest.oneRepMax - prev.oneRepMax} kg 1RM Steigerung! Nächstes Mal Gewicht halten und Reps stabilisieren.` };
    } else if (latest.oneRepMax === prev.oneRepMax) {
      return { status: "⚡ Steigerung bereit", desc: "Arbeitsgewicht erreicht: Erhöhe im 1. Satz um +2.5 kg oder peile +1 Rep an." };
    } else {
      return { status: "🛡️ Ermüdung beachten", desc: "Leistungsabfall erkannt: Regeneration prüfen oder 1 Satz weniger ausführen." };
    }
  };

  const overloadInfo = getOverloadRecommendation();

  // 5. FÜNFTENS: KPIs und Wochen-Volumen berechnen
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  
  const recentSets = userGymData.filter(g => new Date(g.datum) >= last7Days);
  const chestSets = recentSets.filter(g => /bank|cross|brust/i.test(g.uebung)).length;
  const backSets = recentSets.filter(g => /ruder|lat|zug|klimm/i.test(g.uebung)).length;
  const shoulderSets = recentSets.filter(g => /schulter|presse|seitheben/i.test(g.uebung)).length;
  const armSets = recentSets.filter(g => /curl|trizeps|preacher/i.test(g.uebung)).length;
  
  // KPIs berechnen
  const allTimePR = chartData.length > 0 ? Math.max(...chartData.map(c => c.oneRepMax)) : 0;
  const maxWeightLifted = exerciseSets.length > 0 ? Math.max(...exerciseSets.map(s => s.gewicht)) : 0;
  const totalVolumeLifetime = exerciseSets.reduce((sum, s) => sum + (s.gewicht * s.reps), 0);
  
  const lastSession1RM = chartData.length > 0 ? chartData[chartData.length - 1].oneRepMax : 0;
  const prevSession1RM = chartData.length > 1 ? chartData[chartData.length - 2].oneRepMax : lastSession1RM;
  const growthRate = prevSession1RM > 0 ? (((lastSession1RM - prevSession1RM) / prevSession1RM) * 100).toFixed(1) : "0.0";

  // Workout-Historie pro Tag aggregieren & Typ (Push / Pull) erkennen
  const allUserSessionsByDate = userGymData.reduce((acc, curr) => {
    if (!acc[curr.datum]) {
      acc[curr.datum] = { datum: curr.datum, sets: [] as GymItem[] };
    }
    acc[curr.datum].sets.push(curr);
    return acc;
  }, {} as Record<string, { datum: string; sets: GymItem[] }>);

  const workoutHistory = Object.values(allUserSessionsByDate)
    .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
    .map(session => {
      const uebungen = Array.from(new Set(session.sets.map(s => s.uebung)));
      const totalVolume = session.sets.reduce((sum, s) => sum + (s.gewicht * s.reps), 0);
      
      const pushCount = session.sets.filter(s => PUSH_ROUTINE.some(p => p.toLowerCase() === s.uebung.toLowerCase())).length;
      const pullCount = session.sets.filter(s => PULL_ROUTINE.some(p => p.toLowerCase() === s.uebung.toLowerCase())).length;
      
      let type: "PUSH" | "PULL" | "INDIVIDUELL" = "INDIVIDUELL";
      if (pushCount > pullCount) type = "PUSH";
      else if (pullCount > pushCount) type = "PULL";

      const d = new Date(session.datum);
      const weekday = d.toLocaleDateString("de-DE", { weekday: "short" });
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const formattedDate = `${weekday} ${day}.${month}.${year}`;

      return {
        rawDate: session.datum,
        formattedDate,
        type,
        totalVolume,
        totalSets: session.sets.length,
        uebungen
      };
    });

  let currentWorkoutVolume = 0; 
  let currentWorkoutSets = 0;
  activeExercises.forEach(ex => { ex.sets.forEach((s:any) => { if (s.done && s.kg && s.reps) { currentWorkoutVolume += (parseFloat(s.kg) * parseInt(s.reps, 10)); currentWorkoutSets++; } }); });

// -------------------------------------------------------------
  // GLOBAL COMPOSITE STRENGTH & HYPERTROPHY ENGINE
  // -------------------------------------------------------------
  const CORE_COMPOUNDS = [
    { name: "Bankdrücken (Langhantel)", group: "Brust" },
    { name: "Schrägbankdrücken (Kurzhantel)", group: "Brust" },
    { name: "Sitzendes Rudern am Kabelzug - V-Griff (Kabel)", group: "Rücken" },
    { name: "Latzug (Kabel)", group: "Rücken" },
    { name: "Schulterpresse sitzend (Maschine)", group: "Schulter" }
  ];

  // Alle Workouts chronologisch sortieren
  const allUserDatesAsc = Array.from(new Set(userGymData.map(g => g.datum)))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Globaler All-Time Kraftverlauf: Errechnet den Composite 1RM-Score für jeden Trainingstag
  const globalStrengthHistory = allUserDatesAsc.map(currentDateStr => {
    // Finde den aktuellsten PR jeder Compound-Übung bis zu diesem Datum
    let totalComposite1RM = 0;
    let exerciseCount = 0;

    CORE_COMPOUNDS.forEach(comp => {
      const pastSets = userGymData.filter(g => 
        g.uebung.toLowerCase().includes(comp.name.toLowerCase().substring(0, 8)) &&
        new Date(g.datum) <= new Date(currentDateStr)
      );
      if (pastSets.length > 0) {
        const bestPastSet = pastSets.reduce((prev, curr) => 
          calculate1RM(curr.gewicht, curr.reps) > calculate1RM(prev.gewicht, prev.reps) ? curr : prev, pastSets[0]
        );
        totalComposite1RM += calculate1RM(bestPastSet.gewicht, bestPastSet.reps);
        exerciseCount++;
      }
    });

    const d = new Date(currentDateStr);
    const displayDate = d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

    return {
      datum: displayDate,
      rawDatum: currentDateStr,
      compositeScore: totalComposite1RM,
      trackedCompounds: exerciseCount
    };
  }).filter(item => item.compositeScore > 0);

  // Aktueller Globaler Score vs. Start-Score
  const baselineScore = globalStrengthHistory.length > 0 ? globalStrengthHistory[0].compositeScore : 0;
  const currentCompositeScore = globalStrengthHistory.length > 0 ? globalStrengthHistory[globalStrengthHistory.length - 1].compositeScore : 0;
  const totalCompositeGainKg = currentCompositeScore - baselineScore;
  const totalCompositeGainPercent = baselineScore > 0 ? ((totalCompositeGainKg / baselineScore) * 100).toFixed(1) : "0.0";

  // Muskel-Balance Score (Push vs. Pull vs. Schulter)
  const getMuscleMax1RM = (keyword: string) => {
    const sets = userGymData.filter(g => g.uebung.toLowerCase().includes(keyword.toLowerCase()));
    if (sets.length === 0) return 0;
    return Math.max(...sets.map(s => calculate1RM(s.gewicht, s.reps)));
  };

  const chest1RM = Math.max(getMuscleMax1RM("Bankdrücken"), getMuscleMax1RM("Schrägbank"));
  const back1RM = Math.max(getMuscleMax1RM("Rudern"), getMuscleMax1RM("Latzug"));
  const shoulder1RM = Math.max(getMuscleMax1RM("Schulter"), getMuscleMax1RM("Seitheben"));

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

  const bgMain = isDarkMode ? "bg-[#100A0B] text-[#EDE7E3]" : "bg-[#FAF8F5] text-[#2D2A26]";
  const bgSidebar = isDarkMode ? "bg-[#180F12] border-white/[0.08]" : "bg-[#FFFFFF] border-[#E8E2D9]";
  const bgCard = isDarkMode ? "bg-[#1E1418] border border-white/[0.08] text-[#FAF8F5] shadow-[0_4px_20px_rgba(0,0,0,0.4)]" : "bg-[#FFFFFF] border border-[#E8E2D9] shadow-[0_2px_8px_rgba(80,36,25,0.04)] text-[#2D2A26]";
  const bgInput = isDarkMode ? "bg-[#140C0E] border-white/[0.1] text-white focus:border-[#CFD186]" : "bg-[#FAF8F5] border-[#E8E2D9] text-[#2D2A26] focus:border-[#005377]";
  const bgItem = isDarkMode ? "bg-[#251A1E] border-white/[0.05]" : "bg-[#F7F4EF] border-[#E8E2D9]";
  const textTitle = isDarkMode ? "text-[#FAF8F5]" : "text-[#2D2A26]";
  const textSub = isDarkMode ? "text-[#A89F91]" : "text-[#7A7265]";
  const accentBlue = isDarkMode ? "text-[#82CBEE]" : "text-[#005377]";
  const accentGreen = isDarkMode ? "text-[#7DB47C]" : "text-[#5B8C5A]";
  const badgeGreen = isDarkMode ? "bg-[#5B8C5A]/20 text-[#9ED09D] border border-[#5B8C5A]/40" : "bg-[#5B8C5A]/15 text-[#2C522B] border border-[#5B8C5A]/30";
  const badgeBlue = isDarkMode ? "bg-[#005377]/30 text-[#6BB9E0] border border-[#005377]/50" : "bg-[#005377]/10 text-[#005377] border border-[#005377]/25";
  const buttonPrimary = isDarkMode ? "bg-[#005377] hover:bg-[#006894] text-white" : "bg-[#005377] hover:bg-[#00415E] text-white shadow-sm";

if (isWorkoutActive && !isWorkoutMinimized) {
    return (
      <div className="flex h-[100dvh] w-full bg-black text-white font-sans overflow-hidden">
        <main className="flex-1 flex flex-col h-full overflow-y-auto">
          {/* Hevy Header mit Safe-Area-Padding oben */}
          <div className="sticky top-0 z-50 bg-[#0C0C0E] border-b border-[#2C2C2E] px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
  type="button"
  onClick={() => setIsWorkoutMinimized(true)} 
  className="h-8 w-8 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] flex items-center justify-center text-white transition-colors"
  title="Workout minimieren"
>
  <ChevronDown className="h-5 w-5" />
</button>
              <span className="font-semibold text-[15px]">Workout</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAddExerciseModal(true)} className="bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 border border-white/10">
                <Plus className="h-3.5 w-3.5" /> Übung
              </button>
              <button onClick={endWorkout} className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-all">
                Beenden
              </button>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="bg-[#000000] px-6 py-4 flex justify-between items-center border-b border-[#1C1C1E]">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium mb-1">Dauer</span>
              <span className="text-[#0A84FF] font-semibold text-[15px]">{formatDauer(workoutDauer)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-400 font-medium mb-1">Volumen</span>
              <span className="font-semibold text-[15px]">{currentWorkoutVolume} kg</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-400 font-medium mb-1">Sätze</span>
              <span className="font-semibold text-[15px]">{currentWorkoutSets}</span>
            </div>
            <div className="h-8 w-8 opacity-70"><Activity className="h-full w-full" /></div>
          </div>

          {/* Exercises List */}
          <div className="p-3 space-y-6 pb-36 max-w-2xl mx-auto w-full">
            {activeExercises.map(ex => (
              <div key={ex.id} className="bg-[#121214] border border-[#232326] rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-white rounded-full flex items-center justify-center text-black font-bold shrink-0">
                      <Dumbbell className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[#0A84FF] font-semibold text-[15px] block leading-tight">{ex.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Ziel:</span>
                        <input 
                          type="text" 
                          value={ex.targetRange || "8-12"} 
                          onChange={(e) => updateTargetRange(ex.id, e.target.value)}
                          className="bg-[#1C1C1E] text-xs font-mono font-bold text-gray-200 px-2 py-0.5 rounded border border-white/10 w-16 text-center outline-none focus:border-[#0A84FF]"
                        />
                        <span className="text-[10px] text-gray-400 font-bold">WDH</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeExercise(ex.id)} className="text-gray-500 hover:text-rose-400 p-1 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-2 mb-2 text-[10px] text-gray-500 font-bold tracking-wider text-center px-1">
                  <div className="col-span-1 text-left">SET</div>
                  <div className="col-span-4 text-left">VORHERIGE</div>
                  <div className="col-span-3">KG</div>
                  <div className="col-span-2">WDH</div>
                  <div className="col-span-2 flex justify-center"><Check className="h-4 w-4" /></div>
                </div>

                <div className="space-y-2.5">
                  {ex.sets.map((s: any) => {
                    const targetInfo = getNextSetTarget(
                      ex.name, 
                      s.set, 
                      gymData.filter(g => g.username === activeUser && g.uebung.toLowerCase() === ex.name.toLowerCase())
                    );

                    return (
                      <div key={s.id} className={`p-2.5 rounded-xl border transition-all ${s.done ? "bg-[#1C1C1E]/80 border-emerald-500/40" : "bg-[#161618] border-white/5"}`}>
                        <div className="flex justify-between items-center text-[10px] mb-1.5 px-1">
                          <span className="text-slate-400 font-mono truncate max-w-[140px]">Vorher: {s.prev}</span>
                          <span className="text-[#0A84FF] font-bold font-mono bg-[#0A84FF]/10 px-1.5 py-0.5 rounded">
                            🎯 Ziel: {targetInfo.targetKg}kg × {targetInfo.targetReps}
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-1 text-center font-bold text-xs text-white">{s.set}</div>
                          
                          <div className="col-span-4">
                            <input 
                              type="number" 
                              step="0.5" 
                              inputMode="decimal"
                              placeholder={`${targetInfo.targetKg}`}
                              value={s.kg} 
                              onChange={e => updateSet(ex.id, s.id, 'kg', e.target.value)}
                              className="w-full h-8 bg-[#1C1C1E] border border-[#2C2C2E] rounded-md text-center text-white font-semibold text-xs outline-none focus:border-[#0A84FF]"
                            />
                          </div>

                          <div className="col-span-3">
                            <input 
                              type="number" 
                              inputMode="numeric"
                              placeholder={`${targetInfo.targetReps}`}
                              value={s.reps} 
                              onChange={e => updateSet(ex.id, s.id, 'reps', e.target.value)}
                              className="w-full h-8 bg-[#1C1C1E] border border-[#2C2C2E] rounded-md text-center text-white font-semibold text-xs outline-none focus:border-[#0A84FF]"
                            />
                          </div>

                          <div className="col-span-4 flex items-center justify-end gap-1">
                            <button 
                              type="button"
                              onClick={() => {
                                updateSet(ex.id, s.id, 'kg', String(targetInfo.targetKg));
                                updateSet(ex.id, s.id, 'reps', String(targetInfo.targetReps));
                              }}
                              className="px-2 h-7 bg-white/5 hover:bg-white/10 text-[10px] font-bold rounded text-slate-300 transition-colors"
                              title="Ziel übernehmen"
                            >
                              Auto
                            </button>
                            <button 
                              type="button"
                              onClick={() => toggleSetDone(ex.id, s.id)}
                              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${s.done ? "bg-[#32D74B] text-black" : "bg-[#1C1C1E] text-gray-500 hover:bg-[#2C2C2E]"}`}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            {ex.sets.length > 1 && (
                              <button onClick={() => removeSetFromExercise(ex.id, s.id)} className="text-gray-600 hover:text-rose-400 p-0.5">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <button 
                  onClick={() => addSetToExercise(ex.id)} 
                  className="w-full bg-[#1C1C1E] hover:bg-[#242428] text-gray-300 rounded-xl py-2 mt-3 text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-white/5"
                >
                  <Plus className="h-3.5 w-3.5" /> Satz hinzufügen
                </button>
              </div>
            ))}

            <button 
              onClick={() => setShowAddExerciseModal(true)} 
              className="w-full py-3.5 bg-[#1C1C1E] hover:bg-[#28282D] text-[#0A84FF] font-bold rounded-2xl border border-dashed border-[#0A84FF]/40 flex items-center justify-center gap-2 text-sm transition-all"
            >
              <Plus className="h-4 w-4" /> Weitere Übung hinzufügen
            </button>
          </div>

          {/* Modal: Neue Übung auswählen/eingeben */}
          {showAddExerciseModal && (
            <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] md:bottom-8 right-4 md:right-8 z-40">
              <div className="bg-[#1C1C1E] border border-white/10 w-full max-w-md rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white">Übung zum Workout hinzufügen</h3>
                  <button onClick={() => setShowAddExerciseModal(false)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
                </div>

                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="Eigene Übung eingeben..." 
                    value={customExerciseName}
                    onChange={(e) => setCustomExerciseName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addExerciseToActiveWorkout(customExerciseName)}
                    className="w-full bg-[#121214] border border-[#2C2C2E] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#0A84FF]"
                  />
                  <button 
                    onClick={() => addExerciseToActiveWorkout(customExerciseName)}
                    className="w-full bg-[#0A84FF] text-white py-2 rounded-xl text-xs font-bold"
                  >
                    Hinzufügen
                  </button>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Schnellauswahl:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {[...PUSH_ROUTINE, ...PULL_ROUTINE].map((exName, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => addExerciseToActiveWorkout(exName)}
                        className="text-[11px] bg-[#121214] hover:bg-[#28282D] text-gray-200 border border-white/5 px-2.5 py-1.5 rounded-lg text-left truncate"
                      >
                        + {exName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className={`flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden ${bgMain} font-sans transition-colors duration-300 relative`}>
      <aside className={`hidden md:flex w-64 ${bgSidebar} border-r flex-col justify-between p-4 h-full z-20`}>
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="h-8 w-8 rounded-xl bg-[#005377] flex items-center justify-center shadow-md shadow-[#005377]/20"><Sparkles className="w-4 h-4 text-[#CFD186]" /></div>
            <div><span className={`font-bold text-sm tracking-tight ${textTitle} block leading-none`}>Haushalt OS</span><span className={`text-[10px] ${textSub} font-medium`}>Workspace Jonas & Lena</span></div>
          </div>
          <nav className="space-y-1">
            <div className={`px-3 text-[10px] font-bold ${textSub} uppercase tracking-wider mb-2 mt-4`}>Navigation</div>
            {TABS.map(tab => (
              <motion.button whileTap={tapGesture} key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === tab.id ? (isDarkMode ? "bg-[#005377]/30 text-[#82CBEE] border border-[#005377]/50" : "bg-[#005377]/10 text-[#005377] border border-[#005377]/20") : `${textSub} hover:bg-black/5 dark:hover:bg-white/5`}`}>
                <div className="flex items-center gap-3"><tab.icon className={`h-4 w-4 ${activeTab === tab.id ? accentBlue : ""}`} /><span>{tab.label}</span></div>
                {tab.count !== undefined && tab.count > 0 && <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${badgeBlue}`}>{tab.count}</span>}
              </motion.button>
            ))}
          </nav>
        </div>
        <div className={`pt-4 border-t ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} flex justify-between items-center px-2`}>
           <button onClick={() => switchUser(activeUser === "Jonas" ? "Lena" : "Jonas")} className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-2 border transition-all ${isDarkMode ? "bg-[#251A1E] border-white/[0.08] text-white hover:border-[#CFD186]/40" : "bg-[#FAF8F5] border-[#E8E2D9] text-[#2D2A26] shadow-sm hover:border-[#005377]/40"}`}><UserCheck className={`h-3.5 w-3.5 ${accentGreen}`} /> {activeUser}</button>
           <button onClick={toggleTheme} className={`${textSub} hover:text-[#005377]`}><Settings className="h-4 w-4" /></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
        <header className={`sticky top-0 z-30 ${isDarkMode ? "bg-[#100A0B]/85 border-white/[0.08]" : "bg-[#FAF8F5]/85 border-[#E8E2D9]"} backdrop-blur-md border-b transition-colors duration-300 pt-[env(safe-area-inset-top)]`}>
            <div className="h-14 px-4 md:px-8 flex items-center justify-between">
            <div className={`flex items-center gap-2 text-xs ${textSub} font-medium tracking-wide`}><span>Workspace</span><span>/</span><span className={`capitalize font-bold ${textTitle}`}>{activeTab}</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => switchUser(activeUser === "Jonas" ? "Lena" : "Jonas")} className={`md:hidden h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${isDarkMode ? "bg-[#251A1E] border-white/[0.08] text-white" : "bg-[#FAF8F5] border-[#E8E2D9] text-[#2D2A26]"}`}><UserCheck className={`h-3.5 w-3.5 ${accentGreen}`} /> <span>{activeUser}</span></button>
              <button onClick={toggleTheme} className={`h-8 w-8 flex items-center justify-center rounded-lg ${bgCard} transition-transform active:scale-95`}>{isDarkMode ? <Sun className="h-4 w-4 text-[#CFD186]" /> : <Moon className="h-4 w-4 text-[#49111C]" />}</button>
              <button className={`h-8 w-8 flex items-center justify-center rounded-lg ${bgCard}`}><Bell className="h-4 w-4 text-slate-400" /></button>
            </div>
          </div>
        </header>

        <div className="p-3.5 md:p-8 pb-[calc(env(safe-area-inset-bottom)+7rem)] max-w-[1400px] mx-auto w-full space-y-5 md:space-y-8">
          {activeTab === "home" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#E8E2D9] dark:border-white/[0.08]">
                <div><div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${accentGreen} mb-1`}><Sparkle className="h-3.5 w-3.5 fill-current" /> {todayStr}</div><h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${textTitle}`}>Guten Tag, {activeUser}!</h1></div>
                {/* Wetter- & Outfit-Empfehlungs-Kachel */}
              <div className={`p-4 rounded-2xl border ${bgCard} flex items-center gap-3`}>
                <div className="text-2xl shrink-0">💡</div>
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${textSub} block`}>
                    Tages- & Outfit-Empfehlung ({locationName})
                  </span>
                  <p className={`text-xs font-semibold ${textTitle} mt-0.5`}>
                    {weatherTip}
                  </p>
                </div>
              </div>
                <div className="flex items-center gap-2">
  <span className={`text-base font-extrabold font-mono leading-none ${textTitle}`}>{weather}</span>
  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeGreen}`}>{locationName}</span>
</div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-3">
  <div className="flex justify-between items-center px-1">
    <h3 className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Meilensteine</h3>
    <span className={`text-xs ${accentBlue} font-semibold cursor-pointer`} onClick={() => setActiveTab("kalender")}>Verwalten &gt;</span>
  </div>
  {countdowns.length > 0 ? (
    <div className="space-y-2.5">
      {countdowns.map((cd, idx) => (
        <motion.div whileHover={{ scale: 1.02 }} transition={springConfig} key={idx} className={`${bgCard} rounded-2xl p-3 md:p-4 flex items-center justify-between border relative overflow-hidden`}>
  <div className="flex items-center gap-3">
    <span className="text-xl md:text-2xl p-1.5 md:p-2 rounded-xl bg-[#5B8C5A]/15 border border-[#5B8C5A]/30 shrink-0">{cd.icon}</span>
    <div className="truncate">
      <h4 className={`text-xs md:text-sm font-bold ${textTitle} truncate`}>{cd.title}</h4>
      <p className={`text-[10px] md:text-xs ${textSub} font-medium`}>{cd.date}</p>
    </div>
  </div>
  <div className="text-right flex items-baseline gap-1 shrink-0">
    <span className={`text-lg md:text-xl font-black font-mono ${accentGreen}`}>{Math.max(0, calculateDaysLeft(cd.date))}</span>
    <span className={`text-[10px] md:text-[11px] font-bold ${textSub}`}>Tage</span>
  </div>
</motion.div>
      ))}
    </div>
  ) : (
    <div className={`${bgCard} rounded-2xl p-6 border text-center text-xs ${textSub}`}>
      Keine Meilensteine eingetragen.
    </div>
  )}
</div>
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center px-1"><h3 className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Termine & Putzplan</h3><span className={`text-[10px] ${textSub}`}>System OS</span></div>
                    <div className={`${bgCard} rounded-3xl p-6 border space-y-3`}>
                      {termine.slice(0, 4).map((t, i) => (<div key={i} className={`flex items-center justify-between p-3 rounded-2xl border ${bgItem} gap-4`}><div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-[#005377]" /><span className={`text-xs font-bold ${textTitle} truncate max-w-[220px] sm:max-w-none`}>{t.title}</span></div><span className={`text-[10px] font-mono font-bold ${badgeBlue} px-2.5 py-1 rounded-lg shrink-0`}>{t.date}</span></div>))}
                      {termine.length === 0 && <p className={`text-xs ${textSub} py-4 text-center`}>Keine Termine synchronisiert.</p>}
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-3"><h3 className={`text-xs font-bold uppercase tracking-wider ${textSub} px-1`}>Schnellübersicht</h3>
                    <div onClick={() => setActiveTab("todos")} className={`${bgCard} rounded-3xl p-5 border cursor-pointer hover:border-[#005377]/50 transition-all group`}><div className="flex justify-between items-center mb-3"><div className="flex items-center gap-2"><ListTodo className={`h-4 w-4 ${accentBlue}`} /><span className={`text-xs font-bold ${textTitle}`}>To-Do Liste</span></div><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeBlue}`}>{offeneTodos.length} offen</span></div>
                      <div className="space-y-1.5 mb-3">{offeneTodos.slice(0, 3).map((item, i) => (<div key={i} className={`text-xs ${textSub} flex items-center justify-between gap-2`}><div className="flex items-center gap-2 truncate"><span className="h-1 w-1 rounded-full bg-[#005377]" /><span className="truncate">{item.aufgabe}</span></div><span className="text-[10px] font-mono font-medium opacity-70 shrink-0">{item.zustaendig}</span></div>))}{offeneTodos.length === 0 && <span className={`text-xs ${textSub}`}>Keine offenen To-Dos! 🎉</span>}</div></div>
                    <div onClick={() => setActiveTab("einkauf")} className={`${bgCard} rounded-3xl p-5 border cursor-pointer hover:border-[#5B8C5A]/50 transition-all group`}><div className="flex justify-between items-center mb-3"><div className="flex items-center gap-2"><ShoppingCart className={`h-4 w-4 ${accentGreen}`} /><span className={`text-xs font-bold ${textTitle}`}>Einkaufsliste</span></div><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeGreen}`}>{offeneEinkaeufe.length} offen</span></div>
                      <div className="space-y-1.5 mb-3">{offeneEinkaeufe.slice(0, 2).map((item, i) => (<div key={i} className={`text-xs ${textSub} flex items-center gap-2`}><span className="h-1 w-1 rounded-full bg-slate-400" /><span className="truncate">{item.artikel}</span></div>))}</div></div>
                  </div>
                  <div className={`${bgCard} rounded-3xl p-6 border space-y-4`}>
                    <div className="flex justify-between items-center"><div><h3 className={`text-xs font-bold ${textTitle}`}>Abfahrten Erfurt</h3><p className={`text-[10px] ${textSub}`}>Live</p></div><span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${badgeBlue}`}>LIVE</span></div>
                    <div className="space-y-2.5">{departures.slice(0, 3).map((d, i) => (<div key={i} className="flex justify-between items-center text-xs"><div className="flex items-center gap-2"><span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${badgeBlue}`}>{d.line}</span><span className={`truncate max-w-[120px] font-semibold ${textTitle}`}>{d.destination}</span></div><span className={`font-mono font-bold ${textSub}`}>{d.time}</span></div>))}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "todos" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>To-Do Liste</h2>
                  <p className={`text-xs ${textSub}`}>Wischen: Links = Erledigen, Rechts = Löschen</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-mono font-bold ${badgeBlue}`}>{offeneTodos.length} offen</span>
              </div>
              
              <div className={`${bgCard} rounded-2xl p-6 space-y-4`}>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <input 
                    type="text" 
                    placeholder="Neue Aufgabe..." 
                    value={neuesTodo} 
                    onChange={(e) => setNeuesTodo(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && addTodo()} 
                    className={`sm:col-span-6 w-full ${bgInput} border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none`} 
                  />
                  <select 
                    value={todoKategorie} 
                    onChange={(e) => setTodoKategorie(e.target.value)} 
                    className={`sm:col-span-3 w-full ${bgInput} border rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none`}
                  >
                    {TODO_KATEGORIEN.map(kat => <option key={kat} value={kat}>{kat}</option>)}
                  </select>
                  <select 
                    value={todoZustaendig} 
                    onChange={(e) => setTodoZustaendig(e.target.value)} 
                    className={`sm:col-span-1.5 w-full ${bgInput} border rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none`}
                  >
                    <option value="Beide">Beide</option>
                    <option value="Jonas">Jonas</option>
                    <option value="Lena">Lena</option>
                  </select>
                  <motion.button 
                    whileTap={tapGesture} 
                    onClick={addTodo} 
                    className={`sm:col-span-1.5 w-full px-4 py-2.5 ${buttonPrimary} text-xs font-bold rounded-xl flex items-center justify-center`}
                  >
                    Hinzufügen
                  </motion.button>
                </div>

                <div className="flex gap-2 overflow-x-auto pt-2 pb-1 scrollbar-hide">
                  {["Alle", ...TODO_KATEGORIEN, "Jonas", "Lena", "Beide"].map(filter => (
                    <button 
                      key={filter} 
                      onClick={() => setActiveTodoFilter(filter)} 
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeTodoFilter === filter ? `${badgeBlue} shadow-sm` : `${bgItem} ${textSub}`}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${bgCard} rounded-2xl p-6 space-y-3`}>
                {filteredTodos.map((todo) => (
                  <div key={todo.id} className="relative rounded-xl overflow-hidden">
                    <div className="absolute inset-0 flex justify-between items-center px-4 rounded-xl bg-gradient-to-r from-[#49111C] via-[#251A1E] to-[#5B8C5A] text-white">
                      <div className="flex items-center gap-1 text-xs font-bold text-rose-200"><Trash2 className="h-4 w-4" /> Löschen</div>
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-200">Erledigt <Check className="h-4 w-4" /></div>
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
                      className={`relative z-10 flex justify-between p-4 rounded-xl border ${bgItem} ${bgCard} shadow-sm cursor-grab`}
                    >
                      <div>
                        <span className={`text-sm font-semibold ${textTitle} block`}>{todo.aufgabe}</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeBlue}`}>{todo.kategorie}</span>
                          <span className="text-[10px] font-bold opacity-70">👤 {todo.zustaendig}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => markTodoErledigt(todo, "Erledigt")} className={`h-7 px-3 text-[11px] font-bold rounded-lg ${badgeGreen} hover:opacity-80 flex items-center gap-1`}>
                          <Check className="h-3.5 w-3.5" /> <span>Erledigen</span>
                        </button>
                      </div>
                    </motion.div>
                  </div>
                ))}
                {filteredTodos.length === 0 && (
                  <div className={`p-6 text-center text-xs ${textSub}`}>Keine offenen To-Dos vorhanden. 🎉</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "einkauf" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Einkaufsliste</h2>
                  <p className={`text-xs ${textSub}`}>Wischen: Links = Erledigen, Rechts = Löschen</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-mono font-bold ${badgeBlue}`}>{offeneEinkaeufe.length} offen</span>
              </div>

              <div className={`${bgCard} rounded-2xl p-5 space-y-2`}>
                <div className={`text-[11px] font-bold ${textSub}`}>Schnellwahl:</div>
                <div className="flex flex-wrap gap-2">
                  {SCHNELLWAHL_FAVORITEN.map((fav, idx) => (
                    <button key={idx} onClick={() => addEinkauf(fav)} className={`text-xs px-3 py-1.5 rounded-lg border font-semibold ${bgItem} ${textTitle}`}>
                      + {fav}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${bgCard} rounded-2xl p-6`}>
                <div className={`grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6 pb-6 border-b ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"}`}>
                  <input 
                    type="text" 
                    placeholder="Neuer Artikel..." 
                    value={neuerArtikel} 
                    onChange={(e) => setNeuerArtikel(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && addEinkauf()} 
                    className={`sm:col-span-8 w-full ${bgInput} border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none`} 
                  />
                  <select 
                    value={einkaufFuer} 
                    onChange={(e) => setEinkaufFuer(e.target.value)} 
                    className={`sm:col-span-2 w-full ${bgInput} border rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none`}
                  >
                    <option value="Beide">👥 Beide</option>
                    <option value="Jonas">👤 Nur Jonas</option>
                    <option value="Lena">👤 Nur Lena</option>
                  </select>
                  <motion.button whileTap={tapGesture} onClick={() => addEinkauf()} className={`sm:col-span-2 w-full px-4 py-2.5 ${buttonPrimary} text-xs font-bold rounded-xl flex items-center justify-center`}>
                    Hinzufügen
                  </motion.button>
                </div>

                <div className="space-y-6">
                  {Object.entries(einkaufNachKategorien).map(([kategorie, items]) => (
                    <div key={kategorie} className="space-y-2">
                      <div className={`text-[10px] font-bold ${textSub} uppercase tracking-wider px-1`}>{kategorie}</div>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="relative rounded-xl overflow-hidden">
                            <div className="absolute inset-0 flex justify-between items-center px-4 rounded-xl bg-gradient-to-r from-[#49111C] via-[#251A1E] to-[#5B8C5A] text-white">
                              <div className="flex items-center gap-1 text-xs font-bold text-rose-200"><Trash2 className="h-4 w-4" /> Löschen</div>
                              <div className="flex items-center gap-1 text-xs font-bold text-emerald-200">Erledigt <Check className="h-4 w-4" /></div>
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
                              className={`relative z-10 flex items-center justify-between p-3.5 rounded-xl border ${bgItem} ${bgCard} shadow-sm cursor-grab`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold ${textTitle}`}>{item.artikel}</span>
                                {item.fuer && item.fuer !== "Beide" && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badgeBlue}`}>
                                    👤 {item.fuer}
                                  </span>
                                )}
                              </div>
                              <button onClick={() => markEinkaufErledigt(item, "Erledigt")} className={`h-7 px-3 text-[11px] font-bold rounded-lg ${badgeGreen} hover:opacity-80 flex items-center gap-1`}>
                                <Check className="h-3.5 w-3.5" /> Erledigt
                              </button>
                            </motion.div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(einkaufNachKategorien).length === 0 && (
                    <div className={`p-6 text-center text-xs ${textSub}`}>Einkaufsliste ist leer. ✨</div>
                  )}
                </div>
              </div>
              </div>
          )}

          {activeTab === "gym" && !isWorkoutActive && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${textTitle} flex items-center gap-2`}>
                    <Dumbbell className={`h-5 w-5 ${accentBlue}`} /> Performance OS & Hevy Routinen
                  </h2>
                  <p className={`text-xs ${textSub}`}>Progressive Overload & Routine-Tracking für {activeUser}</p>
                </div>
              </div>

              {/* Workout Starter Templates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`${bgCard} rounded-2xl p-5 border flex flex-col justify-between space-y-4 hover:border-[#0A84FF]/50 transition-all`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#0A84FF]/20 text-[#0A84FF]">ROUTINE</span>
                      <Flame className="h-4 w-4 text-[#0A84FF]" />
                    </div>
                    <h3 className={`text-base font-bold ${textTitle}`}>Push Day</h3>
                    <p className={`text-xs ${textSub} mt-1`}>8 Übungen (Brust, Schultern, Trizeps)</p>
                  </div>
                  <button onClick={() => startWorkout("push")} className="w-full py-2.5 bg-[#0A84FF] hover:bg-[#0070E0] text-white text-xs font-bold rounded-xl transition-all shadow-md">
                    Push Workout starten
                  </button>
                </div>

                <div className={`${bgCard} rounded-2xl p-5 border flex flex-col justify-between space-y-4 hover:border-[#32D74B]/50 transition-all`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#32D74B]/20 text-[#32D74B]">ROUTINE</span>
                      <Activity className="h-4 w-4 text-[#32D74B]" />
                    </div>
                    <h3 className={`text-base font-bold ${textTitle}`}>Pull Day</h3>
                    <p className={`text-xs ${textSub} mt-1`}>5 Übungen (Rücken, Bizeps)</p>
                  </div>
                  <button onClick={() => startWorkout("pull")} className="w-full py-2.5 bg-[#32D74B] hover:bg-[#28B840] text-black text-xs font-bold rounded-xl transition-all shadow-md">
                    Pull Workout starten
                  </button>
                </div>

                <div className={`${bgCard} rounded-2xl p-5 border flex flex-col justify-between space-y-4`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${badgeBlue}`}>FREIES TRAINING</span>
                    </div>
                    <h3 className={`text-base font-bold ${textTitle}`}>Individuell</h3>
                    <p className={`text-xs ${textSub} mt-1`}>Freie Übungsauswahl ohne Template</p>
                  </div>
                  <button onClick={() => startWorkout("empty")} className={`w-full py-2.5 ${buttonPrimary} text-xs font-bold rounded-xl transition-all`}>
                    Leeres Training starten
                  </button>
                </div>
              </div>

              {/* KPI Quick Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className={`${bgCard} rounded-2xl p-4 border`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${textSub}`}>All-Time PR (1RM)</span>
                    <span className="text-xs">🏆</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className={`text-2xl font-black font-mono ${accentBlue}`}>{allTimePR}</span>
                    <span className={`text-xs font-bold ${textSub}`}>kg</span>
                  </div>
                </div>

                <div className={`${bgCard} rounded-2xl p-4 border`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${textSub}`}>Max. Arbeitsgewicht</span>
                    <span className="text-xs">⚡</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className={`text-2xl font-black font-mono ${textTitle}`}>{maxWeightLifted}</span>
                    <span className={`text-xs font-bold ${textSub}`}>kg</span>
                  </div>
                </div>

                <div className={`${bgCard} rounded-2xl p-4 border`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${textSub}`}>Trend vs. Vorwoche</span>
                    <span className="text-xs">📈</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className={`text-2xl font-black font-mono ${parseFloat(growthRate) >= 0 ? accentGreen : "text-rose-500"}`}>
                      {parseFloat(growthRate) > 0 ? `+${growthRate}` : `${growthRate}`}%
                    </span>
                  </div>
                </div>

                <div className={`${bgCard} rounded-2xl p-4 border`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${textSub}`}>Lifetime Tonnage</span>
                    <span className="text-xs">🏋️</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className={`text-2xl font-black font-mono ${textTitle}`}>{(totalVolumeLifetime / 1000).toFixed(1)}</span>
                    <span className={`text-xs font-bold ${textSub}`}>Tonnen</span>
                  </div>
                </div>
              </div>

              {/* HIER GEHÖRT DAS MCI BANNER HIN: */}
              <div className={`${bgCard} rounded-3xl p-5 border border-[#0A84FF]/20 bg-gradient-to-r ${isDarkMode ? "from-[#0A84FF]/10 via-transparent to-transparent" : "from-[#0A84FF]/5 via-transparent to-transparent"} space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[#0A84FF]/20 text-[#0A84FF] flex items-center justify-center font-black">
                      MCI
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#0A84FF]">Overload Intelligence</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeGreen}`}>{overloadInfo.status}</span>
                      </div>
                      <p className={`text-xs ${textTitle} font-medium mt-0.5`}>{overloadInfo.desc}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-mono font-bold shrink-0">
                    <div className="text-center"><span className="text-[10px] text-slate-400 block font-sans">Brust</span>{chestSets} Sätze</div>
                    <div className="text-center"><span className="text-[10px] text-slate-400 block font-sans">Rücken</span>{backSets} Sätze</div>
                    <div className="text-center"><span className="text-[10px] text-slate-400 block font-sans">Schulter</span>{shoulderSets} Sätze</div>
                    <div className="text-center"><span className="text-[10px] text-slate-400 block font-sans">Arme</span>{armSets} Sätze</div>
                  </div>
                </div>
              </div>

              {/* Hypertrophy Volume Landmarks Grid */}
              <div className={`${bgCard} rounded-3xl p-6 border space-y-4`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Hypertrophie-Volumen (Woche)</h3>
                    <p className={`text-xs font-semibold ${textTitle} mt-0.5`}>Optimaler Bereich: 10–20 harte Sätze / Muskelgruppe</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeGreen}`}>MAV Matrix</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { name: "Brust", count: chestSets },
                    { name: "Rücken", count: backSets },
                    { name: "Schultern", count: shoulderSets },
                    { name: "Arme", count: armSets }
                  ].map((m, i) => {
                    const isOptimal = m.count >= 10 && m.count <= 20;
                    const isLow = m.count < 10;
                    return (
                      <div key={i} className={`p-3 rounded-2xl border ${bgItem} space-y-2`}>
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className={textTitle}>{m.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            isOptimal ? badgeGreen : isLow ? badgeBlue : "bg-rose-500/20 text-rose-400"
                          }`}>
                            {isOptimal ? "Optimal" : isLow ? "Steigern" : "Deload"}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-2xl font-black font-mono ${textTitle}`}>{m.count}</span>
                          <span className={`text-[10px] font-bold ${textSub}`}>/ 16 Sätze</span>
                        </div>
                        <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${isOptimal ? "bg-[#5B8C5A]" : isLow ? "bg-[#005377]" : "bg-rose-500"}`} 
                            style={{ width: `${Math.min(100, (m.count / 20) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Analytics & Insights Suite */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  {/* Global Composite Strength & Hypertrophy Index */}
                  <div className={`${bgCard} rounded-3xl p-6 border space-y-5 bg-gradient-to-br ${isDarkMode ? "from-[#0A84FF]/10 via-transparent to-transparent" : "from-[#0A84FF]/5 via-transparent to-transparent"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-[#0A84FF]">MCI Total Strength Index</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeGreen}`}>All-Time Entwicklung</span>
                        </div>
                        <h3 className={`text-lg font-extrabold ${textTitle} mt-0.5`}>Gesamtkraft & Hypertrophie-Level</h3>
                        <p className={`text-xs ${textSub}`}>Kombinierter 1RM-Score über alle Hauptverbundübungen</p>
                      </div>

                      <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-black/5 dark:border-white/5 shrink-0">
                        <div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${textSub} block`}>Gesamt-Score</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black font-mono text-[#0A84FF]">{currentCompositeScore}</span>
                            <span className={`text-xs font-bold ${textSub}`}>kg</span>
                          </div>
                        </div>
                        <div className="h-8 w-px bg-black/10 dark:bg-white/10" />
                        <div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${textSub} block`}>All-Time Zuwachs</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black font-mono text-emerald-500">+{totalCompositeGainKg}</span>
                            <span className="text-xs font-bold text-emerald-500 font-mono">({totalCompositeGainPercent}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chart: Globaler Kraftanstieg */}
                    <div className="h-[220px] w-full pt-1">
                      {globalStrengthHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={globalStrengthHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorGlobalScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#32D74B" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#32D74B" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#ffffff10" : "#00000010"} />
                            <XAxis dataKey="datum" stroke={isDarkMode ? "#777" : "#aaa"} fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis domain={['dataMin - 10', 'dataMax + 10']} stroke={isDarkMode ? "#777" : "#aaa"} fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className={`${bgCard} p-3 rounded-xl border shadow-xl text-xs space-y-1`}>
                                      <div className="font-bold text-slate-400">{data.rawDatum}</div>
                                      <div className="font-extrabold text-sm text-emerald-500">Composite Score: {data.compositeScore} kg</div>
                                      <div className="text-slate-400">Erfasste Hauptübungen: {data.trackedCompounds}</div>
                                    </div>
                                  );
                                }
                                return null;
                              }} 
                            />
                            <Area type="monotone" dataKey="compositeScore" stroke="#32D74B" strokeWidth={3} fillOpacity={1} fill="url(#colorGlobalScore)" dot={{ r: 4, strokeWidth: 2, fill: isDarkMode ? "#100A0B" : "#FFFFFF" }} activeDot={{ r: 6 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-slate-500/20 rounded-xl">
                          <span className={`text-xs ${textSub}`}>Noch nicht genügend Daten für Gesamtscore.</span>
                        </div>
                      )}
                    </div>

                    {/* Muskelgruppen-Kraftbalance Bar */}
                    <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
                      <div className={`text-[10px] font-bold ${textSub} uppercase tracking-wider`}>Kraftbalance nach Muskelgruppen (1RM Peak)</div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className={`p-2.5 rounded-xl border ${bgItem}`}>
                          <span className="text-[10px] text-slate-400 block font-sans font-bold">Push (Brust)</span>
                          <span className={`text-sm font-black font-mono ${textTitle}`}>{chest1RM} kg</span>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${bgItem}`}>
                          <span className="text-[10px] text-slate-400 block font-sans font-bold">Pull (Rücken)</span>
                          <span className={`text-sm font-black font-mono ${textTitle}`}>{back1RM} kg</span>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${bgItem}`}>
                          <span className="text-[10px] text-slate-400 block font-sans font-bold">Schultern</span>
                          <span className={`text-sm font-black font-mono ${textTitle}`}>{shoulder1RM} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Kraftentwicklung Selector & Area Chart */}
                  <div className={`${bgCard} rounded-3xl p-6 border space-y-4`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>1RM Progression (Maximal-Kraftkurve)</h3>
                        <p className={`text-sm font-bold ${textTitle} mt-0.5`}>{activeExerciseName}</p>
                      </div>
                      <select 
                        value={gymUebung} 
                        onChange={(e) => setGymUebung(e.target.value)} 
                        className={`text-xs font-semibold ${bgInput} border rounded-xl px-3 py-2 focus:outline-none`}
                      >
                        {[...PUSH_ROUTINE, ...PULL_ROUTINE].map(ex => (
                          <option key={ex} value={ex}>{ex}</option>
                        ))}
                      </select>
                    </div>

                    <div className="h-[240px] w-full pt-2">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isDarkMode ? "#82CBEE" : "#005377"} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={isDarkMode ? "#82CBEE" : "#005377"} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#ffffff10" : "#00000010"} />
                            <XAxis dataKey="datum" stroke={isDarkMode ? "#777" : "#aaa"} fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke={isDarkMode ? "#777" : "#aaa"} fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className={`${bgCard} p-3 rounded-xl border shadow-xl text-xs space-y-1`}>
                                      <div className="font-bold text-slate-400">{data.rawDatum}</div>
                                      <div className="font-extrabold text-sm text-[#0A84FF]">1RM: {data.oneRepMax} kg</div>
                                      <div className="text-slate-400">Top-Satz: {data.bestWeight} kg × {data.bestReps} WDH</div>
                                      <div className="text-slate-400">Workload: {data.volumen} kg ({data.setCount} Sätze)</div>
                                    </div>
                                  );
                                }
                                return null;
                              }} 
                            />
                            <Area type="monotone" dataKey="oneRepMax" stroke={isDarkMode ? "#82CBEE" : "#005377"} strokeWidth={3} fillOpacity={1} fill="url(#color1RM)" dot={{ r: 4, strokeWidth: 2, fill: isDarkMode ? "#100A0B" : "#FFFFFF" }} activeDot={{ r: 6 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-500/20 rounded-xl px-4 text-center">
                          <span className={`text-xs font-medium ${textSub}`}>Keine Sessions für diese Übung gefunden.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Session Workload Tonnage Chart */}
                  <div className={`${bgCard} rounded-3xl p-6 border space-y-4`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Workout Workload (Gesamtgewicht pro Training)</h3>
                        <p className={`text-xs font-semibold ${textTitle} mt-0.5`}>Volumen-Reiz für Muskelwachstum</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeGreen}`}>Tonnage (kg)</span>
                    </div>
                    <div className="h-[160px] w-full">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#ffffff10" : "#00000010"} />
                            <XAxis dataKey="datum" stroke={isDarkMode ? "#777" : "#aaa"} fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke={isDarkMode ? "#777" : "#aaa"} fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1E1418' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
                            <Bar dataKey="volumen" fill={isDarkMode ? "#7DB47C" : "#5B8C5A"} radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-slate-500/20 rounded-xl">
                          <span className={`text-xs ${textSub}`}>Keine Sätze vorhanden.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rechte Spalte: Trainings-Historie (Workouts) */}
                <div className="lg:col-span-4 space-y-6">
                  <div className={`${bgCard} rounded-3xl p-6 border space-y-4`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>Trainings-Historie</h3>
                        <p className={`text-xs font-semibold ${textTitle} mt-0.5`}>Absolvierte Sessions ({workoutHistory.length})</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeBlue}`}>Log</span>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {workoutHistory.length === 0 ? (
                        <div className={`p-6 text-center text-xs ${textSub}`}>Noch keine Workouts protokolliert.</div>
                      ) : (
                        workoutHistory.map((w, idx) => (
                          <div key={idx} className={`p-4 rounded-2xl border ${bgItem} space-y-2.5 transition-all hover:border-[#0A84FF]/40`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg ${
                                  w.type === "PUSH" 
                                    ? "bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30" 
                                    : w.type === "PULL" 
                                    ? "bg-[#32D74B]/20 text-[#32D74B] border border-[#32D74B]/30"
                                    : badgeBlue
                                }`}>
                                  {w.type}
                                </span>
                                <span className={`text-xs font-bold ${textTitle}`}>{w.formattedDate}</span>
                              </div>
                              <span className={`text-xs font-mono font-bold ${accentBlue}`}>{w.totalVolume} kg</span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                              <span>{w.totalSets} Sätze absolviert</span>
                              <span>{w.uebungen.length} Übungen</span>
                            </div>

                            <div className="flex flex-wrap gap-1 pt-1 border-t border-black/5 dark:border-white/5">
                              {w.uebungen.map((uebung, uIdx) => (
                                <span key={uIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 font-medium truncate max-w-[150px]">
                                  {uebung}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "putzplan" && (
            <div className="space-y-6"><h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Putzplan</h2><div className={`${bgCard} rounded-2xl p-6 space-y-3`}>{aufgaben.map((a, idx) => (<div key={idx} className={`flex justify-between items-center p-4 rounded-xl border ${bgItem}`}><div><div className={`font-bold text-sm ${textTitle}`}>{a.aufgabe}</div><div className={`text-[11px] ${textSub}`}>Intervall: {a.intervall} Tage | Letztes Mal: {a.letztes_datum}</div></div><motion.button whileTap={tapGesture} onClick={() => markAufgabeErledigt(a)} className={`h-8 px-4 text-xs font-bold rounded-lg border ${isDarkMode ? "bg-white/5" : "bg-[#FAF8F5]"} shadow-sm`}>Erledigt</motion.button></div>))}</div></div>
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
    <div className="flex justify-between items-center">
      <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Pinnwand</h2>
      <motion.button whileTap={tapGesture} onClick={() => setShowNoteModal(true)} className={`px-4 py-2 ${buttonPrimary} text-xs font-bold rounded-xl`}>
        <Plus className="h-4 w-4 inline mr-1" /> Notiz
      </motion.button>
    </div>

    {showNoteModal && (
      <div className={`${bgCard} rounded-2xl p-6 border space-y-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input 
            type="text" 
            placeholder="Titel..." 
            value={newNoteTitle} 
            onChange={e => setNewNoteTitle(e.target.value)} 
            className={`sm:col-span-2 ${bgInput} border rounded-xl px-4 py-2 text-xs font-medium`} 
          />
          <select 
            value={newNoteCategory} 
            onChange={e => setNewNoteCategory(e.target.value)} 
            className={`${bgInput} border rounded-xl px-3 py-2 text-xs font-medium`}
          >
            <option value="Allgemein">Allgemein</option>
            <option value="WLAN & Haus">WLAN & Haus</option>
            <option value="Wichtig">Wichtig</option>
          </select>
        </div>
        <textarea 
          placeholder="Inhalt... (Tipp: Zeilen mit '- [ ] ' werden zu Checkboxen)" 
          value={newNoteContent} 
          onChange={e => setNewNoteContent(e.target.value)} 
          className={`w-full ${bgInput} border rounded-xl px-4 py-3 text-xs font-medium h-28`} 
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowNoteModal(false)} className={`px-4 py-2 text-xs font-bold ${textSub}`}>
            Abbrechen
          </button>
          <button onClick={addNote} className={`px-6 py-2 ${buttonPrimary} text-xs font-bold rounded-xl`}>
            Speichern
          </button>
        </div>
      </div>
    )}

    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {noteCategories.map(cat => (
        <button 
          key={cat} 
          onClick={() => setActiveNoteCategory(cat)} 
          className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeNoteCategory === cat ? `${badgeBlue} shadow-sm` : `${bgItem} ${textSub}`}`}
        >
          {cat}
        </button>
      ))}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          setNotes(prev => prev.map(n => n.id === note.id ? { ...n, content: newContent } : n));
          await supabase.from("notizen").update({ content: newContent }).eq("id", note.id);
        };

        return (
          <motion.div whileHover={{ scale: 1.02 }} transition={springConfig} key={note.id} className={`${bgCard} rounded-2xl p-5 border space-y-3`}>
            <div className="flex justify-between items-start">
              <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${badgeGreen}`}>{note.category}</span>
            </div>
            <h3 className={`text-sm font-bold ${textTitle}`}>{note.title}</h3>
            <div className="space-y-1.5 text-xs">
              {lines.map((line, idx) => {
                const isTodo = line.trim().startsWith("- [ ]") || line.trim().startsWith("- [x]");
                const isChecked = line.trim().startsWith("- [x]");
                const itemText = line.replace(/^- \[[ x]\]\s*/, "");

                if (isTodo) {
                  return (
                    <div key={idx} onClick={() => toggleCheckItem(idx)} className="flex items-center gap-2 cursor-pointer py-0.5 hover:opacity-80 select-none">
                      <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0 ${isChecked ? "bg-[#5B8C5A] border-[#5B8C5A] text-white" : "border-slate-400"}`}>
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className={`${isChecked ? "line-through opacity-50" : textTitle}`}>{itemText}</span>
                    </div>
                  );
                }

                return <p key={idx} className={`${textSub} whitespace-pre-line`}>{line}</p>;
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
)}

          {activeTab === "kalender" && (
            <div className="space-y-6"><h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Kalender & Termine</h2><div className={`${bgCard} rounded-3xl p-6 border`}><div className="flex justify-between mb-4"><div className={`flex p-1 rounded-xl border ${bgItem}`}><button onClick={() => setCalendarMode("month")} className={`px-3 py-1 rounded-lg text-xs font-bold ${calendarMode === "month" ? "bg-[#005377] text-white" : textSub}`}>Monat</button><button onClick={() => setCalendarMode("week")} className={`px-3 py-1 rounded-lg text-xs font-bold ${calendarMode === "week" ? "bg-[#005377] text-white" : textSub}`}>Woche</button></div><div className="flex items-center gap-1"><button onClick={handlePrev} className={`p-2 rounded-xl border ${bgItem}`}><ChevronLeft className="h-4 w-4" /></button><button onClick={handleNext} className={`p-2 rounded-xl border ${bgItem}`}><ChevronRight className="h-4 w-4" /></button></div></div>
                {calendarMode === "month" && (
                  <div className="space-y-2"><div className="grid grid-cols-7 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 py-2"><span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span></div><div className="grid grid-cols-7 gap-2">{Array.from({ length: startDayIndex }).map((_, i) => <div key={`empty-${i}`} className="h-24 rounded-2xl opacity-10 bg-black/5 dark:bg-white/5" />)}{Array.from({ length: daysInMonth }).map((_, i) => { const dayNum = i + 1; const dateObj = new Date(year, month, dayNum); const dayEvents = getEventsForDate(dateObj); const isToday = new Date().toDateString() === dateObj.toDateString(); return (<div key={`day-${dayNum}`} className={`h-28 rounded-2xl p-2.5 border flex flex-col justify-between transition-all ${isToday ? "border-[#005377] bg-[#005377]/10" : `${bgItem} hover:border-slate-400`}`}><div className="flex justify-between items-center"><span className={`text-xs font-bold font-mono ${isToday ? accentBlue : textTitle}`}>{dayNum}</span></div><div className="space-y-1 overflow-y-auto max-h-[60px] scrollbar-hide">{dayEvents.map((ev, idx) => <div key={idx} className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate ${ev.type === "putz" ? "bg-[#49111C]/20 text-[#E27B88] border border-[#49111C]/30" : "bg-[#005377]/20 text-[#3A8EBA] dark:text-[#82CBEE]"}`}>{ev.title}</div>)}</div></div>); })}</div></div>
                )}
                {calendarMode === "week" && (
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">{getWeekDays().map((d, i) => { const dayEvents = getEventsForDate(d); const isToday = new Date().toDateString() === d.toDateString(); return (<div key={i} className={`min-h-[150px] rounded-2xl p-4 border flex flex-col ${isToday ? "border-[#005377] bg-[#005377]/10" : bgItem}`}><div className={`text-[10px] font-bold ${textSub}`}>{d.toLocaleDateString("de-DE", { weekday: 'short' })}</div><div className={`text-lg font-extrabold font-mono mb-3 ${isToday ? accentBlue : textTitle}`}>{d.getDate()}. {d.toLocaleDateString("de-DE", { month: 'short' })}</div><div className="space-y-2 flex-1">{dayEvents.map((ev, idx) => <div key={idx} className={`p-2 rounded-xl text-xs font-bold truncate ${ev.type === "putz" ? "bg-[#49111C]/20 text-[#E27B88]" : "bg-[#005377]/20 text-[#3A8EBA]"}`}>{ev.title}</div>)}</div></div>); })}</div>
                )}
              </div></div>
          )}
        </div>
      </main>

      {/* Persistente Live-Workout Leiste bei minimiertem Training */}
      <AnimatePresence>
        {isWorkoutActive && isWorkoutMinimized && (
          <motion.div 
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={springConfig}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.2rem)] md:bottom-6 left-3 right-3 md:left-72 md:right-8 z-40"
          >
            <div className="bg-[#121214] border border-[#0A84FF]/40 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between text-white backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#0A84FF]/20 text-[#0A84FF] flex items-center justify-center">
                  <Activity className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wide text-white uppercase">Laufendes Workout</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ⏱️ {formatDauer(workoutDauer)} • {currentWorkoutSets} Sätze • {currentWorkoutVolume} kg
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setIsWorkoutMinimized(false)}
                className="px-4 py-2 bg-[#0A84FF] hover:bg-[#0070E0] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <span>Fortsetzen</span>
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] md:bottom-8 right-5 md:right-8 z-50">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.85, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 15 }} className="absolute bottom-16 right-0 flex flex-col gap-2.5 items-end mb-2 w-max">
              <button onClick={() => { setActiveTab("todos"); setIsFabOpen(false); }} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl shadow-lg border ${bgCard} ${textTitle} text-xs font-bold hover:scale-105 transition-all`}><span>To-Do erstellen</span><div className="h-7 w-7 rounded-lg bg-[#005377] text-white flex items-center justify-center"><ListTodo className="h-4 w-4" /></div></button>
              <button onClick={() => { setActiveTab("notizen"); setShowNoteModal(true); setIsFabOpen(false); }} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl shadow-lg border ${bgCard} ${textTitle} text-xs font-bold hover:scale-105 transition-all`}><span>Notiz schreiben</span><div className="h-7 w-7 rounded-lg bg-[#5B8C5A] text-white flex items-center justify-center"><StickyNote className="h-4 w-4" /></div></button>
              <button onClick={() => { setActiveTab("einkauf"); setIsFabOpen(false); }} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl shadow-lg border ${bgCard} ${textTitle} text-xs font-bold hover:scale-105 transition-all`}><span>Einkauf hinzufügen</span><div className="h-7 w-7 rounded-lg bg-[#502419] text-white flex items-center justify-center"><ShoppingCart className="h-4 w-4" /></div></button>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsFabOpen(!isFabOpen)} className={`h-14 w-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 ${isFabOpen ? "bg-[#49111C] text-white rotate-45" : "bg-[#005377] text-white hover:scale-105 shadow-[#005377]/40"}`}><Plus className="h-6 w-6" /></button>
      </div>

      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${isDarkMode ? "bg-[#100A0B]/90 border-white/[0.08]" : "bg-[#FAF8F5]/90 border-[#E8E2D9]"} backdrop-blur-xl border-t px-3 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] flex justify-around items-center`}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center min-w-[42px] h-11 gap-0.5 rounded-lg relative ${activeTab === tab.id ? `${accentBlue} font-bold` : textSub}`}><tab.icon className="h-4 w-4" /><span className="text-[9px] tracking-tight">{tab.label}</span></button>
        ))}
      </nav>
    </div>
  );
}