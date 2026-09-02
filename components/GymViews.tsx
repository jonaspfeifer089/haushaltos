import React, { useState } from "react";
import { GymAuditView } from "./GymAuditView";
import { Dumbbell, Flame, Activity, Check, X, Plus, ChevronDown, Trash2 } from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { PUSH_ROUTINE, PULL_ROUTINE, CORE_COMPOUNDS, GymItem } from "../types";
import { calculate1RM, getNextSetTarget, formatDauer } from "../lib/mciEngine";

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
            <span className="text-[15px] font-semibold">Workout</span>
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
            <span className="mb-1 text-[10px] font-medium text-gray-400">Dauer</span>
            <span className="text-[15px] font-semibold text-[#0A84FF]">
              {formatDauer(workout.workoutDauer)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-1 text-[10px] font-medium text-gray-400">Volumen</span>
            <span className="text-[15px] font-semibold">{workout.currentWorkoutVolume} kg</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-1 text-[10px] font-medium text-gray-400">Sätze</span>
            <span className="text-[15px] font-semibold">{workout.currentWorkoutSets}</span>
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
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Ziel:</span>
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
                <div className="col-span-1 text-left">SET</div>
                <div className="col-span-4 text-left">VORHERIGE</div>
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
                    gymData.filter(
                      (g: any) =>
                        g.username === activeUser &&
                        g.uebung.toLowerCase() === ex.name.toLowerCase()
                    )
                  );
                  return (
                    <div
                      key={s.id}
                      className={`rounded-xl border p-2.5 transition-all ${s.done ? "border-emerald-500/40 bg-[#1C1C1E]/80" : "border-white/5 bg-[#161618]"}`}
                    >
                      <div className="mb-1.5 flex items-center justify-between px-1 text-[10px]">
                        <span className="max-w-[140px] truncate font-mono text-slate-400">
                          Vorher: {s.prev}
                        </span>
                        <span className="rounded bg-[#0A84FF]/10 px-1.5 py-0.5 font-mono font-bold text-[#0A84FF]">
                          🎯 Ziel: {targetInfo.targetKg}kg × {targetInfo.targetReps}
                        </span>
                      </div>
                      <div className="grid grid-cols-12 items-center gap-2">
                        <div className="col-span-1 text-center text-xs font-bold text-white">
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
                            className="h-8 w-full rounded-md border border-[#2C2C2E] bg-[#1C1C1E] text-center text-xs font-semibold text-white outline-none focus:border-[#0A84FF]"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder={`${targetInfo.targetReps}`}
                            value={s.reps}
                            onChange={(e) => workout.updateSet(ex.id, s.id, "reps", e.target.value)}
                            className="h-8 w-full rounded-md border border-[#2C2C2E] bg-[#1C1C1E] text-center text-xs font-semibold text-white outline-none focus:border-[#0A84FF]"
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
                            title="Ziel übernehmen"
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
            <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#1C1C1E] p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Übung zum Workout hinzufügen</h3>
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
                  placeholder="Eigene Übung eingeben..."
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
                  Schnellauswahl:
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

  const userGymData = gymData.filter((g: GymItem) => g.username === activeUser);
  const activeExerciseName = gymUebung.trim() || PUSH_ROUTINE[0];

  const exerciseSets = userGymData
    .filter((g: GymItem) => g.uebung.toLowerCase() === activeExerciseName.toLowerCase())
    .sort((a: GymItem, b: GymItem) => new Date(a.datum).getTime() - new Date(b.datum).getTime());

  const sessionsByDate = exerciseSets.reduce(
    (acc: any, curr: GymItem) => {
      if (!acc[curr.datum]) acc[curr.datum] = { datum: curr.datum, sets: [] as GymItem[] };
      acc[curr.datum].sets.push(curr);
      return acc;
    },
    {} as Record<string, { datum: string; sets: GymItem[] }>
  );

  const chartData = Object.values(sessionsByDate).map((session: any) => {
    const bestSet = session.sets.reduce(
      (prev: GymItem, curr: GymItem) =>
        calculate1RM(curr.gewicht, curr.reps) > calculate1RM(prev.gewicht, prev.reps) ? curr : prev,
      session.sets[0]
    );
    const sessionVolume = session.sets.reduce(
      (sum: number, s: GymItem) => sum + s.gewicht * s.reps,
      0
    );
    const max1RM = calculate1RM(bestSet.gewicht, bestSet.reps);
    const d = new Date(session.datum);
    return {
      datum: d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      rawDatum: session.datum,
      oneRepMax: max1RM,
      bestWeight: bestSet.gewicht,
      bestReps: bestSet.reps,
      volumen: sessionVolume,
      setCount: session.sets.length
    };
  });

  const getOverloadRecommendation = () => {
    if (chartData.length < 2)
      return { status: "Basis aufbauen", desc: "Noch nicht genügend Daten für Empfehlung." };
    const latest = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2];
    if (latest.oneRepMax > prev.oneRepMax)
      return {
        status: "🔥 Overload aktiv",
        desc: `+${latest.oneRepMax - prev.oneRepMax} kg 1RM Steigerung! Nächstes Mal Gewicht halten und Reps stabilisieren.`
      };
    else if (latest.oneRepMax === prev.oneRepMax)
      return {
        status: "⚡ Steigerung bereit",
        desc: "Arbeitsgewicht erreicht: Erhöhe im 1. Satz um +2.5 kg oder peile +1 Rep an."
      };
    return {
      status: "🛡️ Ermüdung beachten",
      desc: "Leistungsabfall erkannt: Regeneration prüfen oder 1 Satz weniger ausführen."
    };
  };

  const overloadInfo = getOverloadRecommendation();
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const recentSets = userGymData.filter((g: GymItem) => new Date(g.datum) >= last7Days);
  const chestSets = recentSets.filter((g: GymItem) => /bank|cross|brust/i.test(g.uebung)).length;
  const backSets = recentSets.filter((g: GymItem) => /ruder|lat|zug|klimm/i.test(g.uebung)).length;
  const shoulderSets = recentSets.filter((g: GymItem) =>
    /schulter|presse|seitheben/i.test(g.uebung)
  ).length;
  const armSets = recentSets.filter((g: GymItem) => /curl|trizeps|preacher/i.test(g.uebung)).length;

  const allTimePR = chartData.length > 0 ? Math.max(...chartData.map((c: any) => c.oneRepMax)) : 0;
  const maxWeightLifted =
    exerciseSets.length > 0 ? Math.max(...exerciseSets.map((s: GymItem) => s.gewicht)) : 0;
  const totalVolumeLifetime = exerciseSets.reduce(
    (sum: number, s: GymItem) => sum + s.gewicht * s.reps,
    0
  );
  const lastSession1RM = chartData.length > 0 ? chartData[chartData.length - 1].oneRepMax : 0;
  const prevSession1RM =
    chartData.length > 1 ? chartData[chartData.length - 2].oneRepMax : lastSession1RM;
  const growthRate =
    prevSession1RM > 0
      ? (((lastSession1RM - prevSession1RM) / prevSession1RM) * 100).toFixed(1)
      : "0.0";

  const allUserSessionsByDate = userGymData.reduce(
    (acc: any, curr: GymItem) => {
      if (!acc[curr.datum]) acc[curr.datum] = { datum: curr.datum, sets: [] as GymItem[] };
      acc[curr.datum].sets.push(curr);
      return acc;
    },
    {} as Record<string, { datum: string; sets: GymItem[] }>
  );

  const workoutHistory = Object.values(allUserSessionsByDate)
    .sort((a: any, b: any) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
    .map((session: any) => {
      const uebungen = Array.from(new Set(session.sets.map((s: GymItem) => s.uebung)));
      const totalVolume = session.sets.reduce(
        (sum: number, s: GymItem) => sum + s.gewicht * s.reps,
        0
      );
      const pushCount = session.sets.filter((s: GymItem) =>
        PUSH_ROUTINE.some((p) => p.toLowerCase() === s.uebung.toLowerCase())
      ).length;
      const pullCount = session.sets.filter((s: GymItem) =>
        PULL_ROUTINE.some((p) => p.toLowerCase() === s.uebung.toLowerCase())
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

  const allUserDatesAsc = Array.from(new Set(userGymData.map((g: GymItem) => g.datum))).sort(
    (a: any, b: any) => new Date(a).getTime() - new Date(b).getTime()
  );
  const globalStrengthHistory = allUserDatesAsc
    .map((currentDateStr) => {
      let totalComposite1RM = 0;
      let exerciseCount = 0;
      CORE_COMPOUNDS.forEach((comp) => {
        const pastSets = userGymData.filter(
          (g: GymItem) =>
            g.uebung.toLowerCase().includes(comp.name.toLowerCase().substring(0, 8)) &&
            new Date(g.datum) <= new Date(currentDateStr as string)
        );
        if (pastSets.length > 0) {
          const bestPastSet = pastSets.reduce(
            (prev: GymItem, curr: GymItem) =>
              calculate1RM(curr.gewicht, curr.reps) > calculate1RM(prev.gewicht, prev.reps)
                ? curr
                : prev,
            pastSets[0]
          );
          totalComposite1RM += calculate1RM(bestPastSet.gewicht, bestPastSet.reps);
          exerciseCount++;
        }
      });
      const d = new Date(currentDateStr as string);
      return {
        datum: d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
        rawDatum: currentDateStr,
        compositeScore: totalComposite1RM,
        trackedCompounds: exerciseCount
      };
    })
    .filter((item) => item.compositeScore > 0);

  const baselineScore =
    globalStrengthHistory.length > 0 ? globalStrengthHistory[0].compositeScore : 0;
  const currentCompositeScore =
    globalStrengthHistory.length > 0
      ? globalStrengthHistory[globalStrengthHistory.length - 1].compositeScore
      : 0;
  const totalCompositeGainKg = currentCompositeScore - baselineScore;
  const totalCompositeGainPercent =
    baselineScore > 0 ? ((totalCompositeGainKg / baselineScore) * 100).toFixed(1) : "0.0";
  const getMuscleMax1RM = (keyword: string) => {
    const sets = userGymData.filter((g: GymItem) =>
      g.uebung.toLowerCase().includes(keyword.toLowerCase())
    );
    if (sets.length === 0) return 0;
    return Math.max(...sets.map((s: GymItem) => calculate1RM(s.gewicht, s.reps)));
  };
  const chest1RM = Math.max(getMuscleMax1RM("Bankdrücken"), getMuscleMax1RM("Schrägbank"));
  const back1RM = Math.max(getMuscleMax1RM("Rudern"), getMuscleMax1RM("Latzug"));
  const shoulder1RM = Math.max(getMuscleMax1RM("Schulter"), getMuscleMax1RM("Seitheben"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${textTitle} flex items-center gap-2`}>
            <Dumbbell className={`h-5 w-5 ${accentBlue}`} /> Performance OS & Hevy Routinen
          </h2>
          <p className={`text-xs ${textSub}`}>
            Progressive Overload & Routine-Tracking für {activeUser}
          </p>
        </div>
      </div>

      <GymAuditView activeUser={activeUser} gymData={gymData} theme={theme} />

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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={`${bgCard} rounded-2xl border p-4`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${textSub}`}>
              All-Time PR (1RM)
            </span>
            <span className="text-xs">🏆</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`font-mono text-2xl font-black ${accentBlue}`}>{allTimePR}</span>
            <span className={`text-xs font-bold ${textSub}`}>kg</span>
          </div>
        </div>
        <div className={`${bgCard} rounded-2xl border p-4`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${textSub}`}>
              Max. Arbeitsgewicht
            </span>
            <span className="text-xs">⚡</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`font-mono text-2xl font-black ${textTitle}`}>{maxWeightLifted}</span>
            <span className={`text-xs font-bold ${textSub}`}>kg</span>
          </div>
        </div>
        <div className={`${bgCard} rounded-2xl border p-4`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${textSub}`}>
              Trend vs. Vorwoche
            </span>
            <span className="text-xs">📈</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`font-mono text-2xl font-black ${parseFloat(growthRate) >= 0 ? accentGreen : "text-rose-500"}`}
            >
              {parseFloat(growthRate) > 0 ? `+${growthRate}` : `${growthRate}`}%
            </span>
          </div>
        </div>
        <div className={`${bgCard} rounded-2xl border p-4`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${textSub}`}>
              Lifetime Tonnage
            </span>
            <span className="text-xs">🏋️</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`font-mono text-2xl font-black ${textTitle}`}>
              {(totalVolumeLifetime / 1000).toFixed(1)}
            </span>
            <span className={`text-xs font-bold ${textSub}`}>Tonnen</span>
          </div>
        </div>
      </div>

      <div
        className={`${bgCard} rounded-3xl border border-[#0A84FF]/20 bg-gradient-to-r p-5 ${isDarkMode ? "from-[#0A84FF]/10 via-transparent to-transparent" : "from-[#0A84FF]/5 via-transparent to-transparent"} space-y-4`}
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0A84FF]/20 font-black text-[#0A84FF]">
              MCI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-[#0A84FF] uppercase">
                  Overload Intelligence
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeGreen}`}>
                  {overloadInfo.status}
                </span>
              </div>
              <p className={`text-xs ${textTitle} mt-0.5 font-medium`}>{overloadInfo.desc}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4 font-mono text-xs font-bold">
            <div className="text-center">
              <span className="block font-sans text-[10px] text-slate-400">Brust</span>
              {chestSets} Sätze
            </div>
            <div className="text-center">
              <span className="block font-sans text-[10px] text-slate-400">Rücken</span>
              {backSets} Sätze
            </div>
            <div className="text-center">
              <span className="block font-sans text-[10px] text-slate-400">Schulter</span>
              {shoulderSets} Sätze
            </div>
            <div className="text-center">
              <span className="block font-sans text-[10px] text-slate-400">Arme</span>
              {armSets} Sätze
            </div>
          </div>
        </div>
      </div>

      <div className={`${bgCard} space-y-4 rounded-3xl border p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
              Hypertrophie-Volumen (Woche)
            </h3>
            <p className={`text-xs font-semibold ${textTitle} mt-0.5`}>
              Optimaler Bereich: 10–20 harte Sätze / Muskelgruppe
            </p>
          </div>
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${badgeGreen}`}>
            MAV Matrix
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { name: "Brust", count: chestSets },
            { name: "Rücken", count: backSets },
            { name: "Schultern", count: shoulderSets },
            { name: "Arme", count: armSets }
          ].map((m, i) => {
            const isOptimal = m.count >= 10 && m.count <= 20;
            const isLow = m.count < 10;
            return (
              <div key={i} className={`rounded-2xl border p-3 ${bgItem} space-y-2`}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={textTitle}>{m.name}</span>
                  <span
                    className={`py-0.2 rounded px-1.5 font-mono text-[10px] ${isOptimal ? badgeGreen : isLow ? badgeBlue : "bg-rose-500/20 text-rose-400"}`}
                  >
                    {isOptimal ? "Optimal" : isLow ? "Steigern" : "Deload"}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`font-mono text-2xl font-black ${textTitle}`}>{m.count}</span>
                  <span className={`text-[10px] font-bold ${textSub}`}>/ 16 Sätze</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className={`h-full transition-all duration-500 ${isOptimal ? "bg-[#5B8C5A]" : isLow ? "bg-[#005377]" : "bg-rose-500"}`}
                    style={{ width: `${Math.min(100, (m.count / 20) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div
            className={`${bgCard} space-y-5 rounded-3xl border bg-gradient-to-br p-6 ${isDarkMode ? "from-[#0A84FF]/10 via-transparent to-transparent" : "from-[#0A84FF]/5 via-transparent to-transparent"}`}
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider text-[#0A84FF] uppercase">
                    MCI Total Strength Index
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeGreen}`}>
                    All-Time Entwicklung
                  </span>
                </div>
                <h3 className={`text-lg font-extrabold ${textTitle} mt-0.5`}>
                  Gesamtkraft & Hypertrophie-Level
                </h3>
                <p className={`text-xs ${textSub}`}>
                  Kombinierter 1RM-Score über alle Hauptverbundübungen
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-black/5 bg-black/5 p-3 dark:border-white/5 dark:bg-white/5">
                <div>
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase ${textSub} block`}
                  >
                    Gesamt-Score
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-2xl font-black text-[#0A84FF]">
                      {currentCompositeScore}
                    </span>
                    <span className={`text-xs font-bold ${textSub}`}>kg</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-black/10 dark:bg-white/10" />
                <div>
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase ${textSub} block`}
                  >
                    All-Time Zuwachs
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-2xl font-black text-emerald-500">
                      +{totalCompositeGainKg}
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-500">
                      ({totalCompositeGainPercent}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[220px] w-full pt-1">
              {globalStrengthHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={globalStrengthHistory}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorGlobalScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#32D74B" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#32D74B" stopOpacity={0} />
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
                      domain={["dataMin - 10", "dataMax + 10"]}
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
                              className={`${bgCard} space-y-1 rounded-xl border p-3 text-xs shadow-xl`}
                            >
                              <div className="font-bold text-slate-400">{data.rawDatum}</div>
                              <div className="text-sm font-extrabold text-emerald-500">
                                Composite Score: {data.compositeScore} kg
                              </div>
                              <div className="text-slate-400">
                                Erfasste Hauptübungen: {data.trackedCompounds}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="compositeScore"
                      stroke="#32D74B"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorGlobalScore)"
                      dot={{ r: 4, strokeWidth: 2, fill: isDarkMode ? "#100A0B" : "#FFFFFF" }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-500/20">
                  <span className={`text-xs ${textSub}`}>
                    Noch nicht genügend Daten für Gesamtscore.
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2 border-t border-black/5 pt-2 dark:border-white/5">
              <div className={`text-[10px] font-bold ${textSub} tracking-wider uppercase`}>
                Kraftbalance nach Muskelgruppen (1RM Peak)
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className={`rounded-xl border p-2.5 ${bgItem}`}>
                  <span className="block font-sans text-[10px] font-bold text-slate-400">
                    Push (Brust)
                  </span>
                  <span className={`font-mono text-sm font-black ${textTitle}`}>{chest1RM} kg</span>
                </div>
                <div className={`rounded-xl border p-2.5 ${bgItem}`}>
                  <span className="block font-sans text-[10px] font-bold text-slate-400">
                    Pull (Rücken)
                  </span>
                  <span className={`font-mono text-sm font-black ${textTitle}`}>{back1RM} kg</span>
                </div>
                <div className={`rounded-xl border p-2.5 ${bgItem}`}>
                  <span className="block font-sans text-[10px] font-bold text-slate-400">
                    Schultern
                  </span>
                  <span className={`font-mono text-sm font-black ${textTitle}`}>
                    {shoulder1RM} kg
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className={`${bgCard} space-y-4 rounded-3xl border p-6`}>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                  1RM Progression (Maximal-Kraftkurve)
                </h3>
                <p className={`text-sm font-bold ${textTitle} mt-0.5`}>{activeExerciseName}</p>
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
            <div className="h-[240px] w-full pt-2">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={isDarkMode ? "#82CBEE" : "#005377"}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor={isDarkMode ? "#82CBEE" : "#005377"}
                          stopOpacity={0}
                        />
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
                              className={`${bgCard} space-y-1 rounded-xl border p-3 text-xs shadow-xl`}
                            >
                              <div className="font-bold text-slate-400">{data.rawDatum}</div>
                              <div className="text-sm font-extrabold text-[#0A84FF]">
                                1RM: {data.oneRepMax} kg
                              </div>
                              <div className="text-slate-400">
                                Top-Satz: {data.bestWeight} kg × {data.bestReps} WDH
                              </div>
                              <div className="text-slate-400">
                                Workload: {data.volumen} kg ({data.setCount} Sätze)
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
                      stroke={isDarkMode ? "#82CBEE" : "#005377"}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#color1RM)"
                      dot={{ r: 4, strokeWidth: 2, fill: isDarkMode ? "#100A0B" : "#FFFFFF" }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-500/20 px-4 text-center">
                  <span className={`text-xs font-medium ${textSub}`}>
                    Keine Sessions für diese Übung gefunden.
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={`${bgCard} space-y-4 rounded-3xl border p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                  Workout Workload (Gesamtgewicht pro Training)
                </h3>
                <p className={`text-xs font-semibold ${textTitle} mt-0.5`}>
                  Volumen-Reiz für Muskelwachstum
                </p>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${badgeGreen}`}>
                Tonnage (kg)
              </span>
            </div>
            <div className="h-[160px] w-full">
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
                      contentStyle={{
                        backgroundColor: isDarkMode ? "#1E1418" : "#fff",
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
                      }}
                    />
                    <Bar
                      dataKey="volumen"
                      fill={isDarkMode ? "#7DB47C" : "#5B8C5A"}
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

        <div className="space-y-6 lg:col-span-4">
          <div className={`${bgCard} space-y-4 rounded-3xl border p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xs font-bold tracking-wider uppercase ${textSub}`}>
                  Trainings-Historie
                </h3>
                <p className={`text-xs font-semibold ${textTitle} mt-0.5`}>
                  Absolvierte Sessions ({workoutHistory.length})
                </p>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${badgeBlue}`}>
                Log
              </span>
            </div>
            <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
              {workoutHistory.length === 0 ? (
                <div className={`p-6 text-center text-xs ${textSub}`}>
                  Noch keine Workouts protokolliert.
                </div>
              ) : (
                workoutHistory.map((w: any, idx: number) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 ${bgItem} space-y-2.5 transition-all hover:border-[#0A84FF]/40`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-lg px-2 py-0.5 font-mono text-xs font-black ${w.type === "PUSH" ? "border border-[#0A84FF]/30 bg-[#0A84FF]/20 text-[#0A84FF]" : w.type === "PULL" ? "border border-[#32D74B]/30 bg-[#32D74B]/20 text-[#32D74B]" : badgeBlue}`}
                        >
                          {w.type}
                        </span>
                        <span className={`text-xs font-bold ${textTitle}`}>{w.formattedDate}</span>
                      </div>
                      <span className={`font-mono text-xs font-bold ${accentBlue}`}>
                        {w.totalVolume} kg
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                      <span>{w.totalSets} Sätze absolviert</span>
                      <span>{w.uebungen.length} Übungen</span>
                    </div>
                    <div className="flex flex-wrap gap-1 border-t border-black/5 pt-1 dark:border-white/5">
                      {w.uebungen.map((uebung: string, uIdx: number) => (
                        <span
                          key={uIdx}
                          className="max-w-[150px] truncate rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-medium dark:bg-white/5"
                        >
                          {uebung}
                        </span>
                      ))}
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
