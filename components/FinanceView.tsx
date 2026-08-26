import React, { useState } from "react";
import {
  Lock,
  ShieldCheck,
  Trash2,
  Check,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Sparkles,
  Layers
} from "lucide-react";

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

  const { bgCard, bgItem, bgInput, textTitle, textSub, buttonPrimary, isDarkMode } = theme;

  // Basis-Daten
  const [aktuellerSaldo, setAktuellerSaldo] = useState<number>(500.0);
  const fixEinnahmen = 880.0;
  const fixAusgaben = 70.0;
  const [fokusMonat, setFokusMonat] = useState<number>(8);
  const [zielDatum, setZielDatum] = useState<string>("2026-08-31");

  // Sonderausgaben
  const [sonderausgaben, setSonderausgaben] = useState<Sonderausgabe[]>([
    { id: "1", was: "Miete", hoehe: 380.0, wann: "2026-09-01" },
    { id: "2", was: "Geburtstagsgeschenk Lena", hoehe: 200.0, wann: "2026-09-05" },
    { id: "3", was: "Urlaub Restzahlung", hoehe: 300.0, wann: "2026-09-15" },
    { id: "4", was: "Versicherung KFZ", hoehe: 250.0, wann: "2027-02-15" },
    { id: "5", was: "Sonderanschaffung", hoehe: 2000.0, wann: "2027-03-01" }
  ]);

  // Backlog
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === SECRET_PIN) {
      setIsAuthenticated(true);
    } else {
      alert("PIN ungültig");
      setPinInput("");
    }
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

  const handleAddAusgabe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!neuWas || !neuHoehe) return;
    setSonderausgaben((p) => [
      ...p,
      { id: crypto.randomUUID(), was: neuWas, hoehe: parseFloat(neuHoehe), wann: neuWann }
    ]);
    setNeuWas("");
    setNeuHoehe("");
  };

  const handleDeleteAusgabe = (id: string) => {
    setSonderausgaben((p) => p.filter((x) => x.id !== id));
  };

  const handleAddBacklog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!neuBWas || !neuBHoehe) return;
    const newId = crypto.randomUUID();
    setBacklog((p) => [...p, { id: newId, was: neuBWas, hoehe: parseFloat(neuBHoehe) }]);
    setBacklogDates((p) => ({ ...p, [newId]: "2026-08-26" }));
    setNeuBWas("");
    setNeuBHoehe("");
  };

  const handlePlanBacklog = (item: BacklogItem) => {
    const planDate = backlogDates[item.id] || "2026-08-26";
    setSonderausgaben((p) => [
      ...p,
      { id: crypto.randomUUID(), was: item.was, hoehe: item.hoehe, wann: planDate }
    ]);
    setBacklog((p) => p.filter((x) => x.id !== item.id));
  };

  const handleDeleteBacklog = (id: string) => {
    setBacklog((p) => p.filter((x) => x.id !== id));
  };

  // High Performance Chart Config
  const maxCashflow = 2200;
  const maxBudget = 14000;
  const chartHeight = 200;
  const chartWidth = 720;
  const stepX = chartWidth / (prognoseListe.length - 1);

  const linePoints = prognoseListe
    .map((p, idx) => {
      const x = idx * stepX;
      const y = chartHeight - (Math.max(0, p.freiVerfuegbar) / maxBudget) * chartHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPoints = `0,${chartHeight} ${linePoints} ${chartWidth},${chartHeight}`;

  // 🔒 EXECUTIVE AUTH VIEW
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center">
        <div
          className={`w-full max-w-sm rounded-3xl border p-8 text-center shadow-xl backdrop-blur-xl ${bgCard} ${isDarkMode ? "border-white/[0.08]" : "border-[#E2DCD5]"}`}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#005377]/15 text-[#005377] dark:bg-[#82CBEE]/20 dark:text-[#82CBEE]">
            <Lock className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <h2 className={`text-lg font-black tracking-tight ${textTitle}`}>TREASURY OS</h2>
            <p className={`mt-0.5 text-xs font-semibold ${textSub}`}>
              Geschützter Bereich • Jonas Private
            </p>
          </div>
          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <input
              type="password"
              placeholder="PIN eingeben..."
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className={`w-full rounded-2xl border px-4 py-3 text-center font-mono text-base font-bold tracking-widest ${bgInput} focus:outline-none`}
            />
            <button
              type="submit"
              className={`w-full rounded-2xl py-3 text-xs font-black tracking-wide ${buttonPrimary} uppercase`}
            >
              Terminal entsperren
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ========================================================= */}
      {/* TOP EXECUTIVE BAR */}
      {/* ========================================================= */}
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-center dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={`text-2xl font-black tracking-tight md:text-3xl ${textTitle}`}>
              CAPITAL ALLOCATION TERMINAL
            </h1>
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-black text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> SYNCED
            </span>
          </div>
          <p className={`mt-1 font-mono text-xs font-semibold tracking-wide ${textSub}`}>
            Multi-Year Liquidity Simulator • Net Worth Run-Rate 2026–2027
          </p>
        </div>

        <button
          onClick={() => setIsAuthenticated(false)}
          className={`flex h-9 items-center gap-2 self-start rounded-xl border border-black/10 px-3.5 font-mono text-xs font-bold transition-all hover:bg-black/5 sm:self-auto dark:border-white/10 dark:hover:bg-white/5 ${textSub}`}
        >
          <Lock className="h-3.5 w-3.5" /> LOCK SESSION
        </button>
      </div>

      {/* ========================================================= */}
      {/* 4 HIGH-IMPACT METRICS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={`${bgCard} rounded-2xl border p-4.5 shadow-xs`}>
          <span className="font-mono text-[10px] font-black tracking-wider text-slate-500 uppercase">
            01 / Liquidität Live
          </span>
          <div className={`mt-1.5 font-mono text-2xl font-black md:text-3xl ${textTitle}`}>
            {aktuellerSaldo.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
          </div>
        </div>

        <div className={`${bgCard} rounded-2xl border p-4.5 shadow-xs`}>
          <span className="font-mono text-[10px] font-black tracking-wider text-slate-500 uppercase">
            02 / Target Run-Rate ({zielDatum})
          </span>
          <div className={`mt-1.5 font-mono text-2xl font-black md:text-3xl ${textTitle}`}>
            {simSaldo.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
          </div>
        </div>

        <div
          className={`${bgCard} rounded-2xl border border-l-4 border-l-[#005377] p-4.5 shadow-xs dark:border-l-[#82CBEE]`}
        >
          <span className="font-mono text-[10px] font-black tracking-wider text-[#005377] uppercase dark:text-[#82CBEE]">
            03 / Freier Cashflow (M {fokusMonat})
          </span>
          <div className={`mt-1.5 font-mono text-2xl font-black md:text-3xl ${textTitle}`}>
            {freiVerfuegbarFokus.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
          </div>
        </div>

        <div className={`${bgCard} rounded-2xl border p-4.5 shadow-xs`}>
          <span className="font-mono text-[10px] font-black tracking-wider text-slate-500 uppercase">
            04 / Sonder-Capex (M {fokusMonat})
          </span>
          <div className={`mt-1.5 font-mono text-2xl font-black md:text-3xl ${textTitle}`}>
            {sonderFokus.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SPLIT SECTION: CONTROL TERMINAL & ADVANCED CHART */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* CONTROL TERMINAL */}
        <div className="space-y-6 lg:col-span-4">
          <div className={`${bgCard} space-y-4 rounded-3xl border p-6 shadow-sm`}>
            <div className="flex items-center justify-between border-b border-black/10 pb-3 dark:border-white/10">
              <h3 className={`font-mono text-xs font-black tracking-wider ${textTitle} uppercase`}>
                Parameter Control
              </h3>
              <span className="font-mono text-[10px] font-bold text-slate-400">ENGINE V2.4</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold text-slate-500 uppercase">
                Kontostand Override (€)
              </label>
              <input
                type="number"
                step="10"
                value={aktuellerSaldo}
                onChange={(e) => setAktuellerSaldo(parseFloat(e.target.value) || 0)}
                className={`w-full rounded-xl border ${bgInput} p-2.5 font-mono text-sm font-black focus:outline-none`}
              />
            </div>

            <div className="space-y-3 border-t border-black/10 pt-3 dark:border-white/10">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={zielDatum}
                    onChange={(e) => setZielDatum(e.target.value)}
                    className={`mt-1 w-full rounded-xl border ${bgInput} p-2 font-mono text-xs font-bold`}
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                    Fokus-Monat
                  </label>
                  <select
                    value={fokusMonat}
                    onChange={(e) => setFokusMonat(parseInt(e.target.value, 10))}
                    className={`mt-1 w-full rounded-xl border ${bgInput} p-2 font-mono text-xs font-bold`}
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Monat {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleAddAusgabe}
              className="space-y-3 border-t border-black/10 pt-4 dark:border-white/10"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-black text-slate-500 uppercase">
                  + Sonderbudget
                </span>
                <span className="font-mono text-[9px] font-bold text-slate-400">
                  SCHEDULED CAPEX
                </span>
              </div>
              <input
                type="text"
                placeholder="Verwendungszweck..."
                value={neuWas}
                onChange={(e) => setNeuWas(e.target.value)}
                className={`w-full rounded-xl border ${bgInput} p-2.5 text-xs font-medium focus:outline-none`}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="10"
                  placeholder="Betrag (€)"
                  value={neuHoehe}
                  onChange={(e) => setNeuHoehe(e.target.value)}
                  className={`w-full rounded-xl border ${bgInput} p-2 font-mono text-xs font-bold`}
                />
                <input
                  type="date"
                  value={neuWann}
                  onChange={(e) => setNeuWann(e.target.value)}
                  className={`w-full rounded-xl border ${bgInput} p-2 font-mono text-xs font-bold`}
                />
              </div>
              <button
                type="submit"
                className={`w-full rounded-xl py-2.5 font-mono text-xs font-black tracking-wider uppercase ${buttonPrimary}`}
              >
                Capex verbuchen
              </button>
            </form>
          </div>
        </div>

        {/* HIGH CONTRAST EXECUTIVE CHART & MATRIX */}
        <div className="space-y-6 lg:col-span-8">
          {/* CHART CONTAINER */}
          <div className={`${bgCard} space-y-4 rounded-3xl border p-6 shadow-sm`}>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3
                  className={`font-mono text-xs font-black tracking-wider ${textTitle} uppercase`}
                >
                  Liquidity Trend & Cashflow Matrix
                </h3>
                <p className="font-mono text-[11px] text-slate-400">
                  Dual-Axis Projection • Inflows vs. Outflows vs. Net Balance
                </p>
              </div>

              {/* High Contrast Legend */}
              <div className="flex items-center gap-4 font-mono text-[10px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#003E5C] dark:bg-[#82CBEE]" />
                  <span className={textTitle}>Inflows</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#64748B] dark:bg-[#94A3B8]" />
                  <span className={textTitle}>Outflows</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1 w-3.5 bg-[#005377] dark:bg-[#82CBEE]" />
                  <span className="text-[#005377] dark:text-[#82CBEE]">Net Balance</span>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="relative pt-4">
              <div className="flex">
                {/* Y-Axis Left (Inflow/Outflow) */}
                <div className="flex h-52 flex-col justify-between pr-3 text-right font-mono text-[9px] font-bold text-slate-400">
                  <span>2.0k</span>
                  <span>1.5k</span>
                  <span>1.0k</span>
                  <span>0.5k</span>
                  <span>0.0</span>
                </div>

                {/* Plot Area */}
                <div
                  className={`relative h-52 flex-1 border-b border-l ${isDarkMode ? "border-white/15" : "border-black/15"}`}
                >
                  {/* Subtle Gridlines */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-20">
                    <div className="border-b border-dashed border-slate-400" />
                    <div className="border-b border-dashed border-slate-400" />
                    <div className="border-b border-dashed border-slate-400" />
                    <div className="border-b border-dashed border-slate-400" />
                  </div>

                  {/* High Contrast Bars */}
                  <div className="absolute inset-0 flex items-end justify-between px-2">
                    {prognoseListe.map((p, idx) => {
                      const hIn = Math.min(100, (p.gehaltEnde / maxCashflow) * 100);
                      const hOut = Math.min(100, (p.ausgabenGesamt / maxCashflow) * 100);

                      return (
                        <div
                          key={idx}
                          className="flex h-full w-full items-end justify-center gap-1"
                        >
                          {/* Sattes Deep Navy für Inflows */}
                          <div
                            style={{ height: `${hIn}%` }}
                            className="w-2 rounded-t-xs bg-[#003E5C] transition-all hover:scale-y-105 dark:bg-[#82CBEE]"
                            title={`Inflow: ${p.gehaltEnde.toFixed(2)} €`}
                          />
                          {/* Sattes Graphit-Slate für Outflows */}
                          <div
                            style={{ height: `${hOut}%` }}
                            className="w-2 rounded-t-xs bg-[#64748B] transition-all hover:scale-y-105 dark:bg-[#94A3B8]"
                            title={`Outflow: ${p.ausgabenGesamt.toFixed(2)} €`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* SVG Net Balance Overlay */}
                  <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                    <defs>
                      <linearGradient id="balanceGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={isDarkMode ? "#82CBEE" : "#005377"}
                          stopOpacity="0.25"
                        />
                        <stop
                          offset="100%"
                          stopColor={isDarkMode ? "#82CBEE" : "#005377"}
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                    </defs>
                    <polygon fill="url(#balanceGlow)" points={areaPoints} />
                    <polyline
                      fill="none"
                      stroke={isDarkMode ? "#82CBEE" : "#005377"}
                      strokeWidth="3"
                      points={linePoints}
                    />
                    {prognoseListe.map((p, idx) => {
                      const x = idx * stepX;
                      const y =
                        chartHeight - (Math.max(0, p.freiVerfuegbar) / maxBudget) * chartHeight;
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r="3.5"
                          fill={isDarkMode ? "#82CBEE" : "#005377"}
                          stroke={isDarkMode ? "#100A0B" : "#FFFFFF"}
                          strokeWidth="1.5"
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Y-Axis Right (Cumulative Budget) */}
                <div className="flex h-52 flex-col justify-between pl-3 text-left font-mono text-[9px] font-bold text-[#005377] dark:text-[#82CBEE]">
                  <span>14k</span>
                  <span>10k</span>
                  <span>7k</span>
                  <span>3k</span>
                  <span>0k</span>
                </div>
              </div>

              {/* X-Axis */}
              <div className="mt-2.5 flex justify-between pr-8 pl-8 font-mono text-[9px] font-bold text-slate-400">
                {prognoseListe
                  .filter((_, i) => i % 2 === 0)
                  .map((p, i) => (
                    <span key={i}>{p.jahr === 2026 ? `SEP '26` : `${p.monat}. '27`}</span>
                  ))}
              </div>
            </div>
          </div>

          {/* FINANCIAL MATRIX TABLE */}
          <div
            className={`overflow-x-auto rounded-2xl border ${isDarkMode ? "border-white/10 bg-[#140C0E]" : "border-[#E2DCD5] bg-white"} shadow-xs`}
          >
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr
                  className={`border-b ${isDarkMode ? "border-white/10 bg-white/[0.03]" : "border-[#E2DCD5] bg-[#FAF8F5]"}`}
                >
                  <th
                    className={`border-r ${isDarkMode ? "border-white/10" : "border-[#E2DCD5]"} p-2.5 text-left font-black text-slate-400`}
                  />
                  <th
                    colSpan={5}
                    className={`border-r ${isDarkMode ? "border-white/10" : "border-[#E2DCD5]"} p-2.5 text-center font-black tracking-widest text-slate-400 uppercase`}
                  >
                    FY 2026
                  </th>
                  <th
                    colSpan={12}
                    className="p-2.5 text-center font-black tracking-widest text-slate-400 uppercase"
                  >
                    FY 2027
                  </th>
                </tr>
                <tr
                  className={`border-b ${isDarkMode ? "border-white/10" : "border-[#E2DCD5]"} text-[10px] font-bold text-slate-400`}
                >
                  <th
                    className={`border-r ${isDarkMode ? "border-white/10" : "border-[#E2DCD5]"} p-2 text-left uppercase`}
                  >
                    Line Item
                  </th>
                  {prognoseListe.map((p, i) => (
                    <th
                      key={i}
                      className={`border-r ${isDarkMode ? "border-white/10" : "border-[#E2DCD5]"} p-2 text-center last:border-r-0`}
                    >
                      {p.monat}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isDarkMode ? "divide-white/5" : "divide-[#E2DCD5]"} font-medium`}
              >
                <tr>
                  <td
                    className={`border-r ${isDarkMode ? "border-white/10" : "border-[#E2DCD5]"} p-2 text-left font-bold text-slate-500`}
                  >
                    Inflow (Net)
                  </td>
                  {prognoseListe.map((p, i) => (
                    <td
                      key={i}
                      className={`border-r ${isDarkMode ? "border-white/10" : "border-[#E2DCD5]"} p-2 text-center text-slate-700 last:border-r-0 dark:text-slate-300`}
                    >
                      {p.gehaltEnde.toFixed(0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td
                    className={`border-r ${isDarkMode ? "border-white/10" : "border-[#E2DCD5]"} p-2 text-left font-bold text-slate-500`}
                  >
                    Opex (Fix)
                  </td>
                  {prognoseListe.map((p, i) => (
                    <td
                      key={i}
                      className={`border-r ${isDarkMode ? "border-white/10" : "border-[#E2DCD5]"} p-2 text-center text-slate-400 last:border-r-0`}
                    >
                      {p.fixMonat.toFixed(0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td
                    className={`border-r ${isDarkMode ? "border-white/10" : "border-[#E2DCD5]"} p-2 text-left font-bold text-slate-500`}
                  >
                    Capex (Sonder)
                  </td>
                  {prognoseListe.map((p, i) => (
                    <td
                      key={i}
                      className={`border-r ${isDarkMode ? "border-white/10" : "border-[#E2DCD5]"} p-2 text-center font-bold ${p.extraMonat > 0 ? textTitle : "text-slate-400 opacity-40"} last:border-r-0`}
                    >
                      {p.extraMonat.toFixed(0)}
                    </td>
                  ))}
                </tr>
                <tr className={`${isDarkMode ? "bg-white/[0.04]" : "bg-[#005377]/5"} font-black`}>
                  <td
                    className={`border-r ${isDarkMode ? "border-white/10" : "border-[#E2DCD5]"} p-2.5 text-left ${textTitle}`}
                  >
                    Net Reserve
                  </td>
                  {prognoseListe.map((p, i) => (
                    <td
                      key={i}
                      className={`border-r ${isDarkMode ? "border-white/10" : "border-[#E2DCD5]"} p-2.5 text-center text-[#005377] last:border-r-0 dark:text-[#82CBEE]`}
                    >
                      {p.freiVerfuegbar.toFixed(0)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* EXECUTED CAPEX & STRATEGIC BACKLOG */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Sonderbudgets */}
        <div className={`${bgCard} space-y-4 rounded-3xl border p-6 shadow-sm`}>
          <div className="flex items-center justify-between border-b border-black/10 pb-3 dark:border-white/10">
            <div>
              <h3 className={`font-mono text-xs font-black tracking-wider ${textTitle} uppercase`}>
                Scheduled Capex
              </h3>
              <p className="font-mono text-[10px] text-slate-400">
                Aktive Sonderausgaben im Runway
              </p>
            </div>
            <span className="rounded-full border border-black/10 bg-black/5 px-2.5 py-0.5 font-mono text-[10px] font-black dark:border-white/10 dark:bg-white/5">
              {sonderausgaben.length} POSTEN
            </span>
          </div>

          <div className="space-y-2.5">
            {sonderausgaben.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-2xl border p-4 transition-all hover:border-[#005377]/40 ${bgItem}`}
              >
                <div>
                  <span className={`text-xs font-bold ${textTitle} block`}>{item.was}</span>
                  <span className="font-mono text-[10px] font-semibold text-slate-400">
                    {item.wann}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm font-black ${textTitle}`}>
                    {item.hoehe.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                  </span>
                  <button
                    onClick={() => handleDeleteAusgabe(item.id)}
                    className="flex h-8 items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 font-mono text-[11px] font-bold text-emerald-600 transition-all hover:bg-emerald-500/20 dark:text-emerald-400"
                  >
                    <Check className="h-3.5 w-3.5" /> Erledigt
                  </button>
                  <button
                    onClick={() => handleDeleteAusgabe(item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-500/20 text-slate-400 transition-all hover:border-rose-500/40 hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {sonderausgaben.length === 0 && (
              <p className={`p-6 text-center font-mono text-xs ${textSub}`}>
                Keine Sonderausgaben gebucht.
              </p>
            )}
          </div>
        </div>

        {/* Strategic Backlog */}
        <div className={`${bgCard} space-y-4 rounded-3xl border p-6 shadow-sm`}>
          <div className="border-b border-black/10 pb-3 dark:border-white/10">
            <h3 className={`font-mono text-xs font-black tracking-wider ${textTitle} uppercase`}>
              Strategic Wishlist & Backlog
            </h3>
            <p className="font-mono text-[10px] text-slate-400">
              Ideen und Vorhaben zur späteren Allokation
            </p>
          </div>

          <form onSubmit={handleAddBacklog} className="grid grid-cols-12 gap-2">
            <input
              type="text"
              placeholder="Posten..."
              value={neuBWas}
              onChange={(e) => setNeuBWas(e.target.value)}
              className={`col-span-6 rounded-xl border ${bgInput} p-2.5 text-xs font-medium focus:outline-none`}
            />
            <input
              type="number"
              placeholder="Betrag (€)"
              value={neuBHoehe}
              onChange={(e) => setNeuBHoehe(e.target.value)}
              className={`col-span-3 rounded-xl border ${bgInput} p-2.5 font-mono text-xs font-bold focus:outline-none`}
            />
            <button
              type="submit"
              className={`col-span-3 rounded-xl font-mono text-xs font-bold uppercase ${buttonPrimary}`}
            >
              Hinzufügen
            </button>
          </form>

          <div className="space-y-2.5 pt-1">
            {backlog.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${bgItem}`}
              >
                <div>
                  <span className={`text-xs font-bold ${textTitle} block`}>{item.was}</span>
                  <span className="font-mono text-xs font-black text-[#005377] dark:text-[#82CBEE]">
                    {item.hoehe.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={backlogDates[item.id] || "2026-08-26"}
                    onChange={(e) => setBacklogDates((p) => ({ ...p, [item.id]: e.target.value }))}
                    className={`rounded-xl border ${bgInput} p-1.5 font-mono text-[10px] font-bold`}
                  />
                  <button
                    onClick={() => handlePlanBacklog(item)}
                    className={`flex h-8 items-center gap-1 rounded-xl px-3 font-mono text-[11px] font-bold ${buttonPrimary}`}
                  >
                    Allokieren ⬆
                  </button>
                  <button
                    onClick={() => handleDeleteBacklog(item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 text-slate-400 transition-all hover:text-rose-500 dark:border-white/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {backlog.length === 0 && (
              <p className={`p-6 text-center font-mono text-xs ${textSub}`}>Backlog ist leer.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
