import React, { useState, useEffect } from "react";
import { Lock, Trash2, Check, ChevronDown, ChevronRight, Plus, Globe } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

interface Sonderausgabe {
  id: string;
  was: string;
  hoehe: number;
  wann: string;
}

interface BacklogItem {
  id: string;
  was: string;
  hoehe: number;
}

interface WishlistItem {
  id: string;
  category: string;
  subcategory?: string;
  title: string;
  completed: boolean;
  parent_id?: string | null;
  embed_title?: string;
  embed_desc?: string;
  embed_url?: string;
  embed_img?: string;
}

interface FinanceViewProps {
  theme: any;
}

export function FinanceView({ theme }: FinanceViewProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const SECRET_PIN = "07570";

  const {
    bgCard,
    bgItem,
    bgInput,
    textTitle,
    textSub,
    accentBlue,
    badgeBlue,
    buttonPrimary,
    isDarkMode
  } = theme;

  // Supabase Settings
  const [aktuellerSaldo, setAktuellerSaldo] = useState<number>(500.0);
  const [fixEinnahmen, setFixEinnahmen] = useState<number>(880.0);
  const [fixAusgaben, setFixAusgaben] = useState<number>(70.0);
  const [fokusMonat, setFokusMonat] = useState<number>(8);
  const [zielDatum, setZielDatum] = useState<string>("2026-08-31");

  // Sonderausgaben
  const [sonderausgaben, setSonderausgaben] = useState<Sonderausgabe[]>([
    { id: "1", was: "Miete", hoehe: 380.0, wann: "2026-09-01" },
    { id: "2", was: "Geburtstagsgeschenk Lena", hoehe: 200.0, wann: "2026-09-05" },
    { id: "3", was: "Urlaub Gardasee", hoehe: 300.0, wann: "2026-09-22" },
    { id: "4", was: "Miete", hoehe: 380.0, wann: "2026-10-01" },
    { id: "5", was: "Miete", hoehe: 380.0, wann: "2026-11-01" },
    { id: "6", was: "Weihnachtsgeschenke", hoehe: 450.0, wann: "2026-11-20" },
    { id: "7", was: "Valentinstag", hoehe: 250.0, wann: "2027-02-14" },
    { id: "8", was: "Urlaub 2027", hoehe: 2000.0, wann: "2027-03-15" }
  ]);

  const [backlog, setBacklog] = useState<BacklogItem[]>([
    { id: "b1", was: "Braun Series 9 Pro", hoehe: 250.0 }
  ]);
  const [backlogDates, setBacklogDates] = useState<Record<string, string>>({
    b1: "2026-08-26"
  });

  // Inputs Finanzen
  const [neuWas, setNeuWas] = useState("");
  const [neuHoehe, setNeuHoehe] = useState<string>("");
  const [neuWann, setNeuWann] = useState("2026-08-26");
  const [neuBWas, setNeuBWas] = useState("");
  const [neuBHoehe, setNeuBHoehe] = useState<string>("");

  // Wishlist State (Notion-Style)
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Produktivität/Home": true,
    Lifestyle: true
  });

  // -------------------------------------------------------------
  // SUPABASE: LADEN
  // -------------------------------------------------------------
  const loadAllFinanceData = async () => {
    try {
      const { data: setRes } = await supabase.from("finanz_settings").select("key, value");
      if (setRes && setRes.length > 0) {
        const map: Record<string, string> = {};
        setRes.forEach((row: any) => {
          map[row.key] = row.value;
        });

        if (map["saldo"] !== undefined) setAktuellerSaldo(parseFloat(map["saldo"]) || 0);
        if (map["fix_einnahmen"] !== undefined)
          setFixEinnahmen(parseFloat(map["fix_einnahmen"]) || 0);
        if (map["fix_ausgaben"] !== undefined) setFixAusgaben(parseFloat(map["fix_ausgaben"]) || 0);
        if (map["fokus_monat"] !== undefined) setFokusMonat(parseInt(map["fokus_monat"], 10) || 8);
        if (map["ziel_datum"] !== undefined) setZielDatum(map["ziel_datum"]);
      }

      const { data: listRes } = await supabase
        .from("sonderausgaben")
        .select("*")
        .eq("status", "Offen");
      if (listRes && listRes.length > 0) {
        const active: Sonderausgabe[] = [];
        const bLog: BacklogItem[] = [];
        listRes.forEach((row: any) => {
          if (row.wann && row.wann.trim() !== "") {
            active.push({ id: row.id, was: row.was, hoehe: parseFloat(row.hoehe), wann: row.wann });
          } else {
            bLog.push({ id: row.id, was: row.was, hoehe: parseFloat(row.hoehe) });
          }
        });
        active.sort((a, b) => new Date(a.wann).getTime() - new Date(b.wann).getTime());
        setSonderausgaben(active);
        setBacklog(bLog);
      }

      const { data: wishRes } = await supabase
        .from("wishlist_items")
        .select("*")
        .order("created_at", { ascending: true });
      if (wishRes && wishRes.length > 0) {
        setWishlist(wishRes);
      } else {
        setWishlist([
          { id: "w1", category: "Produktivität/Home", title: "Schreibtisch", completed: true },
          {
            id: "w2",
            category: "Produktivität/Home",
            title: "Ball für Schreibtisch",
            completed: false
          },
          {
            id: "w3",
            category: "Lifestyle",
            subcategory: "Oberteile",
            title: "Creme Leinenhose lang",
            completed: false,
            embed_title: "Hose sand Slim Leg Tapered",
            embed_desc: "Frühjahr/Sommer Leinen Baumwolle von Di Sondrio, Italien",
            embed_url: "https://suitsupply.com/de-de/men/trousers/hose-sand-slim-leg-tapered",
            embed_img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&q=80"
          },
          {
            id: "w4",
            category: "Lifestyle",
            subcategory: "Oberteile",
            title: "Navy Leinenhose lang",
            completed: false
          },
          {
            id: "w5",
            category: "Lifestyle",
            subcategory: "Oberteile",
            title: "Grauer Hoodie",
            completed: false
          },
          {
            id: "w6",
            category: "Lifestyle",
            subcategory: "Oberteile",
            title: "Navy Hoodie",
            completed: false
          },
          {
            id: "w7",
            category: "Lifestyle",
            subcategory: "Oberteile",
            title: "Creme Sweatshirt",
            completed: false
          },
          {
            id: "w8",
            category: "Lifestyle",
            subcategory: "Oberteile",
            title: "Gerippter Merino Rundhalspullover hellbraun",
            completed: false,
            embed_title: "Gerippter Merino Rundhalspullover hellbraun",
            embed_desc: "Reine Schurwolle",
            embed_url: "https://suitsupply.com/de-de/men/knitwear/gerippter-merino-rundhals",
            embed_img: "https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?w=500&q=80"
          },
          {
            id: "w9",
            category: "Lifestyle",
            subcategory: "Hosen",
            title: "Badehose",
            completed: false
          },
          {
            id: "w10",
            category: "Lifestyle",
            subcategory: "Hosen",
            title: "Leinenhose (oder Leinen-Misch)",
            completed: false
          }
        ]);
      }
    } catch (e) {
      console.error("Fehler beim Laden:", e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllFinanceData();
    }
  }, [isAuthenticated]);

  const updateSetting = async (key: string, val: string | number) => {
    await supabase.from("finanz_settings").upsert({ key, value: String(val) });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === SECRET_PIN) {
      setIsAuthenticated(true);
    } else {
      alert("Falscher PIN!");
      setPinInput("");
    }
  };

  const getBonus = (m: number): number => {
    const boni: Record<number, number> = {
      2: 0.7 * 1452 * 0.8,
      6: 0.85 * 1452 * 0.8 * 0.5,
      7: 227.0,
      9: 0.275 * 1452 * 0.8,
      11: 1452 * 0.5 * 0.8
    };
    return boni[m] || 0.0;
  };

  const simulationsMonate: { jahr: number; monat: number }[] = [
    ...[8, 9, 10, 11, 12].map((m) => ({ jahr: 2026, monat: m })),
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({ jahr: 2027, monat: m }))
  ];

  let laufenderSaldo = aktuellerSaldo;
  const prognoseListe = simulationsMonate.map(({ jahr, monat }) => {
    const b = getBonus(monat);
    const gehaltEnde = fixEinnahmen + b;
    const fixMonat = jahr === 2026 && monat === 8 ? 0.0 : fixAusgaben;

    const extraMonat = sonderausgaben
      .filter((s) => {
        const d = new Date(s.wann);
        return d.getFullYear() === jahr && d.getMonth() + 1 === monat;
      })
      .reduce((sum, item) => sum + item.hoehe, 0);

    const freiVerfuegbar = laufenderSaldo - fixMonat - extraMonat;
    const endSaldo = freiVerfuegbar + gehaltEnde;
    laufenderSaldo = endSaldo;

    return {
      jahr,
      monat,
      gehaltEnde,
      fixMonat,
      extraMonat,
      ausgabenGesamt: fixMonat + extraMonat,
      freiVerfuegbar
    };
  });

  const handleAddAusgabe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!neuWas || !neuHoehe) return;
    const item: Sonderausgabe = {
      id: crypto.randomUUID(),
      was: neuWas,
      hoehe: parseFloat(neuHoehe),
      wann: neuWann
    };
    setSonderausgaben((p) =>
      [...p, item].sort((a, b) => new Date(a.wann).getTime() - new Date(b.wann).getTime())
    );
    setNeuWas("");
    setNeuHoehe("");
    toast.success("Ausgabe gespeichert");
    await supabase.from("sonderausgaben").insert({ ...item, status: "Offen" });
  };

  const handleDeleteAusgabe = async (id: string, asDone = false) => {
    setSonderausgaben((p) => p.filter((x) => x.id !== id));
    if (asDone) {
      toast.success("Als erledigt verbucht 💸");
      await supabase.from("sonderausgaben").update({ status: "Erledigt" }).eq("id", id);
    } else {
      toast.info("Ausgabe gelöscht 🗑️");
      await supabase.from("sonderausgaben").delete().eq("id", id);
    }
  };

  const handleAddBacklog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!neuBWas || !neuBHoehe) return;
    const newId = crypto.randomUUID();
    const item: BacklogItem = { id: newId, was: neuBWas, hoehe: parseFloat(neuBHoehe) };
    setBacklog((p) => [...p, item]);
    setBacklogDates((p) => ({ ...p, [newId]: "2026-08-26" }));
    setNeuBWas("");
    setNeuBHoehe("");
    toast.success("Auf die Wunschliste gesetzt 📝");
    await supabase.from("sonderausgaben").insert({ ...item, wann: null, status: "Offen" });
  };

  const handlePlanBacklog = async (item: BacklogItem) => {
    const planDate = backlogDates[item.id] || "2026-08-26";
    setSonderausgaben((p) =>
      [...p, { ...item, wann: planDate }].sort(
        (a, b) => new Date(a.wann).getTime() - new Date(b.wann).getTime()
      )
    );
    setBacklog((p) => p.filter((x) => x.id !== item.id));
    toast.success("In Sonderausgaben eingeplant ⬆️");
    await supabase.from("sonderausgaben").update({ wann: planDate }).eq("id", item.id);
  };

  const handleDeleteBacklog = async (id: string) => {
    setBacklog((p) => p.filter((x) => x.id !== id));
    toast.info("Wunsch gelöscht 🗑️");
    await supabase.from("sonderausgaben").delete().eq("id", id);
  };

  // -------------------------------------------------------------
  // NOTION-STYLE WISHLIST FUNKTIONEN
  // -------------------------------------------------------------

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const toggleWishCheck = async (id: string, current: boolean) => {
    setWishlist((prev) => prev.map((w) => (w.id === id ? { ...w, completed: !current } : w)));
    await supabase.from("wishlist_items").update({ completed: !current }).eq("id", id);
  };

  const handleDeleteWish = async (id: string) => {
    setWishlist((prev) => prev.filter((w) => w.id !== id));
    await supabase.from("wishlist_items").delete().eq("id", id);
  };

  const updateWishTitleLocal = (id: string, newTitle: string) => {
    setWishlist((prev) => prev.map((w) => (w.id === id ? { ...w, title: newTitle } : w)));
  };

  const saveWishTitleDB = async (id: string, newTitle: string) => {
    await supabase.from("wishlist_items").update({ title: newTitle }).eq("id", id);
  };

  const handleWishKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    item: WishlistItem
  ) => {
    // ENTER: Neue Zeile darunter einfügen
    if (e.key === "Enter") {
      e.preventDefault();
      const newItem: WishlistItem = {
        id: crypto.randomUUID(),
        category: item.category,
        subcategory: item.subcategory,
        title: "",
        completed: false
      };

      setWishlist((prev) => {
        const idx = prev.findIndex((w) => w.id === item.id);
        const next = [...prev];
        next.splice(idx + 1, 0, newItem);
        return next;
      });

      await supabase.from("wishlist_items").insert(newItem);

      // Auto-Focus in die neue Zeile
      setTimeout(() => document.getElementById(`wish-input-${newItem.id}`)?.focus(), 10);
    }

    // BACKSPACE: Leere Zeile löschen
    if (e.key === "Backspace" && item.title === "") {
      e.preventDefault();
      handleDeleteWish(item.id);
    }
  };

  const addNewEmptyWish = async (category: string, subcategory?: string) => {
    const newItem: WishlistItem = {
      id: crypto.randomUUID(),
      category,
      subcategory,
      title: "",
      completed: false
    };
    setWishlist((prev) => [...prev, newItem]);
    if (!openSections[category]) {
      toggleSection(category);
    }
    await supabase.from("wishlist_items").insert(newItem);
    setTimeout(() => document.getElementById(`wish-input-${newItem.id}`)?.focus(), 50);
  };

  // Farben für Diagramm
  const colorEingang = isDarkMode ? "#2EC4B6" : "#028090";
  const colorAusgaben = isDarkMode ? "#E76F51" : "#3D405B";
  const colorBudget = isDarkMode ? "#82CBEE" : "#003566";

  const maxCashflow = 2200;
  const maxBudget = 16000;
  const chartHeight = 220;
  const svgWidth = 800;
  const numPoints = prognoseListe.length;
  const paddingLeft = 24;
  const paddingRight = 32;
  const innerWidth = svgWidth - paddingLeft - paddingRight;
  const slotWidth = innerWidth / (numPoints - 1);

  const points = prognoseListe.map((p, idx) => {
    const x = paddingLeft + idx * slotWidth;
    const y = Math.max(
      12,
      chartHeight - (Math.max(0, p.freiVerfuegbar) / maxBudget) * (chartHeight - 20)
    );
    return { x, y, val: p.freiVerfuegbar };
  });
  const linePoints = points.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");

  // -------------------------------------------------------------
  // RENDER HILFSFUNKTIONEN FÜR NOTION ITEMS
  // -------------------------------------------------------------
  const renderWishItem = (item: WishlistItem) => (
    <div key={item.id} className="group relative flex items-center gap-3 py-1.5 pl-6">
      <button
        onClick={() => toggleWishCheck(item.id, item.completed)}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          item.completed ? "border-[#5B8C5A] bg-[#5B8C5A] text-white" : "border-slate-400"
        }`}
      >
        {item.completed && <Check className="h-3 w-3 stroke-[3]" />}
      </button>

      <input
        id={`wish-input-${item.id}`}
        type="text"
        value={item.title}
        onChange={(e) => updateWishTitleLocal(item.id, e.target.value)}
        onBlur={(e) => saveWishTitleDB(item.id, e.target.value)}
        onKeyDown={(e) => handleWishKeyDown(e, item)}
        placeholder="Eintrag..."
        className={`w-full border-none bg-transparent text-sm transition-all outline-none focus:ring-0 ${
          item.completed ? "line-through opacity-40" : textTitle
        }`}
      />

      <button
        onClick={() => handleDeleteWish(item.id)}
        className="absolute right-2 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-400"
      >
        <Trash2 className="h-3.5 w-3.5 text-slate-400" />
      </button>
    </div>
  );

  const renderWishBookmark = (item: WishlistItem) => (
    <div key={item.id} className="group relative py-2 pr-4 pl-12">
      <div
        className={`flex overflow-hidden rounded-xl border ${bgItem} transition-all hover:border-blue-400/30`}
      >
        <div className="flex flex-1 flex-col justify-center p-4">
          <input
            id={`wish-input-${item.id}`}
            type="text"
            value={item.title}
            onChange={(e) => updateWishTitleLocal(item.id, e.target.value)}
            onBlur={(e) => saveWishTitleDB(item.id, e.target.value)}
            onKeyDown={(e) => handleWishKeyDown(e, item)}
            className={`w-full border-none bg-transparent text-sm font-bold outline-none focus:ring-0 ${textTitle}`}
          />
          <span className={`mt-0.5 text-xs ${textSub}`}>{item.embed_desc}</span>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-400">
            <Globe className="h-3 w-3" />
            <a href={item.embed_url} target="_blank" rel="noreferrer" className="hover:underline">
              {item.embed_url}
            </a>
          </div>
        </div>
        {item.embed_img && (
          <div className="h-28 w-28 shrink-0 bg-slate-200">
            <img src={item.embed_img} alt={item.title} className="h-full w-full object-cover" />
          </div>
        )}
      </div>
      <button
        onClick={() => handleDeleteWish(item.id)}
        className="absolute top-6 right-6 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-400"
      >
        <Trash2 className="h-4 w-4 text-slate-400" />
      </button>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center space-y-4">
        <div
          className={`w-full max-w-sm space-y-4 rounded-3xl border p-8 text-center shadow-lg ${bgCard}`}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#005377]/10 text-[#005377] dark:text-[#82CBEE]">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className={`text-lg font-bold tracking-tight ${textTitle}`}>Finanzen</h2>
            <p className={`mt-1 text-xs ${textSub}`}>Zugriff geschützt für Jonas</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className={`w-full rounded-xl border px-4 py-2 text-center font-mono text-base tracking-widest ${bgInput} focus:outline-none`}
            />
            <button
              type="submit"
              className={`w-full rounded-xl py-2.5 text-xs font-bold ${buttonPrimary}`}
            >
              Entsperren
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* 1. TOP KONTROLLZENTRUM */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <div className={`${bgCard} space-y-4 rounded-2xl border p-5 shadow-sm`}>
            <h3 className={`text-xs font-bold tracking-wider uppercase ${textTitle}`}>
              KONTROLLZENTRUM
            </h3>
            <div className="space-y-1.5 border-b border-[#E8E2D9] pb-4 dark:border-white/[0.08]">
              <label className={`text-xs font-medium ${textSub}`}>Aktueller Kontostand (€)</label>
              <input
                type="number"
                step="10"
                value={aktuellerSaldo}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setAktuellerSaldo(val);
                  updateSetting("saldo", val);
                }}
                className={`w-full rounded-xl border ${bgInput} p-2 font-mono text-sm font-semibold focus:outline-none`}
              />
            </div>
            <div className="space-y-3 border-b border-[#E8E2D9] pb-4 dark:border-white/[0.08]">
              <h4 className={`text-xs font-semibold ${textTitle}`}>Target-Prognose</h4>
              <div>
                <label className={`text-[11px] ${textSub}`}>Wunschdatum für Check</label>
                <input
                  type="date"
                  value={zielDatum}
                  onChange={(e) => {
                    setZielDatum(e.target.value);
                    updateSetting("ziel_datum", e.target.value);
                  }}
                  className={`mt-1 w-full rounded-xl border ${bgInput} p-2 text-xs font-medium`}
                />
              </div>
              <div>
                <label className={`text-[11px] ${textSub}`}>Fokus-Monat</label>
                <select
                  value={fokusMonat}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setFokusMonat(val);
                    updateSetting("fokus_monat", val);
                  }}
                  className={`mt-1 w-full rounded-xl border ${bgInput} p-2 text-xs font-medium`}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Monat {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <form onSubmit={handleAddAusgabe} className="space-y-3">
              <h4 className={`text-xs font-semibold ${textTitle}`}>Sonderausgabe planen</h4>
              <input
                type="text"
                placeholder="Zweck..."
                value={neuWas}
                onChange={(e) => setNeuWas(e.target.value)}
                className={`w-full rounded-xl border ${bgInput} p-2 text-xs font-medium focus:outline-none`}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="10"
                  placeholder="Betrag (€)"
                  value={neuHoehe}
                  onChange={(e) => setNeuHoehe(e.target.value)}
                  className={`w-full rounded-xl border ${bgInput} p-2 text-xs font-semibold focus:outline-none`}
                />
                <input
                  type="date"
                  value={neuWann}
                  onChange={(e) => setNeuWann(e.target.value)}
                  className={`w-full rounded-xl border ${bgInput} p-2 text-xs font-medium`}
                />
              </div>
              <button
                type="submit"
                className={`w-full rounded-xl py-2 text-xs font-bold ${buttonPrimary}`}
              >
                Ausgabe speichern
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <div>
            <h2 className={`text-lg font-bold ${textTitle}`}>Taktischer Ausblick (2026 - 2027)</h2>
            <p className={`mt-0.5 text-xs ${textSub}`}>
              Frei verfügbares Budget nach allen Abzügen bis zum nächsten Gehaltseingang.
            </p>
          </div>
          <div
            className={`overflow-x-auto rounded-2xl border ${isDarkMode ? "border-white/[0.08] bg-[#140C0E]" : "border-[#E8E2D9] bg-[#FFFFFF]"} shadow-xs`}
          >
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr
                  className={`border-b ${isDarkMode ? "border-white/[0.08] bg-white/[0.02]" : "border-[#E8E2D9] bg-[#FAF8F5]"} text-xs font-bold`}
                >
                  <th
                    className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-left`}
                  />
                  <th
                    colSpan={5}
                    className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-center text-xs font-bold ${textTitle}`}
                  >
                    2026
                  </th>
                  <th colSpan={12} className={`p-2 text-center text-xs font-bold ${textTitle}`}>
                    2027
                  </th>
                </tr>
                <tr
                  className={`border-b ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} ${textTitle}`}
                >
                  <th
                    className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-left font-medium`}
                  >
                    Kategorie
                  </th>
                  {prognoseListe.map((p, i) => (
                    <th
                      key={i}
                      className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-center font-medium last:border-r-0`}
                    >
                      {p.monat}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isDarkMode ? "divide-white/[0.05]" : "divide-[#E8E2D9]"} ${textTitle}`}
              >
                <tr>
                  <td
                    className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-left font-medium`}
                  >
                    Gehalt (Ende)
                  </td>
                  {prognoseListe.map((p, i) => (
                    <td
                      key={i}
                      className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-center font-medium last:border-r-0`}
                    >
                      {p.gehaltEnde % 1 === 0 ? p.gehaltEnde.toFixed(0) : p.gehaltEnde.toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td
                    className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-left font-medium`}
                  >
                    Fixkosten
                  </td>
                  {prognoseListe.map((p, i) => (
                    <td
                      key={i}
                      className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-center font-medium last:border-r-0`}
                    >
                      {p.fixMonat.toFixed(0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td
                    className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-left font-medium`}
                  >
                    Sonderbudgets
                  </td>
                  {prognoseListe.map((p, i) => (
                    <td
                      key={i}
                      className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-center font-medium last:border-r-0`}
                    >
                      {p.extraMonat.toFixed(0)}
                    </td>
                  ))}
                </tr>
                <tr className={`${isDarkMode ? "bg-white/[0.03]" : "bg-black/[0.02]"} font-bold`}>
                  <td
                    className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-left ${textTitle}`}
                  >
                    Frei Verfügbar
                  </td>
                  {prognoseListe.map((p, i) => (
                    <td
                      key={i}
                      className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-center ${accentBlue} last:border-r-0`}
                    >
                      {p.freiVerfuegbar % 1 === 0
                        ? p.freiVerfuegbar.toFixed(0)
                        : p.freiVerfuegbar.toFixed(2)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. GEPLANTE SONDERBUDGETS & BACKLOG */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className={`${bgCard} space-y-4 rounded-2xl border p-5 shadow-sm`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-bold tracking-wider uppercase ${textTitle}`}>
              GEPLANTE SONDERBUDGETS
            </h3>
            <span className={`font-mono text-xs font-bold ${badgeBlue} rounded-full px-2.5 py-0.5`}>
              {sonderausgaben.length} Posten
            </span>
          </div>
          <div className="space-y-2.5">
            {sonderausgaben.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col justify-between gap-2 rounded-xl border p-3.5 sm:flex-row sm:items-center ${bgItem}`}
              >
                <div>
                  <span className={`text-xs font-semibold ${textTitle} block`}>{item.was}</span>
                  <span className={`font-mono text-xs font-bold ${accentBlue}`}>
                    {item.hoehe.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg border ${bgInput} p-1 text-[10px] font-medium`}>
                    {new Date(item.wann).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    })}
                  </div>
                  <button
                    onClick={() => handleDeleteAusgabe(item.id, true)}
                    className={`flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold ${buttonPrimary}`}
                  >
                    Erledigt 💸
                  </button>
                  <button
                    onClick={() => handleDeleteAusgabe(item.id, false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 opacity-60 transition-all hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`${bgCard} space-y-4 rounded-2xl border p-5 shadow-sm`}>
          <div>
            <h3 className={`text-xs font-bold tracking-wider uppercase ${textTitle}`}>
              BACKLOG (WUNSCHLISTE)
            </h3>
            <p className={`text-[11px] ${textSub}`}>Wünsche notieren und bei Bedarf einplanen.</p>
          </div>
          <form onSubmit={handleAddBacklog} className="grid grid-cols-12 gap-2">
            <input
              type="text"
              placeholder="Wunsch..."
              value={neuBWas}
              onChange={(e) => setNeuBWas(e.target.value)}
              className={`col-span-6 rounded-xl border ${bgInput} p-2 text-xs font-medium focus:outline-none`}
            />
            <input
              type="number"
              placeholder="€"
              value={neuBHoehe}
              onChange={(e) => setNeuBHoehe(e.target.value)}
              className={`col-span-3 rounded-xl border ${bgInput} p-2 text-xs font-semibold focus:outline-none`}
            />
            <button
              type="submit"
              className={`col-span-3 rounded-xl text-xs font-bold ${buttonPrimary}`}
            >
              Hinzufügen
            </button>
          </form>
          <div className="space-y-2.5 pt-1">
            {backlog.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col justify-between gap-2 rounded-xl border p-3.5 sm:flex-row sm:items-center ${bgItem}`}
              >
                <div>
                  <span className={`text-xs font-semibold ${textTitle} block`}>{item.was}</span>
                  <span className={`font-mono text-xs font-bold ${accentBlue}`}>
                    {item.hoehe.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={backlogDates[item.id] || "2026-08-26"}
                    onChange={(e) => setBacklogDates((p) => ({ ...p, [item.id]: e.target.value }))}
                    className={`rounded-lg border ${bgInput} p-1 text-[10px] font-medium`}
                  />
                  <button
                    onClick={() => handlePlanBacklog(item)}
                    className={`flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold ${buttonPrimary}`}
                  >
                    Planen ⬆️
                  </button>
                  <button
                    onClick={() => handleDeleteBacklog(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 opacity-60 transition-all hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. NOTION-STYLE WISHLIST */}
      <div className="space-y-6 border-t border-[#E8E2D9] pt-6 pb-24 dark:border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>
              Must Needs & Lifestyle Wishlist
            </h2>
            <p className={`text-xs ${textSub}`}>
              Gliedere deine Vorhaben nach Kategorien mit Checklisten und visuellen Web-Bookmarks.
            </p>
          </div>
          <button
            onClick={() => addNewEmptyWish("Produktivität/Home")}
            className={`flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-bold ${buttonPrimary}`}
          >
            <Plus className="h-3.5 w-3.5" /> Neuer Eintrag
          </button>
        </div>

        <div className="space-y-4">
          {/* Kategorie 1: Produktivität/Home */}
          <div className={`${bgCard} space-y-3 rounded-2xl border p-5 shadow-sm`}>
            <div
              onClick={() => toggleSection("Produktivität/Home")}
              className="flex cursor-pointer items-center justify-between select-none"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">⚙️</span>
                <h3 className={`text-sm font-bold ${textTitle}`}>Produktivität/Home:</h3>
              </div>
              {openSections["Produktivität/Home"] ? (
                <ChevronDown className={`h-4 w-4 ${textSub}`} />
              ) : (
                <ChevronRight className={`h-4 w-4 ${textSub}`} />
              )}
            </div>

            {openSections["Produktivität/Home"] && (
              <div className="space-y-0.5 pt-1">
                {wishlist
                  .filter((w) => w.category === "Produktivität/Home")
                  .map((item) =>
                    item.embed_url ? renderWishBookmark(item) : renderWishItem(item)
                  )}
              </div>
            )}
          </div>

          {/* Kategorie 2: Lifestyle */}
          <div className={`${bgCard} space-y-4 rounded-2xl border p-5 shadow-sm`}>
            <div
              onClick={() => toggleSection("Lifestyle")}
              className="flex cursor-pointer items-center justify-between select-none"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🚤</span>
                <h3 className={`text-sm font-bold ${textTitle}`}>Lifestyle:</h3>
              </div>
              {openSections["Lifestyle"] ? (
                <ChevronDown className={`h-4 w-4 ${textSub}`} />
              ) : (
                <ChevronRight className={`h-4 w-4 ${textSub}`} />
              )}
            </div>

            {openSections["Lifestyle"] && (
              <div className="space-y-5 pt-1 pl-4">
                {/* Subkategorie: Oberteile */}
                <div className="space-y-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm">🎽</span>
                    <h4 className={`text-xs font-bold ${textTitle}`}>Oberteile:</h4>
                  </div>
                  <div className="space-y-0.5 pl-1">
                    {wishlist
                      .filter(
                        (w) =>
                          w.category === "Lifestyle" &&
                          (w.subcategory === "Oberteile" || !w.subcategory)
                      )
                      .map((item) =>
                        item.embed_url ? renderWishBookmark(item) : renderWishItem(item)
                      )}
                  </div>
                </div>

                {/* Subkategorie: Hosen */}
                <div className="space-y-1 pt-2">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm">👖</span>
                    <h4 className={`text-xs font-bold ${textTitle}`}>Hosen:</h4>
                  </div>
                  <div className="space-y-0.5 pl-1">
                    {wishlist
                      .filter((w) => w.category === "Lifestyle" && w.subcategory === "Hosen")
                      .map((item) =>
                        item.embed_url ? renderWishBookmark(item) : renderWishItem(item)
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
