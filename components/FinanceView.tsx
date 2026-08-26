import React, { useState, useEffect } from "react";
import {
  Lock,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  ArrowUpRight,
  Calendar,
  DollarSign
} from "lucide-react";

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

  const {
    bgCard,
    bgItem,
    bgInput,
    textTitle,
    textSub,
    badgeBlue,
    badgeGreen,
    buttonPrimary,
    isDarkMode
  } = theme;

  // --- STREAMLIT BASIS-WERTE & DATEN ---
  const [aktuellerSaldo, setAktuellerSaldo] = useState<number>(500.0);
  const [fixEinnahmen, setFixEinnahmen] = useState<number>(880.0);
  const [fixAusgaben, setFixAusgaben] = useState<number>(70.0);
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
  const simulationsMonate: { jahr: number; monat: number }[] = [];
  for (let m = 8; m <= 12; m++) simulationsMonate.push({ jahr: 2026, monat: m });
  for (let m = 1; m <= 12; m++) simulationsMonate.push({ jahr: 2027, monat: m });

  let laufenderSaldo = aktuellerSaldo;
  const prognoseListe = simulationsMonate.map(({ jahr, monat }) => {
    const b = getBonus(monat);
    const gehaltEnde = fixEinnahmen + b;
    const fixMonat = jahr === 2026 && monat === 8 ? 0.0 : fixAusgaben;

    // Sonderausgaben für diesen Monat
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
      freiVerfuegbar
    };
  });

  // -------------------------------------------------------------
  // 2. TAGESGENAUE PROGNOSE BIS ZUM WUNSCHDATUM
  // -------------------------------------------------------------
  let simSaldo = aktuellerSaldo;
  const heute = new Date("2026-08-26");
  const targetDateObj = new Date(zielDatum);

  // Einfache tagesgenaue Logik
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

  const handleDoneAusgabe = (id: string) => {
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

  // 🔒 LOGIN-SPERRE
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center space-y-4">
        <div
          className={`rounded-3xl border p-8 shadow-2xl ${bgCard} w-full max-w-sm space-y-4 text-center`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#005377]/10 text-[#005377] dark:text-[#82CBEE]">
            <Lock className="h-7 w-7" />
          </div>
          <div>
            <h2 className={`text-xl font-black ${textTitle}`}>WealthDashboard Pro</h2>
            <p className={`text-xs ${textSub} mt-1`}>Privater Finanzbereich. Nur für Jonas.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="PIN eingeben..."
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className={`w-full text-center font-mono text-lg tracking-widest ${bgInput} rounded-xl border px-4 py-2.5 focus:outline-none`}
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
      {/* 1. TOP BAR & METRIKEN */}
      {/* ========================================================= */}
      <div className="flex flex-col justify-between gap-4 border-b border-black/5 pb-4 sm:flex-row sm:items-center dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-3xl font-black tracking-tight ${textTitle}`}>
              💼 WealthDashboard Pro
            </h1>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeGreen} flex items-center gap-1`}
            >
              <ShieldCheck className="h-3 w-3" /> Live
            </span>
          </div>
          <p className={`text-xs ${textSub} mt-1`}>
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

      {/* 4 Top-Metriken */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={`${bgCard} rounded-3xl border p-5 shadow-sm`}>
          <span className={`text-[11px] font-bold tracking-wider uppercase ${textSub}`}>
            Liquidität (Aktuell)
          </span>
          <div className="mt-1 font-mono text-2xl font-black text-[#005377] dark:text-[#82CBEE]">
            {aktuellerSaldo.toFixed(2)} €
          </div>
        </div>

        <div className={`${bgCard} rounded-3xl border p-5 shadow-sm`}>
          <span className={`text-[11px] font-bold tracking-wider uppercase ${textSub}`}>
            Prognose zum {zielDatum}
          </span>
          <div className="mt-1 font-mono text-2xl font-black text-emerald-500">
            {simSaldo.toFixed(2)} €
          </div>
        </div>

        <div className={`${bgCard} rounded-3xl border p-5 shadow-sm`}>
          <span className={`text-[11px] font-bold tracking-wider uppercase ${textSub}`}>
            Frei verfügbar (Monat {fokusMonat})
          </span>
          <div className="mt-1 font-mono text-2xl font-black text-emerald-500">
            {freiVerfuegbarFokus.toFixed(2)} €
          </div>
        </div>

        <div className={`${bgCard} rounded-3xl border p-5 shadow-sm`}>
          <span className={`text-[11px] font-bold tracking-wider uppercase ${textSub}`}>
            Geplante Sonderausgaben (M {fokusMonat})
          </span>
          <div className="mt-1 font-mono text-2xl font-black text-rose-500">
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
          <div className={`${bgCard} space-y-4 rounded-3xl border p-6 shadow-sm`}>
            <h3 className={`text-xs font-black tracking-wider uppercase ${textTitle}`}>
              🕹️ Kontrollzentrum
            </h3>

            {/* Saldo anpassen */}
            <div className="space-y-1.5 border-b border-black/5 pb-4 dark:border-white/5">
              <label className={`text-xs font-bold ${textSub}`}>💰 Aktueller Kontostand (€)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="10"
                  value={aktuellerSaldo}
                  onChange={(e) => setAktuellerSaldo(parseFloat(e.target.value) || 0)}
                  className={`w-full rounded-xl border ${bgInput} p-2 font-mono text-sm font-bold`}
                />
              </div>
            </div>

            {/* Target-Prognose */}
            <div className="space-y-3 border-b border-black/5 pb-4 dark:border-white/5">
              <h4 className={`text-xs font-bold ${textTitle}`}>🔮 Target-Prognose</h4>
              <div>
                <label className={`text-[11px] font-semibold ${textSub}`}>
                  Wunschdatum für Check
                </label>
                <input
                  type="date"
                  value={zielDatum}
                  onChange={(e) => setZielDatum(e.target.value)}
                  className={`mt-1 w-full rounded-xl border ${bgInput} p-2 text-xs font-bold`}
                />
              </div>
              <div>
                <label className={`text-[11px] font-semibold ${textSub}`}>Fokus-Monat</label>
                <select
                  value={fokusMonat}
                  onChange={(e) => setFokusMonat(parseInt(e.target.value, 10))}
                  className={`mt-1 w-full rounded-xl border ${bgInput} p-2 text-xs font-bold`}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Monat {i + 1}
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
                Ausgabe speichern
              </button>
            </form>
          </div>
        </div>

        {/* RECHTE SPALTE: TAKTISCHER AUSBLICK & CHART */}
        <div className="space-y-6 lg:col-span-8">
          <div className={`${bgCard} space-y-4 rounded-3xl border p-6 shadow-sm`}>
            <div>
              <h3 className={`text-sm font-black tracking-wider uppercase ${textTitle}`}>
                📅 Taktischer Ausblick (2026 - 2027)
              </h3>
              <p className={`text-xs ${textSub} mt-0.5`}>
                Das &apos;Frei Verfügbare&apos; Budget zeigt das Geld, das dir nach allen Abzügen in
                dem Monat verbleibt.
              </p>
            </div>

            {/* Matrix Tabelle */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-black/10 text-slate-400 dark:border-white/10">
                    <th className="py-2 pr-3 text-[10px] font-bold uppercase">Kategorie</th>
                    {prognoseListe.slice(0, 14).map((p, i) => (
                      <th key={i} className="px-2 py-2 text-center text-[10px]">
                        {p.jahr === 2026 && p.monat === 8
                          ? "2026 / 8"
                          : p.monat === 1
                            ? `2027 / ${p.monat}`
                            : p.monat}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  <tr>
                    <td className="py-2 pr-3 font-semibold text-slate-400">Gehalt (Monatsende)</td>
                    {prognoseListe.slice(0, 14).map((p, i) => (
                      <td key={i} className="px-2 py-2 text-center font-bold text-emerald-500">
                        {p.gehaltEnde.toFixed(0)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-semibold text-slate-400">Fixkosten</td>
                    {prognoseListe.slice(0, 14).map((p, i) => (
                      <td key={i} className="px-2 py-2 text-center text-slate-400">
                        {p.fixMonat.toFixed(0)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-semibold text-slate-400">Sonderbudgets</td>
                    {prognoseListe.slice(0, 14).map((p, i) => (
                      <td
                        key={i}
                        className={`px-2 py-2 text-center font-bold ${p.extraMonat > 0 ? "text-rose-500" : "text-slate-400"}`}
                      >
                        {p.extraMonat.toFixed(0)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-black/[0.02] font-black dark:bg-white/[0.02]">
                    <td className={`py-2.5 pr-3 ${textTitle}`}>Frei Verfügbar (Saldo)</td>
                    {prognoseListe.slice(0, 14).map((p, i) => (
                      <td
                        key={i}
                        className="px-2 py-2.5 text-center text-[#005377] dark:text-[#82CBEE]"
                      >
                        {p.freiVerfuegbar.toFixed(0)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Simulierter Vermögensverlauf (Visueller Bar/Line Chart Ersatz) */}
            <div className="border-t border-black/5 pt-4 dark:border-white/5">
              <h4 className={`text-xs font-bold uppercase ${textSub} mb-3`}>
                Simulierter Vermögensverlauf (Monatsbudgets)
              </h4>
              <div className="flex h-36 items-end gap-1.5 pt-6 pb-2">
                {prognoseListe.slice(0, 14).map((p, i) => {
                  const maxVal = 10000;
                  const barHeight = Math.min(100, Math.max(10, (p.freiVerfuegbar / maxVal) * 100));
                  return (
                    <div
                      key={i}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                    >
                      <div
                        style={{ height: `${barHeight}%` }}
                        className="w-full rounded-t-lg bg-gradient-to-t from-[#005377] to-[#82CBEE] opacity-90 transition-all hover:opacity-100"
                        title={`Monat ${p.monat}: ${p.freiVerfuegbar.toFixed(2)} €`}
                      />
                      <span className="font-mono text-[9px] text-slate-400">{p.monat}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SONDERAUSGABEN MANAGEMENT & BACKLOG */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Geplante Sonderbudgets verwalten */}
        <div className={`${bgCard} space-y-4 rounded-3xl border p-6 shadow-sm`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-black tracking-wider uppercase ${textTitle}`}>
              🗓️ Geplante Sonderbudgets verwalten
            </h3>
            <span className={`font-mono text-xs font-bold ${badgeBlue} rounded-full px-2.5 py-0.5`}>
              {sonderausgaben.length} aktiv
            </span>
          </div>

          <div className="space-y-2.5">
            {sonderausgaben.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-2xl border p-3.5 ${bgItem}`}
              >
                <div>
                  <span className={`text-xs font-bold ${textTitle} block`}>🏷️ {item.was}</span>
                  <span className={`text-[10px] font-semibold text-slate-400`}>📅 {item.wann}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black text-rose-500">
                    {item.hoehe.toFixed(2)} €
                  </span>
                  <button
                    onClick={() => handleDoneAusgabe(item.id)}
                    className="flex h-7 items-center gap-1 rounded-lg bg-emerald-500/15 px-2 text-[10px] font-bold text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400"
                  >
                    <Check className="h-3 w-3" /> Erledigt
                  </button>
                </div>
              </div>
            ))}
            {sonderausgaben.length === 0 && (
              <p className={`p-4 text-center text-xs ${textSub}`}>Keine Sonderausgaben geplant.</p>
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
              Notiere Wünsche. Wenn es soweit ist, wähle ein Datum und plane sie ein.
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
              placeholder="Kosten (€)"
              value={neuBHoehe}
              onChange={(e) => setNeuBHoehe(e.target.value)}
              className={`col-span-3 rounded-xl border ${bgInput} p-2 text-xs font-bold`}
            />
            <button
              type="submit"
              className={`col-span-3 rounded-xl text-xs font-bold ${buttonPrimary}`}
            >
              Auf Liste 📝
            </button>
          </form>

          <div className="space-y-2.5 pt-2">
            {backlog.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col justify-between gap-2 rounded-2xl border p-3.5 sm:flex-row sm:items-center ${bgItem}`}
              >
                <div>
                  <span className={`text-xs font-bold ${textTitle} block`}>💭 {item.was}</span>
                  <span className="font-mono text-xs font-black text-[#005377] dark:text-[#82CBEE]">
                    {item.hoehe.toFixed(2)} €
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={backlogDates[item.id] || "2026-08-26"}
                    onChange={(e) => setBacklogDates((p) => ({ ...p, [item.id]: e.target.value }))}
                    className={`rounded-lg border ${bgInput} p-1 text-[10px] font-bold`}
                  />
                  <button
                    onClick={() => handlePlanBacklog(item)}
                    className="flex h-7 items-center gap-1 rounded-lg bg-[#005377] px-2 text-[10px] font-bold text-white hover:bg-[#00415E]"
                  >
                    Planen ⬆️
                  </button>
                  <button
                    onClick={() => handleDeleteBacklog(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            {backlog.length === 0 && (
              <p className={`p-4 text-center text-xs ${textSub}`}>Dein Backlog ist aktuell leer.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
