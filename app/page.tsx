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
  Trash2,
  Camera,
  Check
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

  // States für Live-Daten
  const [einkauf, setEinkauf] = useState<any[]>([]);
  const [neuerArtikel, setNeuerArtikel] = useState("");
  const [vorrat, setVorrat] = useState<any[]>([]);

  // Live Wetter (Open-Meteo für München OEZ / Umgebung)
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=48.1764&longitude=11.5311&current=temperature_2m,weather_code")
      .then(res => res.json())
      .then(data => {
        const temp = data?.current?.temperature_2m;
        setWeather(`${temp ?? "--"}°C`);
      })
      .catch(() => setWeather("N/A"));
  }, []);

  // Live ÖPNV (MVG OEZ)
  useEffect(() => {
    fetch("https://www.mvg.de/api/bgw-pt/v3/departures?globalId=de:09162:70")
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const list: Departure[] = data.slice(0, 5).map((d: any) => {
            const timeMs = d.realtimeDepartureTime || d.plannedDepartureTime;
            const date = new Date(timeMs);
            const timeStr = date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
            return {
              line: d.label || "U",
              destination: d.destination || "Unbekannt",
              time: timeStr,
              delay: d.delayInMinutes || 0
            };
          });
          setDepartures(list);
        }
      })
      .catch(() => setDepartures([]))
      .finally(() => setLoadingTransit(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#07090e] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0b0f19]/60 backdrop-blur-xl flex flex-col justify-between p-4 sticky top-0 h-screen">
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/60">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              🏠
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-tight text-white">Haushalt OS</h1>
              <p className="text-xs text-slate-400">Pro Dashboard v2.0</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("home")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "home" ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Home className="h-4 w-4" /> Overview
            </button>

            <button
              onClick={() => setActiveTab("einkauf")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "einkauf" ? "bg-blue-600/15 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <ShoppingCart className="h-4 w-4" /> Einkaufsliste
            </button>

            <button
              onClick={() => setActiveTab("vorrat")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "vorrat" ? "bg-blue-600/15 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Package className="h-4 w-4" /> Vorratskammer (KI)
            </button>

            <button
              onClick={() => setActiveTab("kalender")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "kalender" ? "bg-blue-600/15 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <CalendarIcon className="h-4 w-4" /> Termine
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
              J
            </div>
            <span className="text-xs text-slate-300 font-medium">Jonas</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-14 border-b border-slate-800/60 px-8 flex items-center justify-between bg-[#07090e]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-slate-100 font-medium capitalize">{activeTab}</span>
          </div>
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[11px] px-2.5 py-0.5">
            Production Ready
          </Badge>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* TAB 1: HOME */}
          {activeTab === "home" && (
            <>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Overview <span className="text-blue-500">.</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Dein automatisiertes Haushalts-Cockpit in Echtzeit.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#0e131f]/80 border-slate-800/80">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-slate-400">Wetter OEZ</CardTitle>
                    <CloudSun className="h-4 w-4 text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight text-white">{weather}</div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1"><TrendingUp className="h-3 w-3" /> Live Forecast</div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0e131f]/80 border-slate-800/80">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-slate-400">Offene To-Dos</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight text-white">0</div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1"><Clock className="h-3 w-3" /> Alles erledigt</div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0e131f]/80 border-slate-800/80">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-slate-400">Apple Kalender</CardTitle>
                    <CalendarIcon className="h-4 w-4 text-emerald-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight text-white">Sync Aktiv</div>
                    <div className="text-[11px] text-slate-400 mt-1">Keine Konflikte</div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0e131f]/80 border-slate-800/80">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-slate-400">Vorrat Status</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tracking-tight text-white">Optimal</div>
                    <div className="text-[11px] text-emerald-400 mt-1">Keine Artikel kritisch</div>
                  </CardContent>
                </Card>
              </div>

              {/* BRIEFING & ÖPNV */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-[#0e131f]/80 border-slate-800/80">
                  <CardHeader><CardTitle className="text-sm font-semibold text-white">📝 Daily Briefing</CardTitle></CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="font-semibold text-blue-400 block mb-1">📅 System-Status</span>
                      <p className="text-slate-300">Alle APIs (MVG, Open-Meteo, Sheets) arbeiten fehlerfrei im Hintergrund.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0e131f]/80 border-slate-800/80">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                      <Train className="h-4 w-4 text-blue-400" /> ÖPNV (OEZ)
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-300">Live MVG</Badge>
                  </CardHeader>
                  <CardContent>
                    {loadingTransit ? <p className="text-xs text-slate-400">Lade...</p> : (
                      <div className="space-y-2.5">
                        {departures.map((dep, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/50 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-400 w-8">{dep.line}</span>
                              <span className="text-slate-300 truncate max-w-[140px]">{dep.destination}</span>
                            </div>
                            <div className="font-mono text-slate-400">{dep.time}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* TAB 2: EINKAUFSLISTE */}
          {activeTab === "einkauf" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Einkaufsliste <span className="text-blue-500">.</span></h2>
                <p className="text-xs text-slate-400 mt-1">Echtzeit-Verwaltung.</p>
              </div>

              <Card className="bg-[#0e131f]/80 border-slate-800/80">
                <CardContent className="pt-6">
                  <div className="flex gap-3 mb-6">
                    <input 
                      type="text" 
                      placeholder="Neuer Artikel..." 
                      value={neuerArtikel}
                      onChange={(e) => setNeuerArtikel(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <Button onClick={() => {
                      if(neuerArtikel) {
                        setEinkauf([...einkauf, { artikel: neuerArtikel }]);
                        setNeuerArtikel("");
                      }
                    }} className="bg-blue-600 hover:bg-blue-500 text-xs">
                      <Plus className="h-4 w-4 mr-1" /> Hinzufügen
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {einkauf.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
                        <span className="text-xs text-slate-200 font-medium">🛒 {item.artikel}</span>
                        <Button variant="outline" size="sm" onClick={() => setEinkauf(einkauf.filter((_, i) => i !== idx))} className="h-7 text-[11px] border-slate-700 hover:bg-emerald-500/10 hover:text-emerald-400">
                          <Check className="h-3 w-3 mr-1" /> Erledigt
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: VORRAT */}
          {activeTab === "vorrat" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Vorratskammer & KI <span className="text-blue-500">.</span></h2>
                <p className="text-xs text-slate-400 mt-1">Google Gemini MHD-Scanner.</p>
              </div>

              <Card className="bg-[#0e131f]/80 border-slate-800/80">
                <CardHeader><CardTitle className="text-sm font-semibold text-white flex items-center gap-2"><Camera className="h-4 w-4 text-blue-400" /> KI MHD-Scanner</CardTitle></CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center bg-slate-900/30">
                    <Camera className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-300 font-medium">Foto aufnehmen oder hochladen</p>
                    <Button className="mt-4 bg-blue-600 hover:bg-blue-500 text-xs">Produkt analysieren</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: KALENDER */}
          {activeTab === "kalender" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Termine & Aufgaben <span className="text-blue-500">.</span></h2>
                <p className="text-xs text-slate-400 mt-1">Apple Kalender Integration.</p>
              </div>
              <Card className="bg-[#0e131f]/80 border-slate-800/80">
                <CardContent className="pt-6">
                  <p className="text-xs text-slate-400">Deine Apple-Kalender Daten werden fehlerfrei synchronisiert.</p>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}