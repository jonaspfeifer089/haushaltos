"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  Home, ShoppingCart, Package, Calendar as CalendarIcon, LogOut, CloudSun, CheckCircle2, AlertTriangle, Train, Plus, Check, ClipboardList, Camera, UploadCloud, Loader2, Search, Bell, Settings
} from "lucide-react";

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

  // Aktuelles Datum für die Top-Bar formatieren
  const todayStr = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());

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
    
    // Push-Nachricht über ntfy senden
    await fetch("https://ntfy.sh/HaushaltLenaJonas", {
      method: "POST",
      body: `🛒 "${newItem.artikel}" wurde zur Einkaufsliste hinzugefügt.`,
      headers: { "Title": "Haushalt OS", "Tags": "shopping_cart", "Priority": "default" }
    });
    
    fetchData(); 
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

  const TABS = [
    { id: "home", icon: Home, label: "Home" },
    { id: "einkauf", icon: ShoppingCart, label: "Einkauf" },
    { id: "putzplan", icon: ClipboardList, label: "Putzplan" },
    { id: "vorrat", icon: Package, label: "Vorrat" },
    { id: "kalender", icon: CalendarIcon, label: "Kalender" }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#05070A] text-slate-300 font-sans selection:bg-blue-600/30 selection:text-white">
      
      {/* SIDEBAR (Sitemark Style) */}
      <aside className="hidden md:flex w-64 bg-[#05070A] border-r border-[#1e293b] flex-col justify-between p-4 h-full">
        <div>
          {/* Logo Area */}
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <span className="font-semibold text-sm tracking-wide text-slate-100">Haushalt OS</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <div className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">Dashboard</div>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${isActive ? "bg-[#1A2332] text-blue-400 border border-[#2A3649] shadow-[0_0_10px_rgba(59,130,246,0.05)]" : "text-slate-400 hover:text-slate-200 hover:bg-[#0C1017]"}`}>
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* User Footer */}
        <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[#1e293b] flex items-center justify-center text-xs font-semibold text-slate-300">JP</div>
            <span className="text-xs text-slate-300 font-medium">Jonas Pfeifer</span>
          </div>
          <button className="text-slate-500 hover:text-slate-300"><Settings className="h-4 w-4" /></button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative bg-[#05070A]">
        
        {/* TOP HEADER (Sitemark Style) */}
        <header className="h-16 border-b border-[#1e293b] px-6 md:px-8 flex items-center justify-between sticky top-0 z-10 bg-[#05070A]/80 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium tracking-wide">
            <span>Dashboard</span>
            <span className="text-slate-600">&gt;</span>
            <span className="text-slate-100 capitalize">{activeTab}</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Fake Search Bar */}
            <div className="hidden md:flex items-center gap-2 bg-[#0C1017] border border-[#1e293b] rounded-md px-3 py-1.5 text-xs text-slate-500 w-48">
              <Search className="h-3 w-3" /> Search...
            </div>
            
            {/* Date & Icons */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#0C1017] border border-[#1e293b] rounded-md px-3 py-1.5 text-xs text-slate-300">
                <CalendarIcon className="h-3 w-3 text-slate-400" /> {todayStr}
              </div>
              <button className="h-7 w-7 flex items-center justify-center rounded-md bg-[#0C1017] border border-[#1e293b] text-slate-400 hover:text-slate-200">
                <Bell className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT PADDING */}
        <div className="p-4 md:p-8 pb-24 md:pb-12 max-w-[1400px] mx-auto w-full space-y-6 md:space-y-8">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "home" && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Overview</h2>
              </div>
              
              {/* ANALYTICS CARDS (Sitemark Look) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1 */}
                <div className="bg-[#0C1017] border border-[#1e293b] rounded-xl p-5 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-medium text-slate-400">Wetter OEZ</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">{weather}</div>
                  <div className="text-[10px] text-slate-500 mt-2">Aktuelle Temperatur</div>
                </div>

                {/* Card 2 */}
                <div className="bg-[#0C1017] border border-[#1e293b] rounded-xl p-5 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-medium text-slate-400">To-Dos</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">Aktiv</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">{aufgaben.length}</div>
                  <div className="text-[10px] text-slate-500 mt-2">Offene Hausarbeiten</div>
                </div>

                {/* Card 3 */}
                <div className="bg-[#0C1017] border border-[#1e293b] rounded-xl p-5 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-medium text-slate-400">Einkaufsliste</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sync</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">{offeneEinkaeufe.length}</div>
                  <div className="text-[10px] text-slate-500 mt-2">Artikel fehlen</div>
                </div>

                {/* Card 4 (Highlight Card) */}
                <div className="bg-gradient-to-br from-[#121B2A] to-[#0C1017] border border-[#2A3649] rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><CalendarIcon className="h-16 w-16 text-blue-500" /></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <span className="text-xs font-medium text-blue-300">Termine & Events</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white tracking-tight relative z-10">{termine.length}</div>
                  <div className="text-[10px] text-blue-400/70 mt-2 relative z-10">iCloud synchronisiert</div>
                  <button onClick={() => setActiveTab("kalender")} className="mt-4 text-[10px] bg-white text-black px-3 py-1.5 rounded font-medium hover:bg-slate-200 transition-colors relative z-10">
                    Details ansehen &gt;
                  </button>
                </div>
              </div>

              {/* LIST PANELS (Sitemark Look) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
                
                {/* Panel 1: ÖPNV */}
                <div className="bg-[#0C1017] border border-[#1e293b] rounded-xl flex flex-col h-[300px]">
                  <div className="p-5 border-b border-[#1e293b] flex justify-between items-center">
                    <h3 className="text-xs font-semibold text-slate-200">Abfahrten OEZ</h3>
                    <span className="text-[10px] text-slate-500">Live MVG</span>
                  </div>
                  <div className="p-5 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                      {departures.map((d, i) => (
                        <div key={i} className="flex justify-between items-center group">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{d.line}</span>
                            <span className="text-xs text-slate-300">{d.destination}</span>
                          </div>
                          <span className="text-xs font-mono text-slate-500">{d.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Panel 2: Termine */}
                <div className="bg-[#0C1017] border border-[#1e293b] rounded-xl flex flex-col h-[300px]">
                  <div className="p-5 border-b border-[#1e293b] flex justify-between items-center">
                    <h3 className="text-xs font-semibold text-slate-200">Nächste Termine</h3>
                    <span className="text-[10px] text-slate-500">iCloud</span>
                  </div>
                  <div className="p-5 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                      {termine.slice(0,5).map((t, i) => (
                        <div key={i} className="flex justify-between items-center group">
                          <span className="text-xs text-slate-300 truncate pr-4">{t.title}</span>
                          <span className="text-[10px] font-mono text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-800/30 whitespace-nowrap">{t.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* TAB 2: EINKAUFSLISTE */}
          {activeTab === "einkauf" && (
            <div className="space-y-6">
              <div><h2 className="text-lg font-semibold text-slate-100">Einkaufsliste</h2></div>
              <div className="bg-[#0C1017] border border-[#1e293b] rounded-xl p-5 md:p-6">
                
                <div className="flex flex-col md:flex-row gap-3 mb-8 pb-6 border-b border-[#1e293b]">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Plus className="h-4 w-4 text-slate-500" />
                    </div>
                    <input type="text" placeholder="Neuer Artikel (z.B. Milch)..." value={neuerArtikel} onChange={(e) => setNeuerArtikel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addEinkauf()} className="w-full bg-[#05070A] border border-[#1e293b] rounded-md pl-10 pr-4 py-2.5 text-[16px] md:text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                  </div>
                  <button onClick={addEinkauf} className="w-full md:w-auto h-11 md:h-auto px-6 bg-slate-100 hover:bg-white text-slate-900 text-sm font-semibold rounded-md transition-colors">
                    Hinzufügen
                  </button>
                </div>

                <div className="space-y-1">
                  {offeneEinkaeufe.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-md hover:bg-[#05070A] transition-colors group border border-transparent hover:border-[#1e293b]">
                      <span className="text-sm text-slate-300">{item.artikel}</span>
                      <button onClick={() => markEinkaufErledigt(item)} className="h-7 px-3 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <Check className="h-3 w-3" /> <span className="hidden md:inline">Erledigt</span>
                      </button>
                    </div>
                  ))}
                  {offeneEinkaeufe.length === 0 && <p className="text-sm text-slate-500 text-center py-8">Alles eingekauft!</p>}
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: PUTZPLAN */}
          {activeTab === "putzplan" && (
            <div className="space-y-6">
              <div><h2 className="text-lg font-semibold text-slate-100">Putzplan</h2></div>
              <div className="bg-[#0C1017] border border-[#1e293b] rounded-xl p-5 md:p-6">
                <div className="space-y-1">
                  {aufgaben.map((a, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-md border border-[#1e293b] bg-[#05070A] mb-3 gap-4 sm:gap-0">
                      <div>
                        <div className="font-medium text-sm text-slate-200 mb-1">{a.aufgabe}</div>
                        <div className="flex gap-3 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Intervall: {a.intervall} Tage</span>
                          <span>Letztes Mal: <span className="text-slate-400">{a.letztesDatum}</span></span>
                        </div>
                      </div>
                      <button onClick={() => markAufgabeErledigt(a)} className="w-full sm:w-auto h-8 px-4 text-xs font-medium rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors">
                        Heute erledigt
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VORRAT */}
          {activeTab === "vorrat" && (
            <div className="space-y-6">
              <div><h2 className="text-lg font-semibold text-slate-100">Vorratskammer & KI</h2></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                
                {/* KI Scanner Panel */}
                <div className="lg:col-span-1 bg-[#0C1017] border border-[#1e293b] rounded-xl p-6 flex flex-col h-[300px]">
                  <h3 className="text-xs font-semibold text-slate-200 mb-4 flex items-center gap-2"><Camera className="h-4 w-4 text-blue-400" /> Scanner</h3>
                  <div className="flex-1 border-2 border-dashed border-[#1e293b] rounded-lg bg-[#05070A] flex flex-col items-center justify-center p-6 text-center">
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-3"><Loader2 className="h-6 w-6 text-blue-500 animate-spin" /><span className="text-[10px] text-slate-400">Gemini analysiert...</span></div>
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 text-slate-600 mb-3" />
                        <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">Fotografiere ein Produkt, die KI trägt das MHD automatisch ein.</p>
                        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className="text-[10px] bg-blue-600/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-md hover:bg-blue-600/20 transition-colors font-medium">
                          Kamera starten
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Vorrat Liste */}
                <div className="lg:col-span-2 bg-[#0C1017] border border-[#1e293b] rounded-xl flex flex-col min-h-[300px]">
                  <div className="p-5 border-b border-[#1e293b]">
                    <h3 className="text-xs font-semibold text-slate-200">Aktueller Bestand</h3>
                  </div>
                  <div className="p-5 flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#1e293b]">
                          <th className="pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Artikel</th>
                          <th className="pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">MHD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b]/50">
                        {vorrat.map((v, idx) => (
                          <tr key={idx} className="hover:bg-[#05070A]/50 transition-colors">
                            <td className="py-3 text-sm text-slate-300 font-medium">{v.artikel}</td>
                            <td className="py-3 text-[11px] text-slate-400 text-right font-mono">{v.ablaufdatum}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: KALENDER */}
          {activeTab === "kalender" && (
            <div className="space-y-6">
              <div><h2 className="text-lg font-semibold text-slate-100">Termine</h2></div>
              <div className="bg-[#0C1017] border border-[#1e293b] rounded-xl p-5 md:p-6">
                <div className="space-y-1">
                  {termine.length === 0 ? <p className="text-sm text-slate-500 text-center py-8">Keine Termine gefunden.</p> : termine.map((t, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-md border border-[#1e293b] bg-[#05070A] mb-2 gap-2 md:gap-0">
                      <span className="text-sm font-medium text-slate-200">{t.title}</span>
                      <span className="text-xs font-mono text-blue-400 bg-blue-900/10 px-2.5 py-1 rounded border border-blue-800/20 w-fit">{t.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#05070A]/95 backdrop-blur-xl border-t border-[#1e293b] flex justify-around items-center px-2 py-2 pb-safe">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center w-16 h-12 gap-1 rounded-lg transition-all ${isActive ? "text-slate-100 bg-[#1A2332]" : "text-slate-500 hover:text-slate-300"}`}>
              <tab.icon className={`h-5 w-5 ${isActive ? "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : ""}`} />
              <span className="text-[9px] font-medium tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}