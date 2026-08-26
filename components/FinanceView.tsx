import React, { useState } from "react";
import { Lock, ShieldCheck, Trash2, Check } from "lucide-react";

interface Sonderausgabe {
  id: string;
  was: string;
  hoehe: number;
  wann: string; // YYYY-MM-DD
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

  const { bgCard, bgItem, bgInput, textTitle, textSub, badgeGreen, buttonPrimary } = theme;

  // --- STREAMLIT BASIS-WERTE & DATEN ---
  const [aktuellerSaldo, setAktuellerSaldo] = useState<number>(500.0);
  const fixEinnahmen = 880.0;
  const fixAusgaben = 70.0;
  const [fokusMonat, setFokusMonat] = useState<number>(8);
  const [zielDatum, setZielDatum] = useState<string>("2026-08-31");

  // Sonderausgaben (State)
  const [sonderausgaben, setSonderausgaben] = useState<Sonderausgabe[]>([
    { id: "1", was: "Miete", hoehe: 380.0, wann: "2026-09-01" },
    { id: "2", was: "Geburtstagsgeschenk Lena", hoehe: 200.0, wann: "2026-09-05" },
    { id: "3", was: "Urlaub Restzahlung", hoehe: 300.0, wann: "2026-09-15" },
    { id: "4", was: "Versicherung KFZ", hoehe: 250.0, wann: "2027-02-15" },
    { id: "5", was: "Sonderanschaffung", hoehe: 2000.0, wann: "2027-03-01" }
  ]);

  // Backlog / Wunschliste (State)
  const [backlog, setBacklog] = useState<BacklogItem[]>([
    { id: "b1", was: "Braun Series 9 Pro", hoehe: 250.0 }
  ]);
  const [backlogDates, setBacklogDates] = useState<Record<string, string>>({
    b1: "2026-08-26"
  });

  // Neue Ausgaben Inputs
  const [neuWas, setNeuWas] = useState("");
  const [neuHoehe, setNeuHoehe] = useState<string>("");
  const [neuWann, setNeuWann] = useState("2026-08-26");

  // Neuer Backlog Input
  const [neuBWas, setNeuBWas] = useState("");
  const [neuBHoehe, setNeuBHoehe] = useState<string>("");

  // Bonus-Berechnung aus Streamlit
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
      alert("Falscher PIN!");
      setPinInput("");
    }
  };

  // -------------------------------------------------------------
  // 1. SIMULATIONSMONATE (2026-08 bis 2027-12)
  // -------------------------------------------------------------
  const monate2026 = [8, 9, 10, 11, 12];
  const monate2027 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const simulationsMonate: { jahr: number; monat: number }[] = [
    ...monate2026.map((m) => ({ jahr: 2026, monat: m })),
    ...monate2027.map((m) => ({ jahr: 2027, monat: m }))
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

    const label = `${monat < 10 ? `0${monat}` : monat}/${String(jahr).slice(2)}`;

    return {
      jahr,
      monat,
      label,
      gehaltEnde,
      fixMonat,
      extraMonat,
      ausgabenGesamt: fixMonat + extraMonat,
      freiVerfuegbar
    };
  });

  // -------------------------------------------------------------
  // 2. TAGESGENAUE PROGNOSE BIS ZUM WUNSCHDATUM
  // -------------------------------------------------------------
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

  // Fokus-Monat Werte
  const fokusRow = prognoseListe.find(
    (p) => p.monat === fokusMonat && p.jahr === (fokusMonat >= 8 ? 2026 : 2027)
  );
  const freiVerfuegbarFokus = fokusRow ? fokusRow.freiVerfuegbar : 0.0;
  const sonderFokus = fokusRow ? fokusRow.extraMonat : 0.0;

  // Handler Sonderausgaben
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

  // Handler Backlog
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

  // Chart-Berechnungen (1:1 Skalierung für Balken und Budget-Linie)
  const maxCashflow = 2200; // Für y-Achse links
  const maxBudget = 14000; // Für y-Achse rechts

  // SVG Line Chart Punkte für "Frei Verfügbar (Budget)"
  const chartWidth = 720;
  const chartHeight = 220;
  const stepX = chartWidth / (prognoseListe.length - 1);

  const linePoints = prognoseListe
    .map((p, idx) => {
      const x = idx * stepX;
      const y = chartHeight - (Math.max(0, p.freiVerfuegbar) / maxBudget) * chartHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // 🔒 LOGIN-SPERRE
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center space-y-4">
        <div
          className={`w-full max-w-sm space-y-4 rounded-3xl border p-8 text-center shadow-2xl ${bgCard}`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#005377]/10 text-[#005377] dark:text-[#82CBEE]">
            <Lock className="h-7 w-7" />
          </div>
          <div>
            <h2 className={`text-xl font-black ${textTitle}`}>WealthDashboard Pro</h2>
            <p className={`mt-1 text-xs ${textSub}`}>Privater Finanzbereich. Nur für Jonas.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="PIN eingeben..."
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className={`w-full rounded-xl border px-4 py-2.5 text-center font-mono text-lg tracking-widest ${bgInput} focus:outline-none`}
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
      {/* ========================================================= */}
      {/* 1. TOP BAR & 4 METRIKEN */}
      {/* ========================================================= */}
      <div className="flex flex-col justify-between gap-4 border-b border-black/5 pb-4 sm:flex-row sm:items-center dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-3xl font-black tracking-tight ${textTitle}`}>
              💼 WealthDashboard Pro
            </h1>
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeGreen}`}
            >
              <ShieldCheck className="h-3 w-3" /> Live
            </span>
          </div>
          <p className={`mt-1 text-xs ${textSub}`}>
            Interaktiver Finanz-Simulator mit Cloud-Datenbank & Prognose-Cockpits
          </p>
        </div>

        <button
          onClick={() => setIsAuthenticated(false)}
          className="flex h-8 items-center gap-1.5 self-start rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-bold text-rose-500 hover:bg-rose-500/20 sm:self-auto"
        >
          <Lock className="h-3.5 w-3.5" /> Sperren
        </button>
      </div>

      {/* Die 4 Top-Metriken */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div>
          <span className={`text-[11px] font-semibold text-slate-400`}>Liquidität (Aktuell)</span>
          <div className={`mt-1 font-mono text-3xl font-bold ${textTitle}`}>
            {aktuellerSaldo.toFixed(2)} €
          </div>
        </div>

        <div>
          <span className={`text-[11px] font-semibold text-slate-400`}>
            Prognose zum {zielDatum}
          </span>
          <div className={`mt-1 font-mono text-3xl font-bold ${textTitle}`}>
            {simSaldo.toFixed(2)} €
          </div>
        </div>

        <div>
          <span className={`text-[11px] font-semibold text-slate-400`}>
            Frei verfügbar (Monat {fokusMonat})
          </span>
          <div className={`mt-1 font-mono text-3xl font-bold ${textTitle}`}>
            {freiVerfuegbarFokus.toFixed(2)} €
          </div>
        </div>

        <div>
          <span className={`text-[11px] font-semibold text-slate-400`}>
            Geplante Sonderausgaben (Monat {fokusMonat})
          </span>
          <div className={`mt-1 font-mono text-3xl font-bold ${textTitle}`}>
            {sonderFokus.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. GRID: KONTROLLZENTRUM (LINKS) & TAKTISCHER AUSBLICK (RECHTS) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LINKE SPALTE: KONTROLLZENTRUM */}
        <div className="space-y-6 lg:col-span-4">
          <div className={`${bgCard} space-y-4 rounded-2xl border p-6 shadow-sm`}>
            <h3 className={`text-xs font-black tracking-wider uppercase ${textTitle}`}>
              🕹️ Kontrollzentrum
            </h3>

            {/* Saldo anpassen */}
            <div className="space-y-1.5 border-b border-black/5 pb-4 dark:border-white/5">
              <label className={`text-xs font-bold ${textSub}`}>💰 Aktueller Kontostand (€)</label>
              <input
                type="number"
                step="10"
                value={aktuellerSaldo}
                onChange={(e) => setAktuellerSaldo(parseFloat(e.target.value) || 0)}
                className={`w-full rounded-xl border ${bgInput} p-2 font-mono text-sm font-bold`}
              />
            </div>

            {/* Target-Prognose */}
            <div className="space-y-3 border-b border-black/5 pb-4 dark:border-white/5">
              <h4 className={`text-xs font-bold ${textTitle}`}>🔮 Target-Prognose</h4>
              <div>
                <label className={`text-[11px] font-semibold ${textSub}`}>
                  Wunschdatum für Kontostand-Check
                </label>
                <input
                  type="date"
                  value={zielDatum}
                  onChange={(e) => setZielDatum(e.target.value)}
                  className={`mt-1 w-full rounded-xl border ${bgInput} p-2 text-xs font-bold`}
                />
              </div>
              <div>
                <label className={`text-[11px] font-semibold ${textSub}`}>
                  Fokus-Monat für Standard-Analyse
                </label>
                <select
                  value={fokusMonat}
                  onChange={(e) => setFokusMonat(parseInt(e.target.value, 10))}
                  className={`mt-1 w-full rounded-xl border ${bgInput} p-2 text-xs font-bold`}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sonderausgabe planen */}
            <form onSubmit={handleAddAusgabe} className="space-y-3">
              <h4 className={`text-xs font-bold ${textTitle}`}>➕ Sonderausgabe planen</h4>
              <input
                type="text"
                placeholder="Zweck / Beschreibung"
                value={neuWas}
                onChange={(e) => setNeuWas(e.target.value)}
                className={`w-full rounded-xl border ${bgInput} p-2 text-xs font-medium`}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="10"
                  placeholder="Betrag (€)"
                  value={neuHoehe}
                  onChange={(e) => setNeuHoehe(e.target.value)}
                  className={`w-full rounded-xl border ${bgInput} p-2 text-xs font-bold`}
                />
                <input
                  type="date"
                  value={neuWann}
                  onChange={(e) => setNeuWann(e.target.value)}
                  className={`w-full rounded-xl border ${bgInput} p-2 text-xs font-bold`}
                />
              </div>
              <button
                type="submit"
                className={`w-full rounded-xl py-2.5 text-xs font-bold ${buttonPrimary}`}
              >
                Ausgabe dauerhaft speichern
              </button>
            </form>
          </div>
        </div>

        {/* RECHTE SPALTE: 1:1 TABELLE & 1:1 DIAGRAMM */}
        <div className="space-y-6 lg:col-span-8">
          <div>
            <h2 className={`text-xl font-bold ${textTitle} flex items-center gap-2`}>
              📅 Taktischer Ausblick (2026 - 2027)
            </h2>
            <p className={`mt-1 text-xs ${textSub}`}>
              {`Das 'Frei Verfügbare' Budget zeigt das Geld, das dir nach allen Abzügen in dem Monat bis zum Eintreffen des nächsten Gehalts verbleibt.`}
            </p>
          </div>

          {/* ========================================================= */}
          {/* 1:1 STREAMLIT TABELLE MIT RAHMENLINIEN & HEADER-HIERARCHIE */}
          {/* ========================================================= */}
          <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-[#121417]">
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                {/* 1. Header-Zeile: Jahr */}
                <tr className="border-b border-slate-700/80 bg-[#1A1D23] text-slate-300">
                  <th className="border-r border-slate-700/80 p-2 text-left font-bold" />
                  <th
                    colSpan={5}
                    className="border-r border-slate-700/80 p-2 text-center font-bold"
                  >
                    2026
                  </th>
                  <th colSpan={12} className="p-2 text-center font-bold">
                    2027
                  </th>
                </tr>
                {/* 2. Header-Zeile: Monat */}
                <tr className="border-b border-slate-700/80 bg-[#16191E] text-slate-400">
                  <th className="border-r border-slate-700/80 p-2 text-left font-semibold">
                    Kategorie
                  </th>
                  {prognoseListe.map((p, i) => (
                    <th
                      key={i}
                      className="border-r border-slate-700/80 p-2 text-center font-semibold last:border-r-0"
                    >
                      {p.monat}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-200">
                <tr>
                  <td className="border-r border-slate-700/60 p-2 text-left font-medium text-slate-400">
                    Gehalt (am Monatsende)
                  </td>
                  {prognoseListe.map((p, i) => (
                    <td
                      key={i}
                      className="border-r border-slate-700/60 p-2 text-center last:border-r-0"
                    >
                      {p.gehaltEnde.toFixed(p.gehaltEnde % 1 === 0 ? 0 : 2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border-r border-slate-700/60 p-2 text-left font-medium text-slate-400">
                    Fixkosten
                  </td>
                  {prognoseListe.map((p, i) => (
                    <td
                      key={i}
                      className="border-r border-slate-700/60 p-2 text-center last:border-r-0"
                    >
                      {p.fixMonat.toFixed(0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border-r border-slate-700/60 p-2 text-left font-medium text-slate-400">
                    Sonderbudgets
                  </td>
                  {prognoseListe.map((p, i) => (
                    <td
                      key={i}
                      className="border-r border-slate-700/60 p-2 text-center last:border-r-0"
                    >
                      {p.extraMonat.toFixed(0)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-[#181C22] font-bold">
                  <td className="border-r border-slate-700/60 p-2 text-left text-slate-200">
                    Frei Verfügbar (Saldo)
                  </td>
                  {prognoseListe.map((p, i) => (
                    <td
                      key={i}
                      className="border-r border-slate-700/60 p-2 text-center text-slate-100 last:border-r-0"
                    >
                      {p.freiVerfuegbar.toFixed(2)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* 1:1 PLOTLY KOMBI-DIAGRAMM (DUAL-AXIS BAR & SCATTER) */}
          {/* ========================================================= */}
          <div className="space-y-2 rounded-2xl border border-slate-700/60 bg-[#121417] p-5">
            {/* Header & Legende oben rechts */}
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <h3 className="text-sm font-bold text-slate-200">
                Simulierter Vermögensverlauf (Monatsbudgets) bis Ende 2027
              </h3>
              <div className="flex items-center gap-4 text-[11px] font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-[#2ca02c]" />
                  <span className="text-slate-300">Eingang Monatsende</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-[#d62728]" />
                  <span className="text-slate-300">Ausgaben Monat</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-[#1f77b4]" />
                  <span className="text-slate-300">Frei Verfügbar (Budget)</span>
                </div>
              </div>
            </div>

            {/* Chart Area mit linker & rechter Y-Achse */}
            <div className="relative pt-4">
              <div className="flex">
                {/* Linke Y-Achse (Monatliche Cashflows) */}
                <div className="flex h-56 flex-col justify-between pr-2 text-right font-mono text-[10px] text-slate-500">
                  <span>2000</span>
                  <span>1500</span>
                  <span>1000</span>
                  <span>500</span>
                  <span>0</span>
                </div>

                {/* Plot Canvas */}
                <div className="relative h-56 flex-1 border-b border-l border-slate-700">
                  {/* Horizontale Gitterlinien */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-15">
                    <div className="border-b border-slate-500" />
                    <div className="border-b border-slate-500" />
                    <div className="border-b border-slate-500" />
                    <div className="border-b border-slate-500" />
                    <div className="border-b border-slate-500" />
                  </div>

                  {/* Balken (Grouped Bars) */}
                  <div className="absolute inset-0 flex items-end justify-between px-2">
                    {prognoseListe.map((p, idx) => {
                      const hGreen = Math.min(100, (p.gehaltEnde / maxCashflow) * 100);
                      const hRed = Math.min(100, (p.ausgabenGesamt / maxCashflow) * 100);

                      return (
                        <div
                          key={idx}
                          className="flex h-full w-full items-end justify-center gap-0.5"
                        >
                          {/* Grüner Balken: Eingang Monatsende */}
                          <div
                            style={{ height: `${hGreen}%` }}
                            className="w-1.5 rounded-t-xs bg-[#2ca02c] transition-all hover:opacity-80"
                            title={`Eingang: ${p.gehaltEnde.toFixed(2)} €`}
                          />
                          {/* Roter Balken: Ausgaben Monat */}
                          <div
                            style={{ height: `${hRed}%` }}
                            className="w-1.5 rounded-t-xs bg-[#d62728] transition-all hover:opacity-80"
                            title={`Ausgaben: ${p.ausgabenGesamt.toFixed(2)} €`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Blaue Linie: Frei Verfügbar (Budget) Overlay */}
                  <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                    <polyline fill="none" stroke="#1f77b4" strokeWidth="3.5" points={linePoints} />
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
                          fill="#1f77b4"
                          className="hover:r-5 transition-all"
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Rechte Y-Achse (Freies Budget) */}
                <div className="flex h-56 flex-col justify-between pl-2 text-left font-mono text-[10px] text-slate-500">
                  <span>12k</span>
                  <span>10k</span>
                  <span>8k</span>
                  <span>6k</span>
                  <span>4k</span>
                  <span>2k</span>
                  <span>0</span>
                </div>
              </div>

              {/* X-Achsen Beschriftung */}
              <div className="mt-2 flex justify-between pr-6 pl-8 font-mono text-[10px] text-slate-400">
                {prognoseListe
                  .filter((_, i) => i % 2 === 0)
                  .map((p, i) => (
                    <span key={i}>
                      {p.jahr === 2026
                        ? `Sep ${p.jahr}`
                        : `${p.monat === 1 ? "Jan" : p.monat === 3 ? "Mar" : p.monat === 5 ? "May" : p.monat === 7 ? "Jul" : p.monat === 9 ? "Sep" : "Nov"} 2027`}
                    </span>
                  ))}
              </div>
              <div className="mt-1 text-center font-mono text-[11px] text-slate-500">
                Zeitraum (Jahr-Monat)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SONDERAUSGABEN (MIT ERLEDIGT & LÖSCHEN) & BACKLOG */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Geplante Sonderbudgets verwalten */}
        <div className={`${bgCard} space-y-4 rounded-3xl border p-6 shadow-sm`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-black tracking-wider uppercase ${textTitle}`}>
              🗓️ Geplante Sonderbudgets verwalten
            </h3>
            <span className="font-mono text-xs font-bold text-slate-400">
              {sonderausgaben.length} Posten
            </span>
          </div>

          <div className="space-y-3">
            {sonderausgaben.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-2xl border p-3.5 ${bgItem}`}
              >
                <div className="space-y-0.5">
                  <span className={`text-xs font-bold ${textTitle} block`}>🏷️ {item.was}</span>
                  <span className="font-mono text-xs font-black text-slate-200">
                    {item.hoehe.toFixed(2)} €
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-400">
                    📅 Datum: {item.wann}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteAusgabe(item.id)}
                    className="flex h-8 items-center gap-1 rounded-xl bg-emerald-500/15 px-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25"
                  >
                    <Check className="h-3.5 w-3.5" /> Erledigt 💸
                  </button>
                  <button
                    onClick={() => handleDeleteAusgabe(item.id)}
                    className="flex h-8 items-center gap-1 rounded-xl bg-rose-500/15 px-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/25"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Löschen 🗑️
                  </button>
                </div>
              </div>
            ))}
            {sonderausgaben.length === 0 && (
              <p className={`p-4 text-center text-xs ${textSub}`}>
                Aktuell keine Sonderausgaben für die Zukunft geplant.
              </p>
            )}
          </div>
        </div>

        {/* Backlog (Wunschliste & Ideen) */}
        <div className={`${bgCard} space-y-4 rounded-3xl border p-6 shadow-sm`}>
          <div>
            <h3 className={`text-sm font-black tracking-wider uppercase ${textTitle}`}>
              🛒 Backlog (Wunschliste & Ideen)
            </h3>
            <p className={`text-[11px] ${textSub}`}>
              Notiere hier Dinge, die du gerne hättest. Wenn es soweit ist, wähle ein Datum und
              ziehe sie in deine aktiven Ausgaben.
            </p>
          </div>

          <form onSubmit={handleAddBacklog} className="grid grid-cols-12 gap-2">
            <input
              type="text"
              placeholder="Was steht auf der Wunschliste?"
              value={neuBWas}
              onChange={(e) => setNeuBWas(e.target.value)}
              className={`col-span-6 rounded-xl border ${bgInput} p-2 text-xs font-medium`}
            />
            <input
              type="number"
              placeholder="Geschätzte Kosten (€)"
              value={neuBHoehe}
              onChange={(e) => setNeuBHoehe(e.target.value)}
              className={`col-span-3 rounded-xl border ${bgInput} p-2 text-xs font-bold`}
            />
            <button
              type="submit"
              className={`col-span-3 rounded-xl text-xs font-bold ${buttonPrimary}`}
            >
              Auf die Liste 📝
            </button>
          </form>

          <div className="space-y-3 pt-2">
            {backlog.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col justify-between gap-2 rounded-2xl border p-3.5 sm:flex-row sm:items-center ${bgItem}`}
              >
                <div className="space-y-0.5">
                  <span className={`text-xs font-bold ${textTitle} block`}>💭 {item.was}</span>
                  <span className="font-mono text-xs font-black text-slate-200">
                    {item.hoehe.toFixed(2)} €
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400">Kaufdatum?</span>
                    <input
                      type="date"
                      value={backlogDates[item.id] || "2026-08-26"}
                      onChange={(e) =>
                        setBacklogDates((p) => ({ ...p, [item.id]: e.target.value }))
                      }
                      className={`rounded-lg border ${bgInput} p-1 text-[10px] font-bold`}
                    />
                  </div>
                  <button
                    onClick={() => handlePlanBacklog(item)}
                    className="flex h-8 items-center gap-1 rounded-xl bg-[#005377] px-2.5 text-xs font-bold text-white hover:bg-[#00415E]"
                  >
                    Planen ⬆️
                  </button>
                  <button
                    onClick={() => handleDeleteBacklog(item.id)}
                    className="flex h-8 items-center gap-1 rounded-xl bg-rose-500/10 px-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20"
                  >
                    Verwerfen 🗑️
                  </button>
                </div>
              </div>
            ))}
            {backlog.length === 0 && (
              <p className={`p-4 text-center text-xs ${textSub}`}>
                Dein Backlog ist aktuell leer. Zeit für neue Träume!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
