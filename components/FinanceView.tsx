import React, { useState } from "react";
import { Lock, Unlock, TrendingUp, Home, ShieldCheck, DollarSign } from "lucide-react";

interface FinanceViewProps {
  theme: any;
}

export function FinanceView({ theme }: FinanceViewProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"wealth" | "immo" | "rente">("wealth");

  // PIN / Passwort festlegen (hier z. B. "1234")
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

  // --- 15-Jahre Rechner States ---
  const [netto, setNetto] = useState(3000);
  const [wachstum, setWachstum] = useState(3.0);
  const [startkapital, setStartkapital] = useState(25000);
  const [rendite, setRendite] = useState(6.0);
  const [fixkosten, setFixkosten] = useState(1200);
  const [lebenshaltung, setLebenshaltung] = useState(600);
  const [urlaubPA, setUrlaubPA] = useState(3000);
  const [inflation, setInflation] = useState(2.0);

  // Partner:in States
  const [nettoP, setNettoP] = useState(2500);
  const [wachstumP, setWachstumP] = useState(3.0);
  const [startkapitalP, setStartkapitalP] = useState(10000);
  const [fixkostenP, setFixkostenP] = useState(0);
  const [lebenshaltungP, setLebenshaltungP] = useState(400);
  const [urlaubPAP, setUrlaubPAP] = useState(2000);

  // --- Immo Rechner States ---
  const [immoRate, setImmoRate] = useState(1500);
  const [immoEk, setImmoEk] = useState(50000);
  const [immoZins, setImmoZins] = useState(3.5);
  const [immoLaufzeit, setImmoLaufzeit] = useState(25);
  const [immoNk, setImmoNk] = useState(10.0);

  // --- Renten Rechner States ---
  const [alterAktuell, setAlterAktuell] = useState(26);
  const [alterRente, setAlterRente] = useState(67);
  const [zielVermoegen, setZielVermoegen] = useState(1000000);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === SECRET_PIN) {
      setIsAuthenticated(true);
    } else {
      alert("Falscher PIN / Passwort!");
      setPinInput("");
    }
  };

  // --- Berechnungen 15 Jahre ---
  const sonderMtl = urlaubPA / 12;
  const ausgabenMtl = fixkosten + lebenshaltung + sonderMtl;
  const sparrateMtl = netto - ausgabenMtl;

  const ausgabenMtlP = fixkostenP + lebenshaltungP + urlaubPAP / 12;
  const gesamtNetto = netto + nettoP;
  const gesamtAusgaben = ausgabenMtl + ausgabenMtlP;
  const sparrateGemeinsam = gesamtNetto - gesamtAusgaben;

  // 15 Jahre Simulation Jonas
  let vermoegenJonas = startkapital;
  let aktNettoS = netto;
  let aktAusgS = ausgabenMtl;
  for (let y = 1; y <= 15; y++) {
    const sRate = Math.max(0, aktNettoS - aktAusgS) * 12;
    vermoegenJonas = (vermoegenJonas + sRate) * (1 + rendite / 100);
    aktNettoS *= 1 + wachstum / 100;
    aktAusgS *= 1 + inflation / 100;
  }

  // 15 Jahre Simulation Gemeinsam
  let vermoegenJoint = startkapital + startkapitalP;
  let n1 = netto,
    n2 = nettoP,
    ausgJ = gesamtAusgaben;
  for (let y = 1; y <= 15; y++) {
    const sRate = Math.max(0, n1 + n2 - ausgJ) * 12;
    vermoegenJoint = (vermoegenJoint + sRate) * (1 + rendite / 100);
    n1 *= 1 + wachstum / 100;
    n2 *= 1 + wachstumP / 100;
    ausgJ *= 1 + inflation / 100;
  }

  // --- Berechnungen Immo ---
  const rMtl = immoZins / 100 / 12;
  const monateImmo = immoLaufzeit * 12;
  const maxDarlehen = immoRate * ((1 - Math.pow(1 + rMtl, -monateImmo)) / rMtl);
  const gesamtBudget = maxDarlehen + immoEk;
  const maxKaufpreis = gesamtBudget / (1 + immoNk / 100);
  const nkAbsolut = maxKaufpreis * (immoNk / 100);
  const belastungsquote = (immoRate / gesamtNetto) * 100;

  // --- Berechnungen Rente ---
  const jahreBisRente = alterRente - alterAktuell;
  const monateRente = jahreBisRente * 12;
  const rMtlRente = rendite / 100 / 12;
  const fvStart = startkapital * Math.pow(1 + rMtlRente, monateRente);
  const benoetigt = zielVermoegen - fvStart;
  const notwendigeSparrate =
    benoetigt > 0 ? (benoetigt * rMtlRente) / (Math.pow(1 + rMtlRente, monateRente) - 1) : 0;
  const monatliche4ProzentEntnahme = (zielVermoegen * 0.04) / 12;

  // 🔒 GESPERRTER ZUSTAND (PIN EINGABE)
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
              placeholder="PIN / Passwort eingeben..."
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

  // 🔓 ENTSPERRTER ZUSTAND (DASHBOARD)
  return (
    <div className="space-y-6">
      {/* Top Header mit Abmelde-Button */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-2xl font-black tracking-tight ${textTitle}`}>
              💼 WealthDashboard Pro
            </h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeGreen} flex items-center gap-1`}
            >
              <ShieldCheck className="h-3 w-3" /> Entsperrt
            </span>
          </div>
          <p className={`text-xs ${textSub}`}>
            Vermögensprognosen, Hausbau-Cockpit & Altersvorsorge
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-Tabs Switcher */}
          <div className="flex rounded-xl bg-black/5 p-1 dark:bg-white/5">
            {[
              { id: "wealth", label: "🏡 15-Jahre Master" },
              { id: "immo", label: "🏰 Immobilien-Rechner" },
              { id: "rente", label: "🏖️ Rente & Zinseszins" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeSubTab === tab.id
                    ? "bg-white text-black shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                    : `${textSub} hover:text-black dark:hover:text-white`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex h-8 items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-bold text-rose-500 hover:bg-rose-500/20"
          >
            <Lock className="h-3.5 w-3.5" /> Sperren
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. 15-JAHRE VERMÖGENS-COCKPIT */}
      {/* ========================================================= */}
      {activeSubTab === "wealth" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Jonas Input */}
            <div className={`${bgCard} space-y-4 rounded-3xl border p-6`}>
              <h3 className={`text-sm font-bold ${textTitle} tracking-wider uppercase`}>
                👤 Deine Parameter
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className={textSub}>Netto (mtl. €)</label>
                  <input
                    type="number"
                    value={netto}
                    onChange={(e) => setNetto(Number(e.target.value))}
                    className={`mt-1 w-full ${bgInput} rounded-xl border p-2 font-bold`}
                  />
                </div>
                <div>
                  <label className={textSub}>Startkapital (€)</label>
                  <input
                    type="number"
                    value={startkapital}
                    onChange={(e) => setStartkapital(Number(e.target.value))}
                    className={`mt-1 w-full ${bgInput} rounded-xl border p-2 font-bold`}
                  />
                </div>
                <div>
                  <label className={textSub}>Fixkosten (mtl. €)</label>
                  <input
                    type="number"
                    value={fixkosten}
                    onChange={(e) => setFixkosten(Number(e.target.value))}
                    className={`mt-1 w-full ${bgInput} rounded-xl border p-2 font-bold`}
                  />
                </div>
                <div>
                  <label className={textSub}>Lebenshaltung (mtl. €)</label>
                  <input
                    type="number"
                    value={lebenshaltung}
                    onChange={(e) => setLebenshaltung(Number(e.target.value))}
                    className={`mt-1 w-full ${bgInput} rounded-xl border p-2 font-bold`}
                  />
                </div>
              </div>
              <div className={`rounded-2xl p-4 ${bgItem} flex items-center justify-between`}>
                <span className={`text-xs font-bold ${textSub}`}>Deine Sparrate heute:</span>
                <span
                  className={`font-mono text-sm font-black ${sparrateMtl >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {sparrateMtl.toFixed(2)} € / Monat
                </span>
              </div>
            </div>

            {/* Lena Input */}
            <div className={`${bgCard} space-y-4 rounded-3xl border p-6`}>
              <h3 className={`text-sm font-bold ${textTitle} tracking-wider uppercase`}>
                👩‍❤️‍👨 Partner:in Parameter
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className={textSub}>Netto Partner:in (mtl. €)</label>
                  <input
                    type="number"
                    value={nettoP}
                    onChange={(e) => setNettoP(Number(e.target.value))}
                    className={`mt-1 w-full ${bgInput} rounded-xl border p-2 font-bold`}
                  />
                </div>
                <div>
                  <label className={textSub}>Startkapital Partner:in (€)</label>
                  <input
                    type="number"
                    value={startkapitalP}
                    onChange={(e) => setStartkapitalP(Number(e.target.value))}
                    className={`mt-1 w-full ${bgInput} rounded-xl border p-2 font-bold`}
                  />
                </div>
                <div>
                  <label className={textSub}>Fixkosten Partner:in (mtl. €)</label>
                  <input
                    type="number"
                    value={fixkostenP}
                    onChange={(e) => setFixkostenP(Number(e.target.value))}
                    className={`mt-1 w-full ${bgInput} rounded-xl border p-2 font-bold`}
                  />
                </div>
                <div>
                  <label className={textSub}>Lebenshaltung Partner:in (mtl. €)</label>
                  <input
                    type="number"
                    value={lebenshaltungP}
                    onChange={(e) => setLebenshaltungP(Number(e.target.value))}
                    className={`mt-1 w-full ${bgInput} rounded-xl border p-2 font-bold`}
                  />
                </div>
              </div>
              <div className={`rounded-2xl p-4 ${bgItem} flex items-center justify-between`}>
                <span className={`text-xs font-bold ${textSub}`}>Gemeinsame Sparrate:</span>
                <span
                  className={`font-mono text-sm font-black ${sparrateGemeinsam >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {sparrateGemeinsam.toFixed(2)} € / Monat
                </span>
              </div>
            </div>
          </div>

          {/* 15-Jahre Prognose Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className={`${bgCard} space-y-2 rounded-3xl border p-6 text-center`}>
              <span className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                Dein Vermögen in 15 Jahren
              </span>
              <div className="font-mono text-3xl font-black text-[#005377] dark:text-[#82CBEE]">
                {vermoegenJonas.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0
                })}
              </div>
              <p className={`text-[11px] ${textSub}`}>
                Basiert auf {rendite}% Rendite & {wachstum}% Gehaltserhöhung p.a.
              </p>
            </div>

            <div className={`${bgCard} space-y-2 rounded-3xl border p-6 text-center`}>
              <span className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                Gemeinsames Vermögen in 15 Jahren
              </span>
              <div className="font-mono text-3xl font-black text-emerald-500">
                {vermoegenJoint.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0
                })}
              </div>
              <p className={`text-[11px] ${textSub}`}>
                Gebündelte Sparpower von beiden Haushaltspartnern
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. IMMOBILIEN-ERSCHWINGLICHKEIT */}
      {/* ========================================================= */}
      {activeSubTab === "immo" && (
        <div className="space-y-6">
          <div className={`${bgCard} space-y-4 rounded-3xl border p-6`}>
            <h3 className={`text-sm font-bold ${textTitle} tracking-wider uppercase`}>
              🏰 Finanzierungs-Parameter
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
              <div>
                <label className={textSub}>Wunschrate (mtl. €)</label>
                <input
                  type="number"
                  value={immoRate}
                  onChange={(e) => setImmoRate(Number(e.target.value))}
                  className={`mt-1 w-full ${bgInput} rounded-xl border p-2 font-bold`}
                />
              </div>
              <div>
                <label className={textSub}>Eigenkapital (€)</label>
                <input
                  type="number"
                  value={immoEk}
                  onChange={(e) => setImmoEk(Number(e.target.value))}
                  className={`mt-1 w-full ${bgInput} rounded-xl border p-2 font-bold`}
                />
              </div>
              <div>
                <label className={textSub}>Bauzins (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={immoZins}
                  onChange={(e) => setImmoZins(Number(e.target.value))}
                  className={`mt-1 w-full ${bgInput} rounded-xl border p-2 font-bold`}
                />
              </div>
              <div>
                <label className={textSub}>Laufzeit (Jahre)</label>
                <input
                  type="number"
                  value={immoLaufzeit}
                  onChange={(e) => setImmoLaufzeit(Number(e.target.value))}
                  className={`mt-1 w-full ${bgInput} rounded-xl border p-2 font-bold`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className={`${bgCard} space-y-1 rounded-3xl border p-5 text-center`}>
              <span className={`text-[10px] font-bold uppercase ${textSub}`}>
                Maximaler Kaufpreis
              </span>
              <div className="font-mono text-2xl font-black text-emerald-500">
                {maxKaufpreis.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0
                })}
              </div>
              <p className={`text-[10px] ${textSub}`}>Für die Immobiliensuche</p>
            </div>
            <div className={`${bgCard} space-y-1 rounded-3xl border p-5 text-center`}>
              <span className={`text-[10px] font-bold uppercase ${textSub}`}>
                Darlehensbetrag (Bank)
              </span>
              <div className="font-mono text-2xl font-black text-[#005377] dark:text-[#82CBEE]">
                {maxDarlehen.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0
                })}
              </div>
              <p className={`text-[10px] ${textSub}`}>Gesamter Kredit</p>
            </div>
            <div className={`${bgCard} space-y-1 rounded-3xl border p-5 text-center`}>
              <span className={`text-[10px] font-bold uppercase ${textSub}`}>
                Kaufnebenkosten ({immoNk}%)
              </span>
              <div className="font-mono text-2xl font-black text-rose-500">
                {nkAbsolut.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0
                })}
              </div>
              <p className={`text-[10px] ${textSub}`}>Notar, Grunderwerbsteuer etc.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. DUALER RENTEN-SIMULATOR */}
      {/* ========================================================= */}
      {activeSubTab === "rente" && (
        <div className="space-y-6">
          <div className={`${bgCard} space-y-4 rounded-3xl border p-6`}>
            <h3 className={`text-sm font-bold ${textTitle} tracking-wider uppercase`}>
              🏖️ Renten-Ziel Parameter
            </h3>
            <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
              <div>
                <label className={textSub}>Aktuelles Alter / Rentenalter</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="number"
                    value={alterAktuell}
                    onChange={(e) => setAlterAktuell(Number(e.target.value))}
                    className={`w-1/2 ${bgInput} rounded-xl border p-2 font-bold`}
                  />
                  <input
                    type="number"
                    value={alterRente}
                    onChange={(e) => setAlterRente(Number(e.target.value))}
                    className={`w-1/2 ${bgInput} rounded-xl border p-2 font-bold`}
                  />
                </div>
              </div>
              <div>
                <label className={textSub}>Ziel-Vermögen (€)</label>
                <input
                  type="number"
                  value={zielVermoegen}
                  onChange={(e) => setZielVermoegen(Number(e.target.value))}
                  className={`mt-1 w-full ${bgInput} rounded-xl border p-2 font-bold`}
                />
              </div>
              <div>
                <label className={textSub}>Rendite-Erwartung (% p.a.)</label>
                <input
                  type="number"
                  step="0.5"
                  value={rendite}
                  onChange={(e) => setRendite(Number(e.target.value))}
                  className={`mt-1 w-full ${bgInput} rounded-xl border p-2 font-bold`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className={`${bgCard} space-y-2 rounded-3xl border p-6`}>
              <span className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                Notwendige monatliche Sparrate
              </span>
              <div className="font-mono text-3xl font-black text-emerald-500">
                {notwendigeSparrate.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 2
                })}{" "}
                / Mo
              </div>
              <p className={`text-xs ${textSub}`}>
                Um mit {alterRente} Jahren exakt {zielVermoegen.toLocaleString("de-DE")} € im Depot
                zu haben.
              </p>
            </div>

            <div className={`${bgCard} space-y-2 rounded-3xl border p-6`}>
              <span className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                Monatliche Zusatzrente (4%-Regel)
              </span>
              <div className="font-mono text-3xl font-black text-[#005377] dark:text-[#82CBEE]">
                {monatliche4ProzentEntnahme.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 2
                })}{" "}
                / Mo
              </div>
              <p className={`text-xs ${textSub}`}>
                Kann lebenslang entnommen werden, ohne den Kapitalstock aufzubrauchen.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
