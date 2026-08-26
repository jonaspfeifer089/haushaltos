import React, { useState, useEffect } from "react";
import { Lock, ShieldCheck, Trash2, Check, Calendar } from "lucide-react";
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

  // Supabase Settings State
  const [aktuellerSaldo, setAktuellerSaldo] = useState<number>(500.0);
  const [fixEinnahmen, setFixEinnahmen] = useState<number>(880.0);
  const [fixAusgaben, setFixAusgaben] = useState<number>(70.0);
  const [fokusMonat, setFokusMonat] = useState<number>(8);
  const [zielDatum, setZielDatum] = useState<string>("2026-08-31");

  // Sonderausgaben & Backlog
  const [sonderausgaben, setSonderausgaben] = useState<Sonderausgabe[]>([]);
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [backlogDates, setBacklogDates] = useState<Record<string, string>>({});

  // Inputs
  const [neuWas, setNeuWas] = useState("");
  const [neuHoehe, setNeuHoehe] = useState<string>("");
  const [neuWann, setNeuWann] = useState("2026-08-26");
  const [neuBWas, setNeuBWas] = useState("");
  const [neuBHoehe, setNeuBHoehe] = useState<string>("");

  // -------------------------------------------------------------
  // SUPABASE DATA LOADING
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

      if (listRes) {
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

  const fokusRow = prognoseListe.find(
    (p) => p.monat === fokusMonat && p.jahr === (fokusMonat >= 8 ? 2026 : 2027)
  );
  const freiVerfuegbarFokus = fokusRow ? fokusRow.freiVerfuegbar : 0.0;
  const sonderFokus = fokusRow ? fokusRow.extraMonat : 0.0;

  // Handler
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

  // -------------------------------------------------------------
  // CHART POSITIONIERUNG (Exakt im Box-Raster)
  // -------------------------------------------------------------
  const maxCashflow = 2200;
  const maxBudget = 14000;
  const chartHeight = 220;
  const svgWidth = 800;
  const numPoints = prognoseListe.length;
  const paddingX = 20;
  const innerWidth = svgWidth - paddingX * 2;
  const slotWidth = innerWidth / (numPoints - 1);

  const points = prognoseListe.map((p, idx) => {
    const x = paddingX + idx * slotWidth;
    const y = chartHeight - (Math.max(0, p.freiVerfuegbar) / maxBudget) * chartHeight;
    return { x, y, val: p.freiVerfuegbar };
  });

  const linePoints = points.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");

  // Farbdefinitionen
  const colorIn = isDarkMode ? "#82CBEE" : "#005377"; // Helles / Primäres Petrol
  const colorOut = isDarkMode ? "#3A6073" : "#0B2545"; // Dunkleres Blau statt Hellgrau!

  // 🔒 PIN-SPERRE
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
    <div className="space-y-8">
      {/* Grid: Kontrollzentrum & Taktischer Ausblick */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LINKE SPALTE: KONTROLLZENTRUM */}
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

        {/* RECHTE SPALTE: TAKTISCHER AUSBLICK & DIAGRAMM */}
        <div className="space-y-6 lg:col-span-8">
          <div>
            <h2 className={`text-lg font-bold ${textTitle}`}>Taktischer Ausblick (2026 - 2027)</h2>
            <p className={`mt-0.5 text-xs ${textSub}`}>
              {`Frei verfügbares Budget nach allen Abzügen bis zum nächsten Gehaltseingang.`}
            </p>
          </div>

          {/* Einheitliche Matrix-Tabelle */}
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
                      {p.gehaltEnde.toFixed(0)}
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
                      {p.freiVerfuegbar.toFixed(0)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Diagramm mit sauber eingebundener Linie & dunklerem Blau für Ausgaben */}
          <div className={`${bgCard} space-y-3 rounded-2xl border p-5 shadow-sm`}>
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <h3 className={`text-xs font-bold tracking-wider uppercase ${textTitle}`}>
                VERLAUF & LIQUIDITÄTS-KURVE
              </h3>
              <div className="flex items-center gap-4 text-[11px] font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colorIn }} />
                  <span className={textTitle}>Eingang</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colorOut }} />
                  <span className={textTitle}>Ausgaben</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1 w-3.5" style={{ backgroundColor: colorIn }} />
                  <span style={{ color: colorIn }}>Freies Budget</span>
                </div>
              </div>
            </div>

            <div className="relative pt-2">
              <div className="flex">
                {/* Y-Achse Links */}
                <div
                  className={`flex h-48 flex-col justify-between pr-2 text-right font-mono text-[9px] font-bold ${textSub}`}
                >
                  <span>2k</span>
                  <span>1.5k</span>
                  <span>1k</span>
                  <span>0.5k</span>
                  <span>0</span>
                </div>

                {/* Plot Area */}
                <div
                  className={`relative h-48 flex-1 border-b border-l ${isDarkMode ? "border-white/[0.08]" : "border-black/[0.08]"} overflow-hidden`}
                >
                  <svg
                    viewBox={`0 0 ${svgWidth} ${chartHeight}`}
                    preserveAspectRatio="none"
                    className="h-full w-full"
                  >
                    {/* Gitterlinien */}
                    <line
                      x1="0"
                      y1="0"
                      x2={svgWidth}
                      y2="0"
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

                    {/* Balken */}
                    {prognoseListe.map((p, idx) => {
                      const xCenter = paddingX + idx * slotWidth;
                      const barW = 6;
                      const hIn = (p.gehaltEnde / maxCashflow) * chartHeight;
                      const yIn = chartHeight - hIn;
                      const hOut = (p.ausgabenGesamt / maxCashflow) * chartHeight;
                      const yOut = chartHeight - hOut;

                      return (
                        <g key={idx}>
                          <rect
                            x={xCenter - barW - 1}
                            y={yIn}
                            width={barW}
                            height={hIn}
                            fill={colorIn}
                            rx={1}
                          />
                          <rect
                            x={xCenter + 1}
                            y={yOut}
                            width={barW}
                            height={hOut}
                            fill={colorOut}
                            rx={1}
                          />
                        </g>
                      );
                    })}

                    {/* Exakt formatierte Linie innerhalb des Diagramms */}
                    <polyline fill="none" stroke={colorIn} strokeWidth="2.5" points={linePoints} />

                    {/* Datenpunkte */}
                    {points.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        fill={colorIn}
                        stroke={isDarkMode ? "#140C0E" : "#FFFFFF"}
                        strokeWidth="1.5"
                      />
                    ))}
                  </svg>
                </div>

                {/* Y-Achse Rechts */}
                <div
                  className={`flex h-48 flex-col justify-between pl-2 text-left font-mono text-[9px] font-bold ${accentBlue}`}
                >
                  <span>14k</span>
                  <span>10k</span>
                  <span>7k</span>
                  <span>3k</span>
                  <span>0</span>
                </div>
              </div>

              {/* X-Achse Monate */}
              <div
                className={`mt-2 flex justify-between pr-6 pl-6 font-mono text-[9px] font-bold ${textSub}`}
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

      {/* ========================================================= */}
      {/* SONDERAUSGABEN & BACKLOG */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Sonderbudgets */}
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
                className={`flex items-center justify-between rounded-xl border p-3.5 ${bgItem}`}
              >
                <div>
                  <span className={`text-xs font-semibold ${textTitle} block`}>{item.was}</span>
                  <span className={`text-[10px] font-medium ${textSub}`}>{item.wann}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-xs font-bold ${textTitle}`}>
                    {item.hoehe.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                  </span>
                  <button
                    onClick={() => handleDeleteAusgabe(item.id, true)}
                    className="flex h-7 items-center gap-1 rounded-lg border border-black/10 px-2 text-[11px] font-semibold opacity-80 hover:opacity-100 dark:border-white/10"
                  >
                    <Check className="h-3 w-3" /> Erledigt
                  </button>
                  <button
                    onClick={() => handleDeleteAusgabe(item.id, false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 opacity-60 hover:opacity-100"
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

        {/* Backlog */}
        <div className={`${bgCard} space-y-4 rounded-2xl border p-5 shadow-sm`}>
          <div>
            <h3 className={`text-xs font-bold tracking-wider uppercase ${textTitle}`}>
              BACKLOG (WUNSCHLISTE)
            </h3>
            <p className={`text-[11px] ${textSub}`}>
              Wünsche notieren und bei Bedarf mit Kaufdatum einplanen.
            </p>
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
                className={`flex flex-col justify-between gap-2 rounded-xl border p-3 sm:flex-row sm:items-center ${bgItem}`}
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
                    className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-bold ${buttonPrimary}`}
                  >
                    Planen
                  </button>
                  <button
                    onClick={() => handleDeleteBacklog(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 opacity-60 hover:opacity-100"
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
    </div>
  );
}
