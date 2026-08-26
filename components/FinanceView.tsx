import React, { useState } from "react";
import { Lock, ShieldCheck, Trash2, Check, ArrowUpRight } from "lucide-react";

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
      alert("Falscher PIN!");
      setPinInput("");
    }
  };

  // Simulationsmonate 2026-08 bis 2027-12
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

  // Tagesgenaue Simulation
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

  // Chart Skalierung
  const maxCashflow = 2200;
  const maxBudget = 14000;
  const chartHeight = 180;
  const chartWidth = 700;
  const stepX = chartWidth / (prognoseListe.length - 1);

  const linePoints = prognoseListe
    .map((p, idx) => {
      const x = idx * stepX;
      const y = chartHeight - (Math.max(0, p.freiVerfuegbar) / maxBudget) * chartHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // 🔒 PIN-SPERRE
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center space-y-4">
        <div
          className={`w-full max-w-sm space-y-4 rounded-3xl border p-8 text-center shadow-sm ${bgCard}`}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#005377]/10 text-[#005377] dark:text-[#82CBEE]">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${textTitle}`}>Finanz-Workspace</h2>
            <p className={`mt-1 text-xs ${textSub}`}>Zugriff geschützt</p>
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
              className={`w-full rounded-xl py-2 text-xs font-bold ${buttonPrimary}`}
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
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#E8E2D9] pb-4 sm:flex-row sm:items-center dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl font-bold tracking-tight md:text-3xl ${textTitle}`}>
              Finanz-Simulator
            </h1>
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeBlue}`}
            >
              <ShieldCheck className="h-3 w-3" /> Aktiv
            </span>
          </div>
          <p className={`mt-0.5 text-xs ${textSub}`}>Prognosen, Monatsbudgets und Sonderausgaben</p>
        </div>

        <button
          onClick={() => setIsAuthenticated(false)}
          className={`flex h-8 items-center gap-1.5 self-start rounded-xl border px-3 text-xs font-semibold ${bgItem} ${textSub} hover:${textTitle} sm:self-auto`}
        >
          <Lock className="h-3.5 w-3.5" /> Sperren
        </button>
      </div>

      {/* 4 Metriken (Monochrom & Clean) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={`${bgCard} rounded-2xl border p-4 shadow-sm`}>
          <span className={`text-[11px] font-medium ${textSub}`}>Liquidität (Aktuell)</span>
          <div className={`mt-1 font-mono text-2xl font-bold ${textTitle}`}>
            {aktuellerSaldo.toFixed(2)} €
          </div>
        </div>

        <div className={`${bgCard} rounded-2xl border p-4 shadow-sm`}>
          <span className={`text-[11px] font-medium ${textSub}`}>Prognose ({zielDatum})</span>
          <div className={`mt-1 font-mono text-2xl font-bold ${textTitle}`}>
            {simSaldo.toFixed(2)} €
          </div>
        </div>

        <div className={`${bgCard} rounded-2xl border p-4 shadow-sm`}>
          <span className={`text-[11px] font-medium ${textSub}`}>
            Frei verfügbar (Monat {fokusMonat})
          </span>
          <div className={`mt-1 font-mono text-2xl font-bold ${accentBlue}`}>
            {freiVerfuegbarFokus.toFixed(2)} €
          </div>
        </div>

        <div className={`${bgCard} rounded-2xl border p-4 shadow-sm`}>
          <span className={`text-[11px] font-medium ${textSub}`}>
            Sonderausgaben (M {fokusMonat})
          </span>
          <div className={`mt-1 font-mono text-2xl font-bold ${textTitle}`}>
            {sonderFokus.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Grid: Kontrollzentrum & Taktischer Ausblick */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Kontrollzentrum */}
        <div className="space-y-6 lg:col-span-4">
          <div className={`${bgCard} space-y-4 rounded-2xl border p-5 shadow-sm`}>
            <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
              Kontrollzentrum
            </h3>

            <div className="space-y-1.5 border-b border-[#E8E2D9] pb-4 dark:border-white/[0.08]">
              <label className={`text-xs font-medium ${textSub}`}>Aktueller Kontostand (€)</label>
              <input
                type="number"
                step="10"
                value={aktuellerSaldo}
                onChange={(e) => setAktuellerSaldo(parseFloat(e.target.value) || 0)}
                className={`w-full rounded-xl border ${bgInput} p-2 font-mono text-sm font-semibold`}
              />
            </div>

            <div className="space-y-3 border-b border-[#E8E2D9] pb-4 dark:border-white/[0.08]">
              <h4 className={`text-xs font-semibold ${textTitle}`}>Target-Prognose</h4>
              <div>
                <label className={`text-[11px] ${textSub}`}>Wunschdatum</label>
                <input
                  type="date"
                  value={zielDatum}
                  onChange={(e) => setZielDatum(e.target.value)}
                  className={`mt-1 w-full rounded-xl border ${bgInput} p-2 text-xs font-medium`}
                />
              </div>
              <div>
                <label className={`text-[11px] ${textSub}`}>Fokus-Monat</label>
                <select
                  value={fokusMonat}
                  onChange={(e) => setFokusMonat(parseInt(e.target.value, 10))}
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
                className={`w-full rounded-xl border ${bgInput} p-2 text-xs font-medium`}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="10"
                  placeholder="Betrag (€)"
                  value={neuHoehe}
                  onChange={(e) => setNeuHoehe(e.target.value)}
                  className={`w-full rounded-xl border ${bgInput} p-2 text-xs font-semibold`}
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
                Speichern
              </button>
            </form>
          </div>
        </div>

        {/* Taktischer Ausblick & Dezenter Chart */}
        <div className="space-y-6 lg:col-span-8">
          <div>
            <h2 className={`text-lg font-bold ${textTitle}`}>Taktischer Ausblick (2026 - 2027)</h2>
            <p className={`mt-0.5 text-xs ${textSub}`}>
              {`Frei verfügbares Budget nach allen Abzügen bis zum nächsten Gehaltseingang.`}
            </p>
          </div>

          {/* Clean Monochrome Matrix-Tabelle */}
          <div
            className={`overflow-x-auto rounded-2xl border ${isDarkMode ? "border-white/[0.08] bg-[#140C0E]" : "border-[#E8E2D9] bg-[#FFFFFF]"}`}
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
                    className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-center text-xs font-bold`}
                  >
                    2026
                  </th>
                  <th colSpan={12} className="p-2 text-center text-xs font-bold">
                    2027
                  </th>
                </tr>
                <tr
                  className={`border-b ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} ${textSub}`}
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
                className={`divide-y ${isDarkMode ? "divide-white/[0.05]" : "divide-[#E8E2D9]"}`}
              >
                <tr>
                  <td
                    className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-left ${textSub}`}
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
                    className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-left ${textSub}`}
                  >
                    Fixkosten
                  </td>
                  {prognoseListe.map((p, i) => (
                    <td
                      key={i}
                      className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-center opacity-70 last:border-r-0`}
                    >
                      {p.fixMonat.toFixed(0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td
                    className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-left ${textSub}`}
                  >
                    Sonderbudgets
                  </td>
                  {prognoseListe.map((p, i) => (
                    <td
                      key={i}
                      className={`border-r ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"} p-2 text-center font-medium ${p.extraMonat > 0 ? textTitle : "opacity-40"} last:border-r-0`}
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

          {/* Minimalistischer Chart */}
          <div className={`${bgCard} space-y-3 rounded-2xl border p-5 shadow-sm`}>
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                Verlauf & Liquiditäts-Kurve
              </h3>
              <div className="flex items-center gap-4 text-[11px] font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#005377] dark:bg-[#82CBEE]" />
                  <span className={textSub}>Eingang</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-400 opacity-60" />
                  <span className={textSub}>Ausgaben</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 bg-[#005377] dark:bg-[#82CBEE]" />
                  <span className={textSub}>Freies Budget</span>
                </div>
              </div>
            </div>

            <div className="relative pt-2">
              <div className="flex">
                <div className="flex h-44 flex-col justify-between pr-2 text-right font-mono text-[9px] text-slate-400">
                  <span>2k</span>
                  <span>1.5k</span>
                  <span>1k</span>
                  <span>0.5k</span>
                  <span>0</span>
                </div>

                <div
                  className={`relative h-44 flex-1 border-b border-l ${isDarkMode ? "border-white/[0.08]" : "border-black/[0.08]"}`}
                >
                  <div className="absolute inset-0 flex items-end justify-between px-2">
                    {prognoseListe.map((p, idx) => {
                      const hIn = Math.min(100, (p.gehaltEnde / maxCashflow) * 100);
                      const hOut = Math.min(100, (p.ausgabenGesamt / maxCashflow) * 100);

                      return (
                        <div
                          key={idx}
                          className="flex h-full w-full items-end justify-center gap-0.5"
                        >
                          <div
                            style={{ height: `${hIn}%` }}
                            className="w-1.5 rounded-t-xs bg-[#005377] opacity-80 dark:bg-[#82CBEE]"
                            title={`Eingang: ${p.gehaltEnde.toFixed(2)} €`}
                          />
                          <div
                            style={{ height: `${hOut}%` }}
                            className="w-1.5 rounded-t-xs bg-slate-400 opacity-40 dark:bg-slate-600"
                            title={`Ausgaben: ${p.ausgabenGesamt.toFixed(2)} €`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke={isDarkMode ? "#82CBEE" : "#005377"}
                      strokeWidth="2.5"
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
                          r="2.5"
                          fill={isDarkMode ? "#82CBEE" : "#005377"}
                        />
                      );
                    })}
                  </svg>
                </div>

                <div className="flex h-44 flex-col justify-between pl-2 text-left font-mono text-[9px] text-slate-400">
                  <span>12k</span>
                  <span>9k</span>
                  <span>6k</span>
                  <span>3k</span>
                  <span>0</span>
                </div>
              </div>

              <div className="mt-2 flex justify-between pr-6 pl-6 font-mono text-[9px] text-slate-400">
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

      {/* Sonderausgaben & Backlog (Clean & Monochrom) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Sonderbudgets */}
        <div className={`${bgCard} space-y-4 rounded-2xl border p-5 shadow-sm`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
              Geplante Sonderbudgets
            </h3>
            <span className={`font-mono text-xs font-bold ${badgeBlue} rounded-full px-2.5 py-0.5`}>
              {sonderausgaben.length} Posten
            </span>
          </div>

          <div className="space-y-2.5">
            {sonderausgaben.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-xl border p-3 ${bgItem}`}
              >
                <div>
                  <span className={`text-xs font-semibold ${textTitle} block`}>{item.was}</span>
                  <span className="text-[10px] text-slate-400">{item.wann}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-xs font-bold ${textTitle}`}>
                    {item.hoehe.toFixed(2)} €
                  </span>
                  <button
                    onClick={() => handleDeleteAusgabe(item.id)}
                    className="flex h-7 items-center gap-1 rounded-lg border border-black/10 px-2 text-[11px] font-semibold opacity-80 hover:opacity-100 dark:border-white/10"
                  >
                    <Check className="h-3 w-3" /> Erledigt
                  </button>
                  <button
                    onClick={() => handleDeleteAusgabe(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg opacity-60 hover:opacity-100"
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
            <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
              Backlog (Wunschliste)
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
              className={`col-span-6 rounded-xl border ${bgInput} p-2 text-xs font-medium`}
            />
            <input
              type="number"
              placeholder="€"
              value={neuBHoehe}
              onChange={(e) => setNeuBHoehe(e.target.value)}
              className={`col-span-3 rounded-xl border ${bgInput} p-2 text-xs font-semibold`}
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
                  <span className="font-mono text-xs font-bold opacity-80">
                    {item.hoehe.toFixed(2)} €
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
                    className="flex h-7 w-7 items-center justify-center rounded-lg opacity-60 hover:opacity-100"
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
