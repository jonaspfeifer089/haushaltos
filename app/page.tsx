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
    
    // 1. Direkt lokal im Dashboard anzeigen
    setEinkauf([...einkauf, newItem]);
    setNeuerArtikel("");
    
    // 2. In die Google Sheets Datenbank schreiben
    await fetch("/api/data", { 
      method: "POST", 
      body: JSON.stringify({ sheetName: "Einkauf", values: [newItem.artikel, newItem.status] }) 
    });

    // 3. NEU: Push-Nachricht über ntfy senden
    // WICHTIG: Ersetze "DEIN_NTFY_TOPIC_HIER" durch deinen echten Kanalnamen!
    await fetch("https://ntfy.sh/HaushaltLenaJonas", {
      method: "POST",
      body: `🛒 "${newItem.artikel}" wurde zur Einkaufsliste hinzugefügt.`,
      headers: {
        "Title": "Haushalt OS",
        "Tags": "shopping_cart",
        "Priority": "default"
      }
    });

    fetchData(); // Liste nochmal sauber von der Datenbank laden
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
          fetchData(); 
        }
      } catch (err) { console.error(err); }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const offeneEinkaeufe = einkauf.filter(e => e.status !== "Erledigt");

  // Tabs Konfiguration für Sidebar & Bottom-Nav
  const TABS = [
    { id: "home", icon: Home, label: "Overview" },
    { id: "einkauf", icon: ShoppingCart, label: "Einkauf" },
    { id: "putzplan", icon: ClipboardList, label: "Putzplan" },
    { id: "vorrat", icon: Package, label: "Vorrat" },
    { id: "kalender", icon: CalendarIcon, label: "Kalender" }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#07090e] text-slate-100 selection:bg-blue-600 selection:text-white">
      
      {/* DESKTOP SIDEBAR (Versteckt auf Mobile) */}
      <aside className="hidden md:flex w-64 border-r border-slate-800/80 bg-[#0b0f19]/60 backdrop-blur-xl flex-col justify-between p-4 h-full">
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/60">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">🏠</div>
            <div><h1 className="font-semibold text-sm tracking-tight text-white">Haushalt OS</h1><p className="text-xs text-slate-400">Pro Dashboard v2.0</p></div>
          </div>
          <nav className="space-y-1">
            {TABS.map(tab => (
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative">
        <header className="h-14 border-b border-slate-800/60 px-4 md:px-8 flex items-center justify-between bg-[#07090e]/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs text-slate-400"><span>Dashboard</span><span>&gt;</span><span className="text-slate-100 font-medium capitalize">{activeTab}</span></div>
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] md:text-[11px] px-2 py-0.5">Live Synced</Badge>
        </header>

        {/* Padding-Bottom extrem wichtig für Mobile, damit die Navigation den Content nicht überlagert */}
        <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8">
          
          {activeTab === "home" && (
            <>
              <div><h2 className="text-xl md:text-2xl font-bold text-white">Overview <span className="text-blue-500">.</span></h2></div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Card className="bg-[#0e131f]/80 border-slate-800/80 p-4"><div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-400">Wetter</span><CloudSun className="h-4 w-4 text-blue-400" /></div><div className="text-xl md:text-2xl font-bold text-white">{weather}</div></Card>
                <Card className="bg-[#0e131f]/80 border-slate-800/80 p-4"><div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-400">To-Dos</span><CheckCircle2 className="h-4 w-4 text-amber-400" /></div><div className="text-xl md:text-2xl font-bold text-white">{aufgaben.length}</div></Card>
                <Card className="bg-[#0e131f]/80 border-slate-800/80 p-4"><div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-400">Einkauf</span><ShoppingCart className="h-4 w-4 text-emerald-400" /></div><div className="text-xl md:text-2xl font-bold text-white">{offeneEinkaeufe.length}</div></Card>
                <Card className="bg-[#0e131f]/80 border-slate-800/80 p-4"><div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-400">Kalender</span><CalendarIcon className="h-4 w-4 text-blue-400" /></div><div className="text-xl md:text-2xl font-bold text-white">{termine.length}</div></Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader className="py-4 md:py-6"><CardTitle className="text-sm font-semibold text-white flex items-center gap-2"><Train className="h-4 w-4 text-blue-400" /> ÖPNV (OEZ)</CardTitle></CardHeader><CardContent className="pb-4 md:pb-6"><div className="space-y-3">{departures.map((d, i) => <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-800/50"><span className="font-bold text-blue-400">{d.line} {d.destination}</span><span className="font-mono text-slate-400">{d.time}</span></div>)}</div></CardContent></Card>
                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader className="py-4 md:py-6"><CardTitle className="text-sm font-semibold text-white">Anstehende Termine</CardTitle></CardHeader><CardContent className="pb-4 md:pb-6"><div className="space-y-3">{termine.slice(0,4).map((t, i) => <div key={i} className="flex flex-col md:flex-row justify-between text-xs py-1 border-b border-slate-800/50 gap-1 md:gap-0"><span className="text-slate-200 line-clamp-1">{t.title}</span><span className="font-mono text-blue-400">{t.date}</span></div>)}</div></CardContent></Card>
              </div>
            </>
          )}

          {activeTab === "einkauf" && (
            <div className="space-y-4 md:space-y-6">
              <div><h2 className="text-xl md:text-2xl font-bold text-white">Einkaufsliste <span className="text-blue-500">.</span></h2></div>
              <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                  {/* Textgröße 16px auf Mobile verhindert Auto-Zoom vom iPhone */}
                  <input type="text" placeholder="Neuer Artikel..." value={neuerArtikel} onChange={(e) => setNeuerArtikel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addEinkauf()} className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 md:py-2 text-[16px] md:text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                  <Button onClick={addEinkauf} className="w-full md:w-auto h-12 md:h-10 bg-blue-600 hover:bg-blue-500 font-medium"><Plus className="h-5 w-5 md:h-4 md:w-4 mr-2 md:mr-1" /> Hinzufügen</Button>
                </div>
                <div className="space-y-2">
                  {offeneEinkaeufe.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
                      <span className="text-sm md:text-xs text-slate-200 font-medium truncate pr-2">🛒 {item.artikel}</span>
                      <Button onClick={() => markEinkaufErledigt(item)} variant="outline" size="sm" className="h-8 md:h-7 text-xs md:text-[11px] border-slate-700 hover:bg-emerald-500/10 hover:text-emerald-400 flex-shrink-0"><Check className="h-4 w-4 md:h-3 md:w-3 md:mr-1" /> <span className="hidden md:inline">Erledigt</span></Button>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            </div>
          )}

          {activeTab === "putzplan" && (
            <div className="space-y-4 md:space-y-6">
              <div><h2 className="text-xl md:text-2xl font-bold text-white">Putzplan <span className="text-blue-500">.</span></h2></div>
              <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardContent className="p-4 md:p-6 space-y-2">
                {aufgaben.map((a, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-slate-900/40 border border-slate-800/60 gap-3 sm:gap-0">
                    <div>
                      <span className="font-medium text-sm md:text-xs text-slate-200">🧹 {a.aufgabe}</span>
                      <span className="text-slate-400 block text-xs md:text-[11px] mt-1">Intervall: {a.intervall} Tage | Letztes Mal: {a.letztesDatum}</span>
                    </div>
                    <Button onClick={() => markAufgabeErledigt(a)} variant="outline" size="sm" className="w-full sm:w-auto h-9 md:h-7 text-xs md:text-[11px] border-slate-700 hover:bg-emerald-500/10 hover:text-emerald-400"><Check className="h-4 w-4 md:h-3 md:w-3 mr-2 md:mr-1" /> Erledigt</Button>
                  </div>
                ))}
              </CardContent></Card>
            </div>
          )}

          {activeTab === "vorrat" && (
            <div className="space-y-4 md:space-y-6">
              <div><h2 className="text-xl md:text-2xl font-bold text-white">Vorratskammer <span className="text-blue-500">.</span></h2></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* KI Scanner auf Mobile ganz oben, da wichtigste Funktion */}
                <Card className="bg-[#0e131f]/80 border-slate-800/80 order-first lg:order-last"><CardHeader className="py-4 md:py-6"><CardTitle className="text-sm font-semibold text-white flex items-center gap-2"><Camera className="h-4 w-4 text-blue-400" /> KI MHD-Scanner</CardTitle></CardHeader>
                  <CardContent className="pb-4 md:pb-6">
                    <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 md:p-8 text-center bg-slate-900/30 flex flex-col items-center justify-center min-h-[160px]">
                      {isScanning ? (
                        <div className="flex flex-col items-center gap-3"><Loader2 className="h-8 w-8 text-blue-500 animate-spin" /><p className="text-xs text-slate-300">Analysiere Produkt...</p></div>
                      ) : (
                        <>
                          <UploadCloud className="h-8 w-8 text-slate-500 mb-2" />
                          <p className="text-xs text-slate-300 font-medium mb-4">MHD bequem per Kamera scannen</p>
                          <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                          <Button onClick={() => fileInputRef.current?.click()} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500">Kamera öffnen</Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardHeader className="py-4 md:py-6"><CardTitle className="text-sm font-semibold text-white">📦 Aktueller Vorrat</CardTitle></CardHeader>
                  <CardContent className="pb-4 md:pb-6 space-y-2">
                    {vorrat.map((v, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800/60 gap-1 sm:gap-0">
                        <span className="font-medium text-sm md:text-xs text-slate-200">🥫 {v.artikel}</span><span className="text-xs text-slate-400">MHD: {v.ablaufdatum}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "kalender" && (
            <div className="space-y-4 md:space-y-6">
              <div><h2 className="text-xl md:text-2xl font-bold text-white">Kalender <span className="text-blue-500">.</span></h2></div>
              <Card className="bg-[#0e131f]/80 border-slate-800/80"><CardContent className="p-4 md:p-6 space-y-3">
                {termine.length === 0 ? <p className="text-sm md:text-xs text-slate-400 text-center py-4">Keine Termine gefunden.</p> : termine.map((t, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800/60 gap-1 sm:gap-0">
                    <span className="font-medium text-sm md:text-xs text-slate-200">📅 {t.title}</span><span className="text-xs text-blue-400 font-mono">{t.date}</span>
                  </div>
                ))}
              </CardContent></Card>
            </div>
          )}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION (Sichtbar auf Handys) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0b0f19]/95 backdrop-blur-xl border-t border-slate-800/80 flex justify-around items-center px-2 py-3 pb-safe">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`flex flex-col items-center justify-center w-16 gap-1 transition-all ${isActive ? "text-blue-500 scale-110" : "text-slate-500 hover:text-slate-300"}`}
            >
              <tab.icon className={`h-6 w-6 ${isActive ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : ""}`} />
              <span className="text-[9px] font-medium tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}