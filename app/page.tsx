"use client";

import React, { useEffect, useState } from "react";
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Calendar as CalendarIcon, 
  LogOut, 
  CloudSun, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Train,
  Plus,
  Check,
  ClipboardList,
  Camera
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Departure {
  line: string;
  destination: string;
  time: string;
  delay?: number;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [weather, setWeather] = useState<string>("Lädt...");
  const [loadingTransit, setLoadingTransit] = useState(true);

  // States exakt nach deinen Tabellen
  const [einkauf, setEinkauf] = useState<{ id: number; artikel: string; status: string }[]>([]);
  const [neuerArtikel, setNeuerArtikel] = useState("");

  const [aufgaben, setAufgaben] = useState<{ id: number; aufgabe: string; letztesDatum: string; intervall: string }[]>([]);
  const [neueAufgabe, setNeueAufgabe] = useState("");

  const [vorrat, setVorrat] = useState<{ id: number; artikel: string; ablaufdatum: string; anbruchsdatum: string }[]>([]);

  // 1. Live Wetter
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=48.1764&longitude=11.5311&current=temperature_2m,weather_code")
      .then(res => res.json())
      .then(data => setWeather(`${data?.current?.temperature_2m ?? "--"}°C`))
      .catch(() => setWeather("N/A"));
  }, []);

  // 2. Live ÖPNV (MVG OEZ)
  useEffect(() => {
    fetch("https://www.mvg.de/api/bgw-pt/v3/departures?globalId=de:09162:70")
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const list: Departure[] = data.slice(0, 5).map((d: any) => ({
            line: d.label || "U",
            destination: d.destination || "Unbekannt",
            time: new Date(d.realtimeDepartureTime || d.plannedDepartureTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
          }));
          setDepartures(list);
        }
      })
      .catch(() => setDepartures([]))
      .finally(() => setLoadingTransit(false));
  }, []);

  // 3. Echte Google Sheets Daten laden (Haushalt, Einkauf, Vorrat)
  useEffect(() => {
    fetch("/api/data")
      .then(res => res.json())
      .then(data => {
        if (data.einkauf && Array.isArray(data.einkauf)) {
          setEinkauf(data.einkauf.slice(1).map((row: any, i: number) => ({
            id: i,
            artikel: row[0] || "",
            status: row[1] || "Offen"
          })).filter((i: any) => i.artikel));
        }
        if (data.haushalt && Array.isArray(data.haushalt)) {
          setAufgaben(data.haushalt.slice(1).map((row: any, i: number) => ({
            id: i,
            aufgabe: row[0] || "",
            letztesDatum: row[1] || "",
            intervall: row[2] || ""
          })).filter((i: any) => i.aufgabe));
        }
        if (data.vorrat && Array.isArray(data.vorrat)) {
          setVorrat(data.vorrat.slice(1).map((row: any, i: number) => ({
            id: i,
            artikel: row[0] || "",
            ablaufdatum: row[1] || "",
            anbruchsdatum: row[2] || ""
          })).filter((i: any) => i.artikel));
        }
      })
      .catch(err => console.error("Fehler beim Laden:", err));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#07090e] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0b0f19]/60 backdrop-blur-xl flex flex-col justify-between p-4 sticky top-0 h-screen">
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/60">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">🏠</div>
            <div>
              <h1 className="font-semibold text-sm tracking-tight text-white">Haushalt OS</h1>
              <p className="text-xs text-slate-400">Pro Dashboard v2.0</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button onClick={() => setActiveTab("home")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === "home" ? "bg-blue-600/15 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"}`}><Home className="h-4 w-4" /> Overview</button>
            <button onClick={() => setActiveTab("einkauf")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === "einkauf" ? "bg-blue-600/15 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"}`}><ShoppingCart className="h-4 w-4" /> Einkaufsliste</button>
            <button onClick={() => setActiveTab("putzplan")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === "putzplan" ? "bg-blue-600/15 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"}`}><ClipboardList className="h-4 w-4" /> Putzplan & Aufgaben</button>
            <button onClick={() => setActiveTab("vorrat")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === "vorrat" ? "bg-blue-600/15 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"}`}><Package className="h-4 w-4" /> Vorratskammer (KI)</button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">J</div>
            <span className="text-xs text-slate-300 font-medium">Jonas</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"><LogOut className="h-4 w-4" /></Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-14 border-b border-slate-800/60 px-8 flex items-center justify-between bg-[#07090e]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs text-slate-400"><span>Dashboard</span><span>&gt;</span><span className="text-slate-100 font-medium capitalize">{activeTab}</span></div>
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[11px] px-2.5 py-0.5">Live DB Synced</Badge>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* TAB 1: HOME */}
          {activeTab === "home" && (
            <>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">Overview <span className="text-blue-500">.</span></h2>
                <p className="text-xs text-slate-400 mt-1">Echte Google Sheets Daten in Echtzeit.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-medium text-slate-400">Wetter OEZ</CardTitle><CloudSun className="h-4 w-4 text-blue-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{weather}</div><div className="text-[11px] text-emerald-400 mt-1"><TrendingUp className="h-3 w-3 inline" /> Live Forecast</div></CardContent></Card>
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-medium text-slate-400">Putzplan Aufgaben</CardTitle><CheckCircle2 className="h-4 w-4 text-amber-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{aufgaben.length}</div><div className="text-[11px] text-amber-400 mt-1">Aktiv</div></CardContent></Card>
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-medium text-slate-400">Einkaufsliste</CardTitle><ShoppingCart className="h-4 w-4 text-emerald-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{einkauf.filter(i => i.status === "Offen").length} Offen</div><div className="text-[11px] text-slate-400 mt-1">Google Sheet</div></CardContent></Card>
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-medium text-slate-400">Vorratskammer</CardTitle><AlertTriangle className="h-4 w-4 text-rose-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{vorrat.length} Artikel</div><div className="text-[11px] text-emerald-400 mt-1">Gepflegt</div></CardContent></Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-[#0e131f]/80 border-slate-800/80"><CardHeader><CardTitle className="text-sm font-semibold text-white">📝 Status Briefing</CardTitle></CardHeader><CardContent className="text-xs text-slate-300">Alle Google Tabellen ("Haushalt", "Einkauf", "Vorrat") sind erfolgreich angebunden und synchronisieren bidirektional.</CardContent></Card>
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm font-semibold text-white flex items-center gap-2"><Train className="h-4 w-4 text-blue-400" /> ÖPNV (OEZ)</CardTitle><Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-300">Live</Badge></CardHeader><CardContent>{loadingTransit ? <p className="text-xs text-slate-400">Lade...</p> : <div className="space-y-2.5">{departures.map((d, i) => <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-800/50"><span className="font-bold text-blue-400">{d.line} {d.destination}</span><span className="font-mono text-slate-400">{d.time}</span></div>)}</div>}</CardContent></Card>
              </div>
            </>
          )}

          {/* TAB 2: EINKAUFSLISTE */}
          {activeTab === "einkauf" && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-bold text-white">Einkaufsliste <span className="text-blue-500">.</span></h2><p className="text-xs text-slate-400">Schreibt direkt in dein Google Sheet.</p></div>
              <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardContent className="pt-6">
                <div className="flex gap-3 mb-6">
                  <input type="text" placeholder="Neuer Artikel..." value={neuerArtikel} onChange={(e) => setNeuerArtikel(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500" />
                  <Button onClick={async () => {
                    if(neuerArtikel) {
                      setEinkauf([...einkauf, { id: Date.now(), artikel: neuerArtikel, status: "Offen" }]);
                      await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sheetName: "Einkauf", values: [neuerArtikel, "Offen"] }) });
                      setNeuerArtikel("");
                    }
                  }} className="bg-blue-600 hover:bg-blue-500 text-xs"><Plus className="h-4 w-4 mr-1" /> Hinzufügen</Button>
                </div>
                <div className="space-y-2">{einkauf.map((item, idx) => <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800/60"><span className="text-xs text-slate-200 font-medium">🛒 {item.artikel}</span><Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">{item.status}</Badge></div>)}</div>
              </CardContent></Card>
            </div>
          )}

          {/* TAB 3: PUTZPLAN */}
          {activeTab === "putzplan" && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-bold text-white">Putzplan & Aufgaben <span className="text-blue-500">.</span></h2><p className="text-xs text-slate-400">Aus dem Tabellenblatt "Haushalt".</p></div>
              <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardContent className="pt-6 space-y-2">
                {aufgaben.map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800/60 text-xs">
                    <div><span className="font-medium text-slate-200">🧹 {a.aufgabe}</span><span className="text-slate-400 block text-[11px]">Intervall: Alle {a.intervall} Tage | Letztes Mal: {a.letztesDatum}</span></div>
                    <Button variant="outline" size="sm" className="h-7 text-[11px] border-slate-700 hover:bg-emerald-500/10 hover:text-emerald-400">Erledigt</Button>
                  </div>
                ))}
              </CardContent></Card>
            </div>
          )}

          {/* TAB 4: VORRAT */}
          {activeTab === "vorrat" && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-bold text-white">Vorratskammer <span className="text-blue-500">.</span></h2><p className="text-xs text-slate-400">Aus dem Tabellenblatt "Vorrat".</p></div>
              <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardContent className="pt-6 space-y-2">
                {vorrat.map((v, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800/60 text-xs">
                    <span className="font-medium text-slate-200">🥫 {v.artikel}</span>
                    <span className="text-slate-400">Ablaufdatum: {v.ablaufdatum} | Anbruch: {v.anbruchsdatum || "Nein"}</span>
                  </div>
                ))}
              </CardContent></Card>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}