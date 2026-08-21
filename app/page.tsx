"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  Home, ShoppingCart, Package, Calendar as CalendarIcon, LogOut, CloudSun, CheckCircle2, Clock, AlertTriangle, TrendingUp, Train, Plus, Check, ClipboardList, Camera, UploadCloud, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Departure { line: string; destination: string; time: string; }
interface EinkaufItem { rowIndex: number; artikel: string; status: string; }
interface PutzItem { rowIndex: number; aufgabe: string; letztesDatum: string; intervall: string; }
interface VorratItem { rowIndex: number; artikel: string; ablaufdatum: string; anbruch: string; }

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [weather, setWeather] = useState<string>("Lädt...");
  const [termine, setTermine] = useState<{ title: string; date: string }[]>([]);
  
  const [einkauf, setEinkauf] = useState<EinkaufItem[]>([]);
  const [neuerArtikel, setNeuerArtikel] = useState("");

  const [aufgaben, setAufgaben] = useState<PutzItem[]>([]);
  const [vorrat, setVorrat] = useState<VorratItem[]>([]);
  
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/data");
      const data = await res.json();
      
      if (data.einkauf) setEinkauf(data.einkauf.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, artikel: r[0], status: r[1] || "Offen" })).filter((x: any) => x.artikel));
      if (data.haushalt) setAufgaben(data.haushalt.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, aufgabe: r[0], letztesDatum: r[1], intervall: r[2] })).filter((x: any) => x.aufgabe));
      if (data.vorrat) setVorrat(data.vorrat.slice(1).map((r: any, i: number) => ({ rowIndex: i + 2, artikel: r[0], ablaufdatum: r[1], anbruch: r[2] || "" })).filter((x: any) => x.artikel));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
    fetch("/api/calendar").then(res => res.json()).then(data => setTermine(data.events || []));
    fetch("https://api.open-meteo.com/v1/forecast?latitude=48.1764&longitude=11.5311&current=temperature_2m,weather_code")
      .then(res => res.json()).then(data => setWeather(`${data?.current?.temperature_2m ?? "--"}°C`));
    fetch("https://www.mvg.de/api/bgw-pt/v3/departures?globalId=de:09162:70")
      .then(res => res.json()).then(data => {
        if (Array.isArray(data)) setDepartures(data.slice(0, 5).map((d: any) => ({
          line: d.label || "U", destination: d.destination || "Unbekannt", time: new Date(d.realtimeDepartureTime || d.plannedDepartureTime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
        })));
      });
  }, []);

  const addEinkauf = async () => {
    if (!neuerArtikel) return;
    const newItem = { rowIndex: einkauf.length + 2, artikel: neuerArtikel, status: "Offen" };
    setEinkauf([...einkauf, newItem]);
    setNeuerArtikel("");
    await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Einkauf", values: [newItem.artikel, newItem.status] }) });
    fetchData(); // Refresh DB
  };

  const markEinkaufErledigt = async (item: EinkaufItem) => {
    setEinkauf(einkauf.map(e => e.rowIndex === item.rowIndex ? { ...e, status: "Erledigt" } : e));
    await fetch("/api/data", { method: "PUT", body: JSON.stringify({ sheetName: "Einkauf", rowIndex: item.rowIndex, values: [item.artikel, "Erledigt"] }) });
  };

  const markAufgabeErledigt = async (item: PutzItem) => {
    const today = new Date().toISOString().split("T")[0];
    setAufgaben(aufgaben.map(a => a.rowIndex === item.rowIndex ? { ...a, letztesDatum: today } : a));
    await fetch("/api/data", { method: "PUT", body: JSON.stringify({ sheetName: "Haushalt", rowIndex: item.rowIndex, values: [item.aufgabe, today, item.intervall, "Jonas"] }) });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const res = await fetch("/api/vision", { method: "POST", body: JSON.stringify({ imageBase64: base64 }) });
        const aiData = await res.json();
        if (aiData.artikel && aiData.mhd) {
          await fetch("/api/data", { method: "POST", body: JSON.stringify({ sheetName: "Vorrat", values: [aiData.artikel, aiData.mhd, ""] }) });
          fetchData(); // Liste aktualisieren
        }
      } catch (err) { console.error(err); }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const offeneEinkaeufe = einkauf.filter(e => e.status !== "Erledigt");

  return (
    <div className="flex min-h-screen bg-[#07090e] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0b0f19]/60 backdrop-blur-xl flex flex-col justify-between p-4 sticky top-0 h-screen">
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/60">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">🏠</div>
            <div><h1 className="font-semibold text-sm tracking-tight text-white">Haushalt OS</h1><p className="text-xs text-slate-400">Pro Dashboard v2.0</p></div>
          </div>
          <nav className="space-y-1">
            {[{id: "home", icon: Home, label: "Overview"}, {id: "einkauf", icon: ShoppingCart, label: "Einkaufsliste"}, {id: "putzplan", icon: ClipboardList, label: "Putzplan & Aufgaben"}, {id: "vorrat", icon: Package, label: "Vorratskammer (KI)"}, {id: "kalender", icon: CalendarIcon, label: "Termine"}].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? "bg-blue-600/15 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"}`}>
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between px-2">
          <div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">J</div><span className="text-xs text-slate-300 font-medium">Jonas</span></div>
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
          {activeTab === "home" && (
            <>
              <div><h2 className="text-2xl font-bold text-white">Overview <span className="text-blue-500">.</span></h2><p className="text-xs text-slate-400 mt-1">Dein Cockpit.</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-medium text-slate-400">Wetter OEZ</CardTitle><CloudSun className="h-4 w-4 text-blue-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{weather}</div></CardContent></Card>
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-medium text-slate-400">Offene Aufgaben</CardTitle><CheckCircle2 className="h-4 w-4 text-amber-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{aufgaben.length}</div></CardContent></Card>
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-medium text-slate-400">Einkaufsliste</CardTitle><ShoppingCart className="h-4 w-4 text-emerald-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{offeneEinkaeufe.length}</div></CardContent></Card>
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-medium text-slate-400">Kalender</CardTitle><CalendarIcon className="h-4 w-4 text-blue-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{termine.length}</div></CardContent></Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader><CardTitle className="text-sm font-semibold text-white flex items-center gap-2"><Train className="h-4 w-4 text-blue-400" /> ÖPNV (OEZ)</CardTitle></CardHeader><CardContent><div className="space-y-2.5">{departures.map((d, i) => <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-800/50"><span className="font-bold text-blue-400">{d.line} {d.destination}</span><span className="font-mono text-slate-400">{d.time}</span></div>)}</div></CardContent></Card>
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader><CardTitle className="text-sm font-semibold text-white">Anstehende Termine</CardTitle></CardHeader><CardContent><div className="space-y-2.5">{termine.slice(0,3).map((t, i) => <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-800/50"><span className="text-slate-200">{t.title}</span><span className="font-mono text-blue-400">{t.date}</span></div>)}</div></CardContent></Card>
              </div>
            </>
          )}

          {activeTab === "einkauf" && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-bold text-white">Einkaufsliste <span className="text-blue-500">.</span></h2></div>
              <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardContent className="pt-6">
                <div className="flex gap-3 mb-6">
                  <input type="text" placeholder="Neuer Artikel..." value={neuerArtikel} onChange={(e) => setNeuerArtikel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addEinkauf()} className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500" />
                  <Button onClick={addEinkauf} className="bg-blue-600 hover:bg-blue-500 text-xs"><Plus className="h-4 w-4 mr-1" /> Hinzufügen</Button>
                </div>
                <div className="space-y-2">
                  {offeneEinkaeufe.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
                      <span className="text-xs text-slate-200 font-medium">🛒 {item.artikel}</span>
                      <Button onClick={() => markEinkaufErledigt(item)} variant="outline" size="sm" className="h-7 text-[11px] border-slate-700 hover:bg-emerald-500/10 hover:text-emerald-400"><Check className="h-3 w-3 mr-1" /> Erledigt</Button>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            </div>
          )}

          {activeTab === "putzplan" && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-bold text-white">Putzplan <span className="text-blue-500">.</span></h2></div>
              <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardContent className="pt-6 space-y-2">
                {aufgaben.map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800/60 text-xs">
                    <div><span className="font-medium text-slate-200">🧹 {a.aufgabe}</span><span className="text-slate-400 block text-[11px]">Intervall: {a.intervall} Tage | Letztes Mal: {a.letztesDatum}</span></div>
                    <Button onClick={() => markAufgabeErledigt(a)} variant="outline" size="sm" className="h-7 text-[11px] border-slate-700 hover:bg-emerald-500/10 hover:text-emerald-400"><Check className="h-3 w-3 mr-1" /> Heute erledigt</Button>
                  </div>
                ))}
              </CardContent></Card>
            </div>
          )}

          {activeTab === "vorrat" && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-bold text-white">Vorratskammer & KI <span className="text-blue-500">.</span></h2></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader><CardTitle className="text-sm font-semibold text-white">📦 Aktueller Vorrat</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {vorrat.map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800/60 text-xs">
                        <span className="font-medium text-slate-200">🥫 {v.artikel}</span><span className="text-slate-400">MHD: {v.ablaufdatum}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader><CardTitle className="text-sm font-semibold text-white flex items-center gap-2"><Camera className="h-4 w-4 text-blue-400" /> KI MHD-Scanner</CardTitle></CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center bg-slate-900/30 flex flex-col items-center justify-center">
                      {isScanning ? (
                        <div className="flex flex-col items-center gap-3"><Loader2 className="h-8 w-8 text-blue-500 animate-spin" /><p className="text-xs text-slate-300">Gemini analysiert Produkt & MHD...</p></div>
                      ) : (
                        <>
                          <UploadCloud className="h-8 w-8 text-slate-500 mb-2" />
                          <p className="text-xs text-slate-300 font-medium mb-4">Foto aufnehmen oder hochladen</p>
                          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                          <Button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-500 text-xs">Produkt scannen</Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "kalender" && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-bold text-white">Kalender <span className="text-blue-500">.</span></h2></div>
              <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardContent className="pt-6 space-y-3">
                {termine.length === 0 ? <p className="text-xs text-slate-400 text-center">Keine Termine gefunden.</p> : termine.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800/60 text-xs">
                    <span className="font-medium text-slate-200">📅 {t.title}</span><span className="text-blue-400 font-mono">{t.date}</span>
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