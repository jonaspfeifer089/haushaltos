import React, { useState, useEffect } from "react";
import {
  Lock,
  ShieldCheck,
  Trash2,
  Check,
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  Globe
} from "lucide-react";
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
  const SECRET_PIN = "1234";

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

  // 1:1 INITIAL-WERTE AUS DEM SCREENSHOT
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

  // Inputs
  const [neuWas, setNeuWas] = useState("");
  const [neuHoehe, setNeuHoehe] = useState<string>("");
  const [neuWann, setNeuWann] = useState("2026-08-26");
  const [neuBWas, setNeuBWas] = useState("");
  const [neuBHoehe, setNeuBHoehe] = useState<string>("");

  // Wishlist State
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Produktivität/Home": true,
    Lifestyle: true
  });
  const [newWishTitle, setNewWishTitle] = useState("");
  const [newWishCat, setNewWishCat] = useState("Produktivität/Home");
  const [newWishSubcat, setNewWishSubcat] = useState("");
  const [newWishUrl, setNewWishUrl] = useState("");
  const [newWishImg, setNewWishImg] = useState("");
  const [newWishDesc, setNewWishDesc] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

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

  // -------------------------------------------------------------
  // SIMULATION (1:1 PYTHON/STREAMLIT LOGIK)
  // -------------------------------------------------------------
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

  let simSaldo = aktuellerSaldo;
  const heute = new Date("2026-08-26");
  const targetDateObj = new Date(zielDatum);

  sonderausgaben.forEach((item) => {
    const itemDate = new Date(item.wann);
    if (itemDate >= heute && itemDate <= targetDateObj) {
      simSaldo -= item.hoehe;
    }
  });
  if (targetDateObj >= new Date("2026-08-31")) {
    simSaldo += fixEinnahmen;
  }

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
    await supabase
      .from("sonderausgaben")
      .insert({ id: item.id, was: item.was, hoehe: item.hoehe, wann: item.wann, status: "Offen" });
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
    await supabase
      .from("sonderausgaben")
      .insert({ id: item.id, was: item.was, hoehe: item.hoehe, wann: null, status: "Offen" });
  };

  const handlePlanBacklog = async (item: BacklogItem) => {
    const planDate = backlogDates[item.id] || "2026-08-26";
    setSonderausgaben((p) =>
      [...p, { id: item.id, was: item.was, hoehe: item.hoehe, wann: planDate }].sort(
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

  const toggleWishCheck = async (id: string, current: boolean) => {
    setWishlist((prev) => prev.map((w) => (w.id === id ? { ...w, completed: !current } : w)));
    await supabase.from("wishlist_items").update({ completed: !current }).eq("id", id);
  };

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleAddWishItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishTitle) return;
    const newItem: WishlistItem = {
      id: crypto.randomUUID(),
      category: newWishCat,
      subcategory: newWishSubcat || undefined,
      title: newWishTitle,
      completed: false,
      embed_title: newWishTitle,
      embed_desc: newWishDesc || undefined,
      embed_url: newWishUrl || undefined,
      embed_img: newWishImg || undefined
    };
    setWishlist((prev) => [...prev, newItem]);
    setNewWishTitle("");
    setNewWishUrl("");
    setNewWishImg("");
    setNewWishDesc("");
    setShowAddModal(false);
    toast.success("Wunsch hinzugefügt ✨");
    await supabase.from("wishlist_items").insert(newItem);
  };

  const handleDeleteWish = async (id: string) => {
    setWishlist((prev) => prev.filter((w) => w.id !== id));
    await supabase.from("wishlist_items").delete().eq("id", id);
  };

  // 3 KLARE FARBEN
  const colorEingang = isDarkMode ? "#2EC4B6" : "#028090";
  const colorAusgaben = isDarkMode ? "#E76F51" : "#3D405B";
  const colorBudget = isDarkMode ? "#82CBEE" : "#003566";

  // Chart
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
      {/* 1. TOP KONTROLLZENTRUM & TAKTISCHER AUSBLICK */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LINKE SPALTE */}
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

        {/* RECHTE SPALTE */}
        <div className="space-y-6 lg:col-span-8">
          <div>
            <h2 className={`text-lg font-bold ${textTitle}`}>Taktischer Ausblick (2026 - 2027)</h2>
            <p className={`mt-0.5 text-xs ${textSub}`}>
              {`Frei verfügbares Budget nach allen Abzügen bis zum nächsten Gehaltseingang.`}
            </p>
          </div>

          {/* 1:1 EXAKTE MATRIX-TABELLE */}
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

          {/* DIAGRAMM */}
          <div className={`${bgCard} space-y-3 rounded-2xl border p-5 shadow-sm`}>
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <h3 className={`text-xs font-bold tracking-wider uppercase ${textTitle}`}>
                VERLAUF & LIQUIDITÄTS-KURVE
              </h3>
              <div className="flex items-center gap-4 text-[11px] font-semibold">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: colorEingang }}
                  />
                  <span className={textTitle}>Eingang</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: colorAusgaben }}
                  />
                  <span className={textTitle}>Ausgaben</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-4 rounded-full"
                    style={{ backgroundColor: colorBudget }}
                  />
                  <span style={{ color: colorBudget }} className="font-bold">
                    Freies Budget
                  </span>
                </div>
              </div>
            </div>

            <div className="relative pt-2">
              <div className="flex">
                <div
                  className={`flex h-48 flex-col justify-between pr-2 text-right font-mono text-[9px] font-bold ${textSub}`}
                >
                  <span>2.0k</span>
                  <span>1.5k</span>
                  <span>1.0k</span>
                  <span>0.5k</span>
                  <span>0</span>
                </div>

                <div
                  className={`relative h-48 flex-1 border-b border-l ${isDarkMode ? "border-white/[0.08]" : "border-black/[0.08]"} overflow-hidden`}
                >
                  <svg
                    viewBox={`0 0 ${svgWidth} ${chartHeight}`}
                    preserveAspectRatio="none"
                    className="h-full w-full"
                  >
                    {/* Hilfslinien */}
                    <line
                      x1="0"
                      y1="12"
                      x2={svgWidth}
                      y2="12"
                      stroke="currentColor"
                      className="opacity-10"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="0"
                      y1={chartHeight * 0.25}
                      x2={svgWidth}
                      y2={chartHeight * 0.25}
                      stroke="currentColor"
                      className="opacity-10"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="0"
                      y1={chartHeight * 0.5}
                      x2={svgWidth}
                      y2={chartHeight * 0.5}
                      stroke="currentColor"
                      className="opacity-10"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="0"
                      y1={chartHeight * 0.75}
                      x2={svgWidth}
                      y2={chartHeight * 0.75}
                      stroke="currentColor"
                      className="opacity-10"
                      strokeDasharray="3 3"
                    />

                    {/* MAXIMAL BREITE BALKEN */}
                    {prognoseListe.map((p, idx) => {
                      const xCenter = paddingLeft + idx * slotWidth;
                      // Dynamisch maximale Breite (ca. 18-20px pro Balken)
                      const barW = Math.max(16, Math.floor(slotWidth * 0.42));
                      const gap = 2;

                      const hIn = (p.gehaltEnde / maxCashflow) * (chartHeight - 12);
                      const yIn = chartHeight - hIn;

                      const hOut = (p.ausgabenGesamt / maxCashflow) * (chartHeight - 12);
                      const yOut = chartHeight - hOut;

                      return (
                        <g key={idx}>
                          {/* Eingang (Breit & Petrol) */}
                          <rect
                            x={xCenter - barW - gap / 2}
                            y={yIn}
                            width={barW}
                            height={hIn}
                            fill={colorEingang}
                            rx={3}
                          />
                          {/* Ausgaben (Breit & Schiefer) */}
                          <rect
                            x={xCenter + gap / 2}
                            y={yOut}
                            width={barW}
                            height={hOut}
                            fill={colorAusgaben}
                            rx={3}
                          />
                        </g>
                      );
                    })}

                    {/* Budget-Linie */}
                    <polyline
                      fill="none"
                      stroke={colorBudget}
                      strokeWidth="2.5"
                      points={linePoints}
                    />

                    {/* Datenpunkte */}
                    {points.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r="4"
                        fill={colorBudget}
                        stroke={isDarkMode ? "#140C0E" : "#FFFFFF"}
                        strokeWidth="2"
                      />
                    ))}
                  </svg>
                </div>

                <div
                  className="flex h-48 flex-col justify-between pl-2 text-left font-mono text-[9px] font-bold"
                  style={{ color: colorBudget }}
                >
                  <span>16k</span>
                  <span>12k</span>
                  <span>8k</span>
                  <span>4k</span>
                  <span>0</span>
                </div>
              </div>

              <div
                className={`mt-2 flex justify-between pr-8 pl-6 font-mono text-[9px] font-bold ${textSub}`}
              >
                {prognoseListe
                  .filter((_, i) => i % 2 === 0)
                  .map((p, i) => (
                    <span key={i}>{p.jahr === 2026 ? `Sep '26` : `${p.monat}. '27`}</span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GEPLANTE SONDERBUDGETS & BACKLOG (1:1 IDENTISCHES DESIGN) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* SONDERBUDGETS (LINKS) */}
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
            {sonderausgaben.length === 0 && (
              <p className={`p-4 text-center text-xs ${textSub}`}>Keine Sonderausgaben geplant.</p>
            )}
          </div>
        </div>

        {/* BACKLOG (RECHTS) */}
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
            {backlog.length === 0 && (
              <p className={`p-4 text-center text-xs ${textSub}`}>Backlog ist leer.</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. NOTION-STYLE WISHLIST */}
      <div className="space-y-6 border-t border-[#E8E2D9] pt-6 dark:border-white/[0.08]">
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
            onClick={() => setShowAddModal(true)}
            className={`flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-bold ${buttonPrimary}`}
          >
            <Plus className="h-3.5 w-3.5" /> Neuer Eintrag
          </button>
        </div>

        <div className="space-y-4">
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
              <div className="space-y-2 pt-1 pl-6">
                {wishlist
                  .filter((w) => w.category === "Produktivität/Home")
                  .map((item) => (
                    <div key={item.id} className="group flex items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleWishCheck(item.id, item.completed)}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#005377] focus:ring-0"
                        />
                        <span className={item.completed ? "line-through opacity-50" : textTitle}>
                          {item.title}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteWish(item.id)}
                        className="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

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
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🎽</span>
                    <h4 className={`text-xs font-bold ${textTitle}`}>Oberteile:</h4>
                  </div>

                  <div className="space-y-3 pl-4">
                    {wishlist
                      .filter(
                        (w) =>
                          w.category === "Lifestyle" &&
                          (w.subcategory === "Oberteile" || !w.subcategory)
                      )
                      .map((item) => (
                        <div key={item.id} className="space-y-2">
                          <div className="group flex items-center justify-between">
                            <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium">
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => toggleWishCheck(item.id, item.completed)}
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#005377] focus:ring-0"
                              />
                              <span
                                className={item.completed ? "line-through opacity-50" : textTitle}
                              >
                                {item.title}
                              </span>
                            </label>
                            <button
                              onClick={() => handleDeleteWish(item.id)}
                              className="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {item.embed_url && (
                            <a
                              href={item.embed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`ml-6 flex items-stretch justify-between overflow-hidden rounded-xl border transition-all hover:border-[#005377]/50 ${
                                isDarkMode
                                  ? "border-white/[0.08] bg-black/20"
                                  : "border-[#E8E2D9] bg-[#FAF8F5]"
                              }`}
                            >
                              <div className="flex flex-1 flex-col justify-between space-y-1 p-3.5">
                                <div>
                                  <h5 className={`line-clamp-1 text-xs font-bold ${textTitle}`}>
                                    {item.embed_title || item.title}
                                  </h5>
                                  {item.embed_desc && (
                                    <p className={`mt-0.5 line-clamp-1 text-[11px] ${textSub}`}>
                                      {item.embed_desc}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400">
                                  <Globe className="h-3 w-3" />
                                  <span className="line-clamp-1 font-mono">{item.embed_url}</span>
                                </div>
                              </div>

                              {item.embed_img && (
                                <div className="h-24 w-36 shrink-0 overflow-hidden bg-slate-200 dark:bg-slate-800">
                                  <img
                                    src={item.embed_img}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                            </a>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👖</span>
                    <h4 className={`text-xs font-bold ${textTitle}`}>Hosen:</h4>
                  </div>

                  <div className="space-y-2 pl-4">
                    {wishlist
                      .filter((w) => w.category === "Lifestyle" && w.subcategory === "Hosen")
                      .map((item) => (
                        <div key={item.id} className="group flex items-center justify-between">
                          <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => toggleWishCheck(item.id, item.completed)}
                              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#005377] focus:ring-0"
                            />
                            <span
                              className={item.completed ? "line-through opacity-50" : textTitle}
                            >
                              {item.title}
                            </span>
                          </label>
                          <button
                            onClick={() => handleDeleteWish(item.id)}
                            className="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div
              className={`w-full max-w-md space-y-4 rounded-2xl border p-6 shadow-2xl ${bgCard}`}
            >
              <h3 className={`text-sm font-bold tracking-wider uppercase ${textTitle}`}>
                Neuen Wunsch / Bookmark hinzufügen
              </h3>

              <form onSubmit={handleAddWishItem} className="space-y-3 text-xs">
                <div>
                  <label className={textSub}>Titel / Posten *</label>
                  <input
                    type="text"
                    required
                    placeholder="z. B. Hose sand Slim Leg Tapered"
                    value={newWishTitle}
                    onChange={(e) => setNewWishTitle(e.target.value)}
                    className={`mt-1 w-full rounded-xl border p-2 ${bgInput}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={textSub}>Kategorie</label>
                    <select
                      value={newWishCat}
                      onChange={(e) => setNewWishCat(e.target.value)}
                      className={`mt-1 w-full rounded-xl border p-2 ${bgInput}`}
                    >
                      <option value="Produktivität/Home">⚙️ Produktivität/Home</option>
                      <option value="Lifestyle">🚤 Lifestyle</option>
                    </select>
                  </div>
                  <div>
                    <label className={textSub}>Unterkategorie</label>
                    <input
                      type="text"
                      placeholder="z. B. Oberteile, Hosen"
                      value={newWishSubcat}
                      onChange={(e) => setNewWishSubcat(e.target.value)}
                      className={`mt-1 w-full rounded-xl border p-2 ${bgInput}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={textSub}>Beschreibung / Material (Optional)</label>
                  <input
                    type="text"
                    placeholder="z. B. 100% Leinen / Di Sondrio"
                    value={newWishDesc}
                    onChange={(e) => setNewWishDesc(e.target.value)}
                    className={`mt-1 w-full rounded-xl border p-2 ${bgInput}`}
                  />
                </div>

                <div>
                  <label className={textSub}>Produkt-Link / URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://suitsupply.com/..."
                    value={newWishUrl}
                    onChange={(e) => setNewWishUrl(e.target.value)}
                    className={`mt-1 w-full rounded-xl border p-2 ${bgInput}`}
                  />
                </div>

                <div>
                  <label className={textSub}>Bild-URL (Thumbnail)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newWishImg}
                    onChange={(e) => setNewWishImg(e.target.value)}
                    className={`mt-1 w-full rounded-xl border p-2 ${bgInput}`}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold ${bgItem}`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className={`rounded-xl px-4 py-2 text-xs font-bold ${buttonPrimary}`}
                  >
                    Speichern
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
