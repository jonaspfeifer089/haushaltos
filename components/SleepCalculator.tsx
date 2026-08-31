import React, { useState, useEffect } from "react";
import { Moon, Sun, Clock, Sparkles, Zap, CheckCircle2, ShieldAlert } from "lucide-react";

interface SleepCalculatorProps {
  theme: any;
}

interface CycleResult {
  cycles: number;
  sleepHours: number;
  wakeTime: string;
  quality: "Optimal" | "Gut" | "Minimum" | "Powernap";
  recommended?: boolean;
}

export function SleepCalculator({ theme }: SleepCalculatorProps) {
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

  // Standard: Aktuelle Uhrzeit im Format HH:MM
  const getNowString = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const [bedTime, setBedTime] = useState<string>(getNowString());
  const [fallAsleepDuration, setFallAsleepDuration] = useState<number>(14); // Wissenschaftlicher Durchschnitt: 14 Minuten
  const [results, setResults] = useState<CycleResult[]>([]);
  const [selectedAlarm, setSelectedAlarm] = useState<string | null>(null);

  // Berechnung der optimalen Weckzeiten
  const calculateWakeTimes = (timeStr: string, latencyMin: number) => {
    const [h, m] = timeStr.split(":").map(Number);
    const start = new Date();
    start.setHours(h, m, 0, 0);

    // Einschlafzeit addieren
    const sleepStart = new Date(start.getTime() + latencyMin * 60 * 1000);

    const cycleConfigs = [
      { cycles: 6, label: "Optimal (9.0h)", quality: "Optimal" as const, recommended: true },
      { cycles: 5, label: "Standard (7.5h)", quality: "Optimal" as const, recommended: true },
      { cycles: 4, label: "Minimum (6.0h)", quality: "Gut" as const },
      { cycles: 3, label: "Kurz (4.5h)", quality: "Minimum" as const },
      { cycles: 1, label: "Power-Cycle (1.5h)", quality: "Powernap" as const }
    ];

    const computed: CycleResult[] = cycleConfigs.map((cfg) => {
      const wakeDate = new Date(sleepStart.getTime() + cfg.cycles * 90 * 60 * 1000);
      const wakeHours = String(wakeDate.getHours()).padStart(2, "0");
      const wakeMinutes = String(wakeDate.getMinutes()).padStart(2, "0");
      return {
        cycles: cfg.cycles,
        sleepHours: (cfg.cycles * 90) / 60,
        wakeTime: `${wakeHours}:${wakeMinutes}`,
        quality: cfg.quality,
        recommended: cfg.recommended
      };
    });

    setResults(computed);
    // Standardmäßig 5 Zyklen (7.5h) vorauswählen
    const rec = computed.find((c) => c.cycles === 5);
    if (rec) setSelectedAlarm(rec.wakeTime);
  };

  useEffect(() => {
    calculateWakeTimes(bedTime, fallAsleepDuration);
  }, [bedTime, fallAsleepDuration]);

  const handleSetNow = () => {
    const nowStr = getNowString();
    setBedTime(nowStr);
    calculateWakeTimes(nowStr, fallAsleepDuration);
  };

  return (
    <div className={`${bgCard} space-y-6 rounded-2xl border p-6 shadow-sm`}>
      {/* Header */}
      <div className="flex flex-col justify-between gap-2 border-b border-black/5 pb-4 sm:flex-row sm:items-center dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#005377]/10 text-[#005377] dark:bg-[#82CBEE]/20 dark:text-[#82CBEE]">
            <Moon className="h-5 w-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold ${textTitle}`}>Smart Sleep & Wecker-Rechner</h3>
            <p className={`text-xs ${textSub}`}>
              Basierend auf 90-Minuten REM-/Non-REM-Zyklen + 14 Min. Einschlaflatenz
            </p>
          </div>
        </div>

        <button
          onClick={handleSetNow}
          className="flex h-8 items-center gap-1.5 rounded-xl bg-[#005377] px-3 text-xs font-bold text-white transition-all hover:bg-[#00415e] active:scale-95"
        >
          <Sparkles className="h-3.5 w-3.5" /> Ich gehe JETZT schlafen
        </button>
      </div>

      {/* Eingabe & Settings */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={`text-xs font-semibold ${textSub}`}>Schlafenszeit (Uhrzeit)</label>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={bedTime}
              onChange={(e) => setBedTime(e.target.value)}
              className={`w-full rounded-xl border ${bgInput} p-2.5 font-mono text-base font-bold ${textTitle} focus:outline-none`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={`text-xs font-semibold ${textSub}`}>Geschätzte Einschlafdauer</label>
          <select
            value={fallAsleepDuration}
            onChange={(e) => setFallAsleepDuration(Number(e.target.value))}
            className={`w-full rounded-xl border ${bgInput} p-2.5 font-mono text-sm font-semibold ${textTitle} focus:outline-none`}
          >
            <option value={0}>Sofort (0 Min)</option>
            <option value={10}>Schnell (10 Min)</option>
            <option value={14}>Durchschnitt (14 Min - Empfohlen)</option>
            <option value={20}>Langsam (20 Min)</option>
            <option value={30}>Sehr langsam (30 Min)</option>
          </select>
        </div>
      </div>

      {/* Ergebnis-Vorschläge (Zyklen) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold tracking-wider uppercase ${textTitle}`}>
            Empfohlene Wecker-Uhrzeiten (Aufwachen im Leichtschlaf):
          </span>
          {selectedAlarm && (
            <span className={`font-mono text-xs font-bold ${accentBlue}`}>
              Gewählt: {selectedAlarm} Uhr
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {results.map((res) => {
            const isSelected = selectedAlarm === res.wakeTime;
            return (
              <div
                key={res.cycles}
                onClick={() => setSelectedAlarm(res.wakeTime)}
                className={`relative cursor-pointer rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? "border-[#005377] bg-[#005377]/5 dark:border-[#82CBEE] dark:bg-[#82CBEE]/10"
                    : `${bgItem} hover:border-[#005377]/30`
                }`}
              >
                {res.recommended && (
                  <span className="absolute -top-2 right-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                    Empfohlen
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold opacity-70">
                    {res.cycles} {res.cycles === 1 ? "Zyklus" : "Zyklen"}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {res.sleepHours} Std.
                  </span>
                </div>

                <div className={`mt-2 font-mono text-2xl font-black ${textTitle}`}>
                  {res.wakeTime}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] font-semibold">
                  <span
                    className={`${
                      res.quality === "Optimal"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : res.quality === "Gut"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {res.quality}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#005377] dark:text-[#82CBEE]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wissenschaftliche Info Box */}
      <div
        className={`rounded-xl border border-black/5 bg-black/[0.02] p-3 text-[11px] leading-relaxed ${textSub} dark:border-white/5 dark:bg-white/[0.02]`}
      >
        <span className="font-bold text-[#005377] dark:text-[#82CBEE]">
          🧠 Wissenschaftlicher Hintergrund:
        </span>{" "}
        Ein menschlicher Schlafzyklus durchläuft 4 Phasen (Einschlafen, Leichtschlaf, Tiefschlaf,
        REM) und dauert ca. 90 Minuten. Wenn der Wecker dich mitten im Tiefschlaf weckt, entsteht
        schwere Schlaftrunkenheit (Schlafinergie). Mit diesen errechneten Zeiten wachst du am Ende
        der REM-Phase im natürlichen Leichtschlaf auf und fühlst dich sofort wach.
      </div>
    </div>
  );
}
