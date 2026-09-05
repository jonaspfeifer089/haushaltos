import React, { useState } from "react";
import { GymAuditView } from "./GymAuditView";
import {
  Dumbbell,
  Flame,
  Activity,
  Check,
  X,
  Plus,
  ChevronDown,
  Trash2,
  TrendingUp,
  AlertTriangle,
  Scale,
  Zap
} from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ReferenceLine
} from "recharts";
import { PUSH_ROUTINE, PULL_ROUTINE, CORE_COMPOUNDS, GymItem } from "../types";
import {
  calculate1RM,
  getNextSetTarget,
  formatDauer,
  normalizeExerciseName
} from "../lib/mciEngine";

export function ActiveWorkoutView({ activeUser, gymData, workout, theme }: any) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-black font-sans text-white">
      <main className="flex h-full flex-1 flex-col overflow-y-auto">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-[#2C2C2E] bg-[#0C0C0E] px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => workout.setIsWorkoutMinimized(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1C1C1E] text-white transition-colors hover:bg-[#2C2C2E]"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
            <span className="text-[15px] font-semibold">Aktive Session</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => workout.setShowAddExerciseModal(true)}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-[#1C1C1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2C2C2E]"
            >
              <Plus className="h-3.5 w-3.5" /> Übung
            </button>
            <button
              onClick={workout.endWorkout}
              className="rounded-full bg-[#0A84FF] px-4 py-1.5 text-sm font-semibold text-white transition-all hover:bg-[#0070E0]"
            >
              Beenden
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[#1C1C1E] bg-[#000000] px-6 py-4">
          <div className="flex flex-col">
            <span className="mb-1 text-[10px] font-medium text-gray-400 uppercase">Dauer</span>
            <span className="font-mono text-[15px] font-semibold text-[#0A84FF]">
              {formatDauer(workout.workoutDauer)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-1 text-[10px] font-medium text-gray-400 uppercase">Volumen</span>
            <span className="font-mono text-[15px] font-semibold">
              {workout.currentWorkoutVolume} kg
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-1 text-[10px] font-medium text-gray-400 uppercase">
              Arbeitssätze
            </span>
            <span className="font-mono text-[15px] font-semibold">
              {workout.currentWorkoutSets}
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl space-y-6 p-3 pb-36">
          {workout.activeExercises.map((ex: any) => (
            <div
              key={ex.id}
              className="rounded-2xl border border-[#232326] bg-[#121214] p-4 shadow-lg"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-bold text-black">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[15px] leading-tight font-semibold text-[#0A84FF]">
                      {ex.name}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Ziel-Korridor:
                      </span>
                      <input
                        type="text"
                        value={ex.targetRange || "8-12"}
                        onChange={(e) => workout.updateTargetRange(ex.id, e.target.value)}
                        className="w-16 rounded border border-white/10 bg-[#1C1C1E] px-2 py-0.5 text-center font-mono text-xs font-bold text-gray-200 outline-none focus:border-[#0A84FF]"
                      />
                      <span className="text-[10px] font-bold text-gray-400">WDH</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => workout.removeExercise(ex.id)}
                  className="p-1 text-gray-500 transition-colors hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-2 grid grid-cols-12 gap-2 px-1 text-center text-[10px] font-bold tracking-wider text-gray-500">
                <div className="col-span-1 text-left">SATZ</div>
                <div className="col-span-4 text-left">VORHERIGE LAST</div>
                <div className="col-span-3">KG</div>
                <div className="col-span-2">WDH</div>
                <div className="col-span-2 flex justify-center">
                  <Check className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-2.5">
                {ex.sets.map((s: any) => {
                  const targetInfo = getNextSetTarget(
                    ex.name,
                    s.set,
                    gymData.filter((g: any) => g.username === activeUser)
                  );
                  return (
                    <div
                      key={s.id}
                      className={`rounded-xl border p-2.5 transition-all ${s.done ? "border-emerald-500/40 bg-[#1C1C1E]/80" : "border-white/5 bg-[#161618]"}`}
                    >
                      <div className="mb-1.5 flex items-center justify-between px-1 text-[10px]">
                        <span className="max-w-[140px] truncate font-mono text-slate-400">
                          Ref: {s.prev}
                        </span>
                        <span className="rounded bg-[#0A84FF]/10 px-1.5 py-0.5 font-mono font-bold text-[#0A84FF]">
                          🎯 {targetInfo.label}: {targetInfo.targetKg}kg × {targetInfo.targetReps}
                        </span>
                      </div>
                      <div className="grid grid-cols-12 items-center gap-2">
                        <div className="col-span-1 text-center font-mono text-xs font-bold text-white">
                          {s.set}
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            step="0.5"
                            inputMode="decimal"
                            placeholder={`${targetInfo.targetKg}`}
                            value={s.kg}
                            onChange={(e) => workout.updateSet(ex.id, s.id, "kg", e.target.value)}
                            className="h-8 w-full rounded-md border border-[#2C2C2E] bg-[#1C1C1E] text-center font-mono text-xs font-semibold text-white outline-none focus:border-[#0A84FF]"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder={`${targetInfo.targetReps}`}
                            value={s.reps}
                            onChange={(e) => workout.updateSet(ex.id, s.id, "reps", e.target.value)}
                            className="h-8 w-full rounded-md border border-[#2C2C2E] bg-[#1C1C1E] text-center font-mono text-xs font-semibold text-white outline-none focus:border-[#0A84FF]"
                          />
                        </div>
                        <div className="col-span-4 flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              workout.updateSet(ex.id, s.id, "kg", String(targetInfo.targetKg));
                              workout.updateSet(ex.id, s.id, "reps", String(targetInfo.targetReps));
                            }}
                            className="h-7 rounded bg-white/5 px-2 text-[10px] font-bold text-slate-300 transition-colors hover:bg-white/10"
                            title="Zielvorgabe übernehmen"
                          >
                            Auto
                          </button>
                          <button
                            type="button"
                            onClick={() => workout.toggleSetDone(ex.id, s.id)}
                            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${s.done ? "bg-[#32D74B] text-black" : "bg-[#1C1C1E] text-gray-500 hover:bg-[#2C2C2E]"}`}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          {ex.sets.length > 1 && (
                            <button
                              onClick={() => workout.removeSetFromExercise(ex.id, s.id)}
                              className="p-0.5 text-gray-600 hover:text-rose-400"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => workout.addSetToExercise(ex.id)}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-white/5 bg-[#1C1C1E] py-2 text-xs font-semibold text-gray-300 transition-colors hover:bg-[#242428]"
              >
                <Plus className="h-3.5 w-3.5" /> Satz hinzufügen
              </button>
            </div>
          ))}
          <button
            onClick={() => workout.setShowAddExerciseModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#0A84FF]/40 bg-[#1C1C1E] py-3.5 text-sm font-bold text-[#0A84FF] transition-all hover:bg-[#28282D]"
          >
            <Plus className="h-4 w-4" /> Weitere Übung hinzufügen
          </button>
        </div>

        {workout.showAddExerciseModal && (
          <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-40 md:right-8 md:bottom-8">
            <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#1C1C1E] p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Übung auswählen</h3>
                <button
                  onClick={() => workout.setShowAddExerciseModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Freie Übungsbezeichnung..."
                  value={workout.customExerciseName}
                  onChange={(e) => workout.setCustomExerciseName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    workout.addExerciseToActiveWorkout(workout.customExerciseName)
                  }
                  className="w-full rounded-xl border border-[#2C2C2E] bg-[#121214] px-4 py-2.5 text-xs text-white outline-none focus:border-[#0A84FF]"
                />
                <button
                  onClick={() => workout.addExerciseToActiveWorkout(workout.customExerciseName)}
                  className="w-full rounded-xl bg-[#0A84FF] py-2 text-xs font-bold text-white"
                >
                  Hinzufügen
                </button>
              </div>
              <div className="border-t border-white/10 pt-2">
                <span className="mb-2 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                  Routine-Katalog:
                </span>
                <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pr-1">
                  {[...PUSH_ROUTINE, ...PULL_ROUTINE].map((exName, idx) => (
                    <button
                      key={idx}
                      onClick={() => workout.addExerciseToActiveWorkout(exName)}
                      className="truncate rounded-lg border border-white/5 bg-[#121214] px-2.5 py-1.5 text-left text-[11px] text-gray-200 hover:bg-[#28282D]"
                    >
                      + {exName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function GymDashboardView({ activeUser, gymData, workout, theme }: any) {
  const [gymUebung, setGymUebung] = useState("");
  const {
    bgCard,
    bgItem,
    bgInput,
    textTitle,
    textSub,
    accentBlue,
    accentGreen,
    badgeBlue,
    badgeGreen,
    buttonPrimary,
    isDarkMode
  } = theme;

  const userGymData = (gymData || []).filter((g: GymItem) => g.username === activeUser);
  const activeExerciseName = gymUebung.trim() || PUSH_ROUTINE[0];
  const activeExerciseNorm = normalizeExerciseName(activeExerciseName);

  // 1. Daten für die ausgewählte Übung filtern
  const exerciseSets = userGymData
    .filter(
      (g: GymItem) =>
        normalizeExerciseName(g.uebung).includes(activeExerciseNorm) ||
        activeExerciseNorm.includes(normalizeExerciseName(g.uebung))
    )
    .sort((a: GymItem, b: GymItem) => new Date(a.datum).getTime() - new Date(b.datum).getTime());

  // Sessions nach Datum bündeln
  const exerciseSessionsMap = exerciseSets.reduce(
    (acc: any, curr: GymItem) => {
      if (!acc[curr.datum]) acc[curr.datum] = { datum: curr.datum, sets: [] as GymItem[] };
      acc[curr.datum].sets.push(curr);
      return acc;
    },
    {} as Record<string, { datum: string; sets: GymItem[] }>
  );

  // Sportwissenschaftliche Metriken pro Einheit berechnen
  const chartData = Object.values(exerciseSessionsMap).map((session: any) => {
    // 1RM nach modifizierter Brzycki-Formel für valide Arbeitssätze
    const validSets = session.sets.filter((s: GymItem) => s.gewicht > 0 && s.reps > 0);
    const bestSet = validSets.reduce(
      (prev: GymItem, curr: GymItem) => {
        const rmCurr = calculate1RM(curr.gewicht, curr.reps);
        const rmPrev = calculate1RM(prev.gewicht, prev.reps);
        return rmCurr > rmPrev ? curr : prev;
      },
      validSets[0] || { gewicht: 0, reps: 0 }
    );

    const totalSessionVol = validSets.reduce(
      (sum: number, s: GymItem) => sum + s.gewicht * s.reps,
      0
    );
    const totalReps = validSets.reduce((sum: number, s: GymItem) => sum + s.reps, 0);

    // Effektive Lastdichte: Wie schwer war das durchschnittlich bewegte Gewicht pro Repetition?
    const avgLoadPerRep = totalReps > 0 ? Number((totalSessionVol / totalReps).toFixed(1)) : 0;
    const max1RM = calculate1RM(bestSet.gewicht, bestSet.reps);
    const d = new Date(session.datum);

    return {
      datum: d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      rawDatum: session.datum,
      oneRepMax: max1RM,
      bestWeight: bestSet.gewicht,
      bestReps: bestSet.reps,
      volumen: totalSessionVol,
      avgIntensity: avgLoadPerRep,
      setCount: validSets.length
    };
  });

  // 2. Muskelketten-Volumen der letzten 14 Tage (mikrozyklische Belastung)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const recentWork = userGymData.filter((g: GymItem) => new Date(g.datum) >= fourteenDaysAgo);

  const pushSetsCount = recentWork.filter((g: GymItem) =>
    /bank|cross|brust|schulter|presse|seitheben|trizeps/i.test(g.uebung)
  ).length;
  const pullSetsCount = recentWork.filter((g: GymItem) =>
    /ruder|lat|zug|klimm|curl|bizeps|preacher/i.test(g.uebung)
  ).length;

  // Gelenkbalance-Quotient (Pull / Push)
  const structuralBalanceRatio =
    pushSetsCount > 0 ? (pullSetsCount / pushSetsCount).toFixed(2) : "1.00";
  const isBalanceHarmonious = parseFloat(structuralBalanceRatio) >= 1.0;

  // Spezifische Muskelgruppen (Letzte 7 Tage)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weekSets = userGymData.filter((g: GymItem) => new Date(g.datum) >= sevenDaysAgo);

  const chestSets = weekSets.filter((g: GymItem) => /bank|cross|brust/i.test(g.uebung)).length;
  const backSets = weekSets.filter((g: GymItem) => /ruder|lat|zug|klimm/i.test(g.uebung)).length;
  const shoulderSets = weekSets.filter((g: GymItem) =>
    /schulter|presse|seitheben/i.test(g.uebung)
  ).length;
  const armSets = weekSets.filter((g: GymItem) => /curl|trizeps|preacher/i.test(g.uebung)).length;

  // 3. Strikte Overload-Diagnostik
  const getObjectiveProgressStatus = () => {
    if (chartData.length < 2) {
      return {
        status: "Baseline-Phase",
        badge: badgeBlue,
        desc: "Mindestens 2 dokumentierte Einheiten erforderlich für Valenz-Prüfung."
      };
    }
    const current = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];

    const delta1RM = current.oneRepMax - previous.oneRepMax;
    const deltaDensity = current.avgIntensity - previous.avgIntensity;

    if (delta1RM > 0 && deltaDensity >= 0) {
      return {
        status: "Echter Overload (+Progression)",
        badge: badgeGreen,
        desc: `Effektive Kraftsteigerung (+${delta1RM}kg 1RM) bei stabiler/steigender Lastdichte (+${deltaDensity}kg/Rep). Reiz adaptiert.`
      };
    }
    if (delta1RM === 0 && current.volumen > previous.volumen) {
      return {
        status: "Volumen-Progression",
        badge: badgeBlue,
        desc: "Gleiches Spitzen-1RM, jedoch mehr Gesamtrepetitionen bewältigt. Nächste Session Laststeigerung indiziert."
      };
    }
    if (delta1RM < 0) {
      return {
        status: "Regenerationsdefizit / Ermüdung",
        badge: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
        desc: `Leistungsabfall von -${Math.abs(delta1RM)}kg 1RM im Topsatz. Prüfe Schlaf, Ernährung oder ZNS-Fatigue.`
      };
    }
    return {
      status: "Homöostase / Plateau",
      badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      desc: "Keine messbare Veränderung der Arbeitslast. Erhöhe Reps im ersten Satz um mindestens +1."
    };
  };

  const progressDiagnostic = getObjectiveProgressStatus();

  // 4. Lifetime-Tonnage und Spitzenwerte
  const allTimePR = chartData.length > 0 ? Math.max(...chartData.map((c: any) => c.oneRepMax)) : 0;
  const maxSessionVolume =
    chartData.length > 0 ? Math.max(...chartData.map((c: any) => c.volumen)) : 0;
  const current1RM = chartData.length > 0 ? chartData[chartData.length - 1].oneRepMax : 0;
  const previous1RM = chartData.length > 1 ? chartData[chartData.length - 2].oneRepMax : current1RM;
  const progressPercent =
    previous1RM > 0 ? (((current1RM - previous1RM) / previous1RM) * 100).toFixed(1) : "0.0";

  // 5. Trainingshistorie nach Sessions
  const allSessionsMap = userGymData.reduce(
    (acc: any, curr: GymItem) => {
      if (!acc[curr.datum]) acc[curr.datum] = { datum: curr.datum, sets: [] as GymItem[] };
      acc[curr.datum].sets.push(curr);
      return acc;
    },
    {} as Record<string, { datum: string; sets: GymItem[] }>
  );

  const workoutHistory = Object.values(allSessionsMap)
    .sort((a: any, b: any) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
    .map((session: any) => {
      const uebungen = Array.from(new Set(session.sets.map((s: GymItem) => s.uebung)));
      const totalVolume = session.sets.reduce(
        (sum: number, s: GymItem) => sum + s.gewicht * s.reps,
        0
      );
      const pushCount = session.sets.filter((s: GymItem) =>
        PUSH_ROUTINE.some((p) => normalizeExerciseName(p) === normalizeExerciseName(s.uebung))
      ).length;
      const pullCount = session.sets.filter((s: GymItem) =>
        PULL_ROUTINE.some((p) => normalizeExerciseName(p) === normalizeExerciseName(s.uebung))
      ).length;

      let type: "PUSH" | "PULL" | "INDIVIDUELL" = "INDIVIDUELL";
      if (pushCount > pullCount) type = "PUSH";
      else if (pullCount > pushCount) type = "PULL";

      const d = new Date(session.datum);
      return {
        rawDate: session.datum,
        formattedDate: `${d.toLocaleDateString("de-DE", { weekday: "short" })} ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`,
        type,
        totalVolume,
        totalSets: session.sets.length,
        uebungen
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${textTitle} flex items-center gap-2`}>
            <Activity className={`h-5 w-5 ${accentBlue}`} /> Performance OS & Biomechanik
          </h2>
          <p className={`text-xs ${textSub}`}>
            Objektivierte Trainingssteuerung und Overload-Validierung für {activeUser}
          </p>
        </div>
      </div>

      {/* AUDIT VIEW */}
      <GymAuditView
        activeUser={activeUser}
        gymData={userGymData.length > 0 ? userGymData : gymData}
        theme={theme}
      />

      {/* WORKOUT ROUTINEN STARTEN */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          className={`${bgCard} flex flex-col justify-between space-y-4 rounded-2xl border p-5 transition-all hover:border-[#0A84FF]/50`}
        >
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded bg-[#0A84FF]/20 px-2 py-0.5 font-mono text-xs font-bold text-[#0A84FF]">
                ROUTINE
              </span>
              <Flame className="h-4 w-4 text-[#0A84FF]" />
            </div>
            <h3 className={`text-base font-bold ${textTitle}`}>Push Day</h3>
            <p className={`text-xs ${textSub} mt-1`}>8 Übungen (Brust, Schultern, Trizeps)</p>
          </div>
          <button
            onClick={() => workout.startWorkout("push")}
            className="w-full rounded-xl bg-[#0A84FF] py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#0070E0]"
          >
            Push Workout starten
          </button>
        </div>

        <div
          className={`${bgCard} flex flex-col justify-between space-y-4 rounded-2xl border p-5 transition-all hover:border-[#32D74B]/50`}
        >
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded bg-[#32D74B]/20 px-2 py-0.5 font-mono text-xs font-bold text-[#32D74B]">
                ROUTINE
              </span>
              <Activity className="h-4 w-4 text-[#32D74B]" />
            </div>
            <h3 className={`text-base font-bold ${textTitle}`}>Pull Day</h3>
            <p className={`text-xs ${textSub} mt-1`}>5 Übungen (Rücken, Bizeps)</p>
          </div>
          <button
            onClick={() => workout.startWorkout("pull")}
            className="w-full rounded-xl bg-[#32D74B] py-2.5 text-xs font-bold text-black shadow-md transition-all hover:bg-[#28B840]"
          >
            Pull Workout starten
          </button>
        </div>

        <div className={`${bgCard} flex flex-col justify-between space-y-4 rounded-2xl border p-5`}>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${badgeBlue}`}>
                FREIES TRAINING
              </span>
            </div>
            <h3 className={`text-base font-bold ${textTitle}`}>Individuell</h3>
            <p className={`text-xs ${textSub} mt-1`}>Freie Übungsauswahl ohne Template</p>
          </div>
          <button
            onClick={() => workout.startWorkout("empty")}
            className={`w-full py-2.5 ${buttonPrimary} rounded-xl text-xs font-bold transition-all`}
          >
            Leeres Training starten
          </button>
        </div>
      </div>

      {/* 4 ECHTE SPORTWISSENSCHAFTLICHE METRIKEN */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={`${bgCard} rounded-2xl border p-4`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold tracking-wider uppercase ${textSub}`}>
              Peak 1RM ({activeExerciseName.split(" ")[0]})
            </span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`font-mono text-2xl font-black ${accentBlue}`}>{current1RM}</span>
            <span className={`text-xs font-bold ${textSub}`}>kg</span>
            <span
              className={`ml-auto font-mono text-[11px] font-bold ${parseFloat(progressPercent) >= 0 ? "text-emerald-500" : "text-rose-500"}`}
            >
              {parseFloat(progressPercent) >= 0 ? `+${progressPercent}` : progressPercent}%
            </span>
          </div>
          <span className="mt-1 block text-[10px] text-slate-400">All-Time PR: {allTimePR} kg</span>
        </div>

        <div className={`${bgCard} rounded-2xl border p-4`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold tracking-wider uppercase ${textSub}`}>
              Gelenk-Balance (Pull:Push)
            </span>
            <Scale
              className={`h-4 w-4 ${isBalanceHarmonious ? "text-emerald-400" : "text-amber-400"}`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`font-mono text-2xl font-black ${isBalanceHarmonious ? textTitle : "text-amber-400"}`}
            >
              {structuralBalanceRatio} : 1
            </span>
          </div>
          <span className="mt-1 block text-[10px] text-slate-400">
            {isBalanceHarmonious
              ? "✓ Ausgewogene Schulterblatt-Balance"
              : "⚠️ Push-Übergewicht (Pull steigern)"}
          </span>
        </div>

        <div className={`${bgCard} rounded-2xl border p-4`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold tracking-wider uppercase ${textSub}`}>
              Peak Lastdichte / Rep
            </span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`font-mono text-2xl font-black ${textTitle}`}>
              {chartData.length > 0 ? chartData[chartData.length - 1].avgIntensity : 0}
            </span>
            <span className={`text-xs font-bold ${textSub}`}>kg / WDH</span>
          </div>
          <span className="mt-1 block text-[10px] text-slate-400">Mittleres Arbeitsgewicht</span>
        </div>

        <div className={`${bgCard} rounded-2xl border p-4`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold tracking-wider uppercase ${textSub}`}>
              Max. Reiz-Tonnage
            </span>
            <Dumbbell className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`font-mono text-2xl font-black ${textTitle}`}>{maxSessionVolume}</span>
            <span className={`text-xs font-bold ${textSub}`}>kg Session</span>
          </div>
          <span className="mt-1 block text-[10px] text-slate-400">
            Höchster Workload dieser Übung
          </span>
        </div>
      </div>

      {/* DIAGNOSTIK-PANEL */}
      <div className={`${bgCard} space-y-2 rounded-2xl border p-5`}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Automatisierte Overload-Diagnose: {activeExerciseName}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${progressDiagnostic.badge}`}
          >
            {progressDiagnostic.status}
          </span>
        </div>
        <p className={`text-xs ${textTitle} leading-relaxed`}>{progressDiagnostic.desc}</p>
      </div>

      {/* HAUPTCHARTS: PROGRESSION & LASTVERTEILUNG */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* CHART 1: 1RM UND EFFEKTIVE LASTDICHTE */}
          <div className={`${bgCard} space-y-4 rounded-3xl border p-6`}>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                  1RM & Intensitätsverlauf
                </h3>
                <p className={`text-sm font-bold ${textTitle} mt-0.5`}>
                  Berechnetes Maximalgewicht vs. Durchschnittliche Last ({activeExerciseName})
                </p>
              </div>
              <select
                value={gymUebung}
                onChange={(e) => setGymUebung(e.target.value)}
                className={`text-xs font-semibold ${bgInput} rounded-xl border px-3 py-2 focus:outline-none`}
              >
                {[...PUSH_ROUTINE, ...PULL_ROUTINE].map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-[260px] w-full pt-2">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0A84FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={isDarkMode ? "#ffffff10" : "#00000010"}
                    />
                    <XAxis
                      dataKey="datum"
                      stroke={isDarkMode ? "#777" : "#aaa"}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={["dataMin - 5", "dataMax + 5"]}
                      stroke={isDarkMode ? "#777" : "#aaa"}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div
                              className={`${bgCard} space-y-1.5 rounded-xl border p-3 text-xs shadow-2xl`}
                            >
                              <div className="font-bold text-slate-400">{data.rawDatum}</div>
                              <div className="font-mono font-black text-[#0A84FF]">
                                1RM: {data.oneRepMax} kg
                              </div>
                              <div className="font-mono text-slate-300">
                                Bester Satz: {data.bestWeight} kg × {data.bestReps} Reps
                              </div>
                              <div className="font-mono text-slate-400">
                                Lastdichte: {data.avgIntensity} kg / Rep
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="oneRepMax"
                      stroke="#0A84FF"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#color1RM)"
                      dot={{ r: 4, strokeWidth: 2, fill: isDarkMode ? "#0C0C0E" : "#FFFFFF" }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-500/20 px-4 text-center">
                  <span className={`text-xs font-medium ${textSub}`}>
                    Keine Einheiten für diese Übung protokolliert.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CHART 2: REINES VOLUMEN / TONNAGE */}
          <div className={`${bgCard} space-y-4 rounded-3xl border p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                  Volumen-Entwicklung (Tonnage)
                </h3>
                <p className={`text-xs font-semibold ${textTitle} mt-0.5`}>
                  Bewegtes Gesamtgewicht pro Trainingseinheit
                </p>
              </div>
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${badgeGreen}`}
              >
                kg bewegt
              </span>
            </div>
            <div className="h-[180px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={isDarkMode ? "#ffffff10" : "#00000010"}
                    />
                    <XAxis
                      dataKey="datum"
                      stroke={isDarkMode ? "#777" : "#aaa"}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={isDarkMode ? "#777" : "#aaa"}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div
                              className={`${bgCard} space-y-1 rounded-xl border p-2.5 text-xs shadow-xl`}
                            >
                              <div className="font-bold text-slate-400">{data.rawDatum}</div>
                              <div className="font-mono font-extrabold text-emerald-400">
                                Workload: {data.volumen} kg
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {data.setCount} Arbeitssätze absolviert
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="volumen"
                      fill={isDarkMode ? "#32D74B" : "#5B8C5A"}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-500/20">
                  <span className={`text-xs ${textSub}`}>Keine Sätze vorhanden.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RECHTE SPALTE: WOCHEN-VOLUMEN & HISTORIE */}
        <div className="space-y-6 lg:col-span-4">
          {/* HYPERTROPHIE SATZ-KORRIDOR (MEV / MAV) */}
          <div className={`${bgCard} space-y-4 rounded-3xl border p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                  Wochen-Volumen (Hard Sets)
                </h3>
                <p className={`text-[11px] font-semibold ${textTitle} mt-0.5`}>
                  Ziel: 10–20 Sätze pro Muskelgruppe
                </p>
              </div>
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${badgeGreen}`}
              >
                7 Tage
              </span>
            </div>

            <div className="space-y-3">
              {[
                { name: "Brust (Push)", count: chestSets },
                { name: "Rücken (Pull)", count: backSets },
                { name: "Schultern (Push/Pull)", count: shoulderSets },
                { name: "Arme (Bizeps/Trizeps)", count: armSets }
              ].map((m, i) => {
                const isOptimal = m.count >= 10 && m.count <= 20;
                const isLow = m.count < 10;
                return (
                  <div key={i} className={`rounded-xl border p-3 ${bgItem} space-y-2`}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className={textTitle}>{m.name}</span>
                      <span
                        className={`py-0.2 rounded px-1.5 font-mono text-[10px] ${isOptimal ? badgeGreen : isLow ? badgeBlue : "bg-rose-500/20 text-rose-400"}`}
                      >
                        {isOptimal ? "Optimal" : isLow ? "Steigern" : "Deload"}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className={`font-mono text-xl font-black ${textTitle}`}>
                        {m.count} Sätze
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">Ziel: 12-16</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                      <div
                        className={`h-full transition-all duration-500 ${isOptimal ? "bg-[#32D74B]" : isLow ? "bg-[#0A84FF]" : "bg-rose-500"}`}
                        style={{ width: `${Math.min(100, (m.count / 16) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HISTORIE DER LETZTEN WORKOUTS */}
          <div className={`${bgCard} space-y-4 rounded-3xl border p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                  Dokumentierte Sessions
                </h3>
                <p className={`text-xs font-semibold ${textTitle} mt-0.5`}>
                  Chronologischer Ablauf ({workoutHistory.length})
                </p>
              </div>
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${badgeBlue}`}
              >
                Log
              </span>
            </div>

            <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
              {workoutHistory.length === 0 ? (
                <div className={`p-6 text-center text-xs ${textSub}`}>
                  Noch keine Workouts protokolliert.
                </div>
              ) : (
                workoutHistory.map((w: any, idx: number) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 ${bgItem} space-y-2 transition-all hover:border-[#0A84FF]/40`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-lg px-2 py-0.5 font-mono text-[11px] font-black ${w.type === "PUSH" ? "border border-[#0A84FF]/30 bg-[#0A84FF]/20 text-[#0A84FF]" : w.type === "PULL" ? "border border-[#32D74B]/30 bg-[#32D74B]/20 text-[#32D74B]" : badgeBlue}`}
                        >
                          {w.type}
                        </span>
                        <span className={`text-xs font-bold ${textTitle}`}>{w.formattedDate}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {w.totalVolume} kg
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{w.totalSets} Arbeitssätze</span>
                      <span>{w.uebungen.length} Übungen</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
