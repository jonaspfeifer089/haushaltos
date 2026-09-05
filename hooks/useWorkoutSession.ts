import { useState, useEffect, useRef, useCallback } from "react";
import { GymItem, PUSH_ROUTINE, PULL_ROUTINE } from "../types";
import { supabase } from "../lib/supabaseClient";
import { getPreviousSetsForExercise } from "../lib/mciEngine";
import { toast } from "sonner";

export function useWorkoutSession(activeUser: string, gymData: GymItem[], setGymData: any) {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isWorkoutMinimized, setIsWorkoutMinimized] = useState(false);
  const [workoutDauer, setWorkoutDauer] = useState(0);
  const [activeExercises, setActiveExercises] = useState<any[]>([]);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState("");

  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Workout-Timer
  useEffect(() => {
    let interval: any;
    if (isWorkoutActive) {
      interval = setInterval(() => setWorkoutDauer((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  // Lokale Persistenz im Browser für Refresh-Schutz
  useEffect(() => {
    if (isWorkoutActive) {
      localStorage.setItem(
        "haushalt_active_workout",
        JSON.stringify({ activeExercises, workoutDauer, isWorkoutActive, isWorkoutMinimized })
      );
    } else {
      localStorage.removeItem("haushalt_active_workout");
    }
  }, [isWorkoutActive, isWorkoutMinimized, activeExercises, workoutDauer]);

  // Session beim ersten Rendern wiederherstellen
  useEffect(() => {
    const saved = localStorage.getItem("haushalt_active_workout");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isWorkoutActive && parsed.activeExercises?.length > 0) {
          setActiveExercises(parsed.activeExercises);
          setWorkoutDauer(parsed.workoutDauer || 0);
          setIsWorkoutActive(true);
          setIsWorkoutMinimized(parsed.isWorkoutMinimized ?? true);
        }
      } catch (e) {
        console.error("Fehler beim Laden des Workout-States:", e);
      }
    }
  }, []);

  // Live-Sync in Supabase (Debounced)
  const syncSetToSupabase = useCallback(
    (exerciseName: string, setObj: any) => {
      const kgVal = parseFloat(setObj.kg);
      const repsVal = parseInt(setObj.reps, 10);

      // Nur synchronisieren, wenn mindestens ein numerischer Wert vorliegt
      if (isNaN(kgVal) && isNaN(repsVal)) return;

      const today = new Date().toISOString().split("T")[0];

      if (saveTimeoutRef.current[setObj.id]) {
        clearTimeout(saveTimeoutRef.current[setObj.id]);
      }

      saveTimeoutRef.current[setObj.id] = setTimeout(async () => {
        const payload: GymItem = {
          id: setObj.id,
          datum: today,
          uebung: exerciseName,
          setnum: setObj.set,
          gewicht: isNaN(kgVal) ? 0 : kgVal,
          reps: isNaN(repsVal) ? 0 : repsVal,
          username: activeUser
        };

        try {
          const { error } = await supabase.from("gym").upsert(payload, { onConflict: "id" });
          if (!error) {
            setGymData((prev: GymItem[]) => {
              const idx = prev.findIndex((item) => item.id === payload.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = payload;
                return next;
              }
              return [...prev, payload];
            });
          } else {
            console.error("Supabase Live-Save Fehler:", error);
          }
        } catch (err) {
          console.error("Netzwerkfehler beim Auto-Save:", err);
        }
      }, 500);
    },
    [activeUser, setGymData]
  );

  const startWorkout = (type: "push" | "pull" | "empty") => {
    setWorkoutDauer(0);
    const exerciseNames =
      type === "push"
        ? PUSH_ROUTINE
        : type === "pull"
          ? PULL_ROUTINE
          : ["Bankdrücken (Langhantel)"];

    const builtExercises = exerciseNames.map((name) => {
      const userGymSets = gymData.filter((g) => g.username === activeUser);
      const previousSets = getPreviousSetsForExercise(name, userGymSets);

      const sets = [1, 2, 3].map((setNum) => {
        const lastMatchingSet =
          previousSets.find((s) => s.setnum === setNum) || previousSets[setNum - 1];
        const prevText = lastMatchingSet
          ? `${lastMatchingSet.gewicht}kg × ${lastMatchingSet.reps}`
          : "-";
        return {
          id: crypto.randomUUID(),
          set: setNum,
          prev: prevText,
          kg: "",
          reps: "",
          done: false
        };
      });
      return { id: crypto.randomUUID(), name, targetRange: "8-12", sets };
    });

    setActiveExercises(builtExercises);
    setIsWorkoutActive(true);
    setIsWorkoutMinimized(false);
  };

  const addSetToExercise = (exerciseId: string) => {
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const nextSetNum = ex.sets.length + 1;
        const userGymSets = gymData.filter((g) => g.username === activeUser);
        const previousSets = getPreviousSetsForExercise(ex.name, userGymSets);
        const lastMatchingSet = previousSets.find((s) => s.setnum === nextSetNum);
        const prevText = lastMatchingSet
          ? `${lastMatchingSet.gewicht}kg × ${lastMatchingSet.reps}`
          : ex.sets[ex.sets.length - 1]?.prev || "-";

        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id: crypto.randomUUID(),
              set: nextSetNum,
              prev: prevText,
              kg: "",
              reps: "",
              done: false
            }
          ]
        };
      })
    );
  };

  const removeSetFromExercise = async (exerciseId: string, setId: string) => {
    // Falls der Satz schon in Supabase war, dort auch löschen
    await supabase.from("gym").delete().eq("id", setId);
    setGymData((prev: GymItem[]) => prev.filter((item) => item.id !== setId));

    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const filtered = ex.sets.filter((s: any) => s.id !== setId);
        const renumbered = filtered.map((s: any, idx: number) => ({ ...s, set: idx + 1 }));
        return { ...ex, sets: renumbered };
      })
    );
  };

  const removeExercise = (exerciseId: string) => {
    setActiveExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  };

  const addExerciseToActiveWorkout = (name: string) => {
    if (!name.trim()) return;
    const userGymSets = gymData.filter((g) => g.username === activeUser);
    const previousSets = getPreviousSetsForExercise(name.trim(), userGymSets);

    const sets = [1, 2, 3].map((setNum) => {
      const lastMatchingSet =
        previousSets.find((s) => s.setnum === setNum) || previousSets[setNum - 1];
      return {
        id: crypto.randomUUID(),
        set: setNum,
        prev: lastMatchingSet ? `${lastMatchingSet.gewicht}kg × ${lastMatchingSet.reps}` : "-",
        kg: "",
        reps: "",
        done: false
      };
    });

    setActiveExercises((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: name.trim(), targetRange: "8-12", sets }
    ]);
    setCustomExerciseName("");
    setShowAddExerciseModal(false);
  };

  const updateTargetRange = (exerciseId: string, range: string) => {
    setActiveExercises((prev) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, targetRange: range } : ex))
    );
  };

  const updateSet = (exerciseId: string, setId: string, field: "kg" | "reps", value: string) => {
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const nextSets = ex.sets.map((s: any) => {
          if (s.id !== setId) return s;
          const updated = { ...s, [field]: value };
          // Live synchronisieren
          syncSetToSupabase(ex.name, updated);
          return updated;
        });
        return { ...ex, sets: nextSets };
      })
    );
  };

  const toggleSetDone = (exerciseId: string, setId: string) => {
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const nextSets = ex.sets.map((s: any) => {
          if (s.id !== setId) return s;
          const updated = { ...s, done: !s.done };
          // Wenn angehakt wird und Werte da sind, sofort flushen
          syncSetToSupabase(ex.name, updated);
          return updated;
        });
        return { ...ex, sets: nextSets };
      })
    );
  };

  const endWorkout = async () => {
    const today = new Date().toISOString().split("T")[0];
    const completedSets: GymItem[] = [];

    activeExercises.forEach((ex) => {
      ex.sets.forEach((s: any) => {
        const kgVal = parseFloat(s.kg);
        const repsVal = parseInt(s.reps, 10);
        // Speichern wenn angehakt ODER wenn gültige Werte eingetragen sind
        if ((s.done || (!isNaN(kgVal) && !isNaN(repsVal))) && repsVal > 0) {
          completedSets.push({
            id: s.id,
            datum: today,
            uebung: ex.name,
            gewicht: isNaN(kgVal) ? 0 : kgVal,
            reps: repsVal,
            setnum: s.set,
            username: activeUser
          });
        }
      });
    });

    if (completedSets.length === 0) {
      toast.info("Keine ausgefüllten Sätze vorhanden. Workout beendet.");
      setIsWorkoutActive(false);
      localStorage.removeItem("haushalt_active_workout");
      return;
    }

    // Finale Sicherung aller Sätze in Supabase
    for (const set of completedSets) {
      await supabase.from("gym").upsert(set, { onConflict: "id" });
    }

    setGymData((prev: GymItem[]) => {
      const remaining = prev.filter((p) => !completedSets.some((c) => c.id === p.id));
      return [...remaining, ...completedSets];
    });

    setIsWorkoutActive(false);
    setIsWorkoutMinimized(false);
    setActiveExercises([]);
    localStorage.removeItem("haushalt_active_workout");
    toast.success(`Workout mit ${completedSets.length} Sätzen erfolgreich gesichert! 🏋️‍♂️`);

    // Notification versenden
    const totalVolume = completedSets.reduce((sum, s) => sum + s.gewicht * s.reps, 0);
    const appUrl =
      typeof window !== "undefined" ? window.location.origin : "https://haushaltos.vercel.app";
    fetch("https://ntfy.sh/HaushaltLenaJonas", {
      method: "POST",
      body: `🔥 Workout abgeschlossen!\n🏋️ ${completedSets.length} Sätze | ${(totalVolume / 1000).toFixed(2)}t Tonnage\n🎯 Progressive Overload angewendet.`,
      headers: {
        Title: `Workout Beendet (${activeUser})`,
        Tags: "muscle,trophy",
        Actions: `view, App oeffnen, ${appUrl}`
      }
    }).catch(() => {});
  };

  let currentWorkoutVolume = 0;
  let currentWorkoutSets = 0;
  activeExercises.forEach((ex) => {
    ex.sets.forEach((s: any) => {
      const kgVal = parseFloat(s.kg);
      const repsVal = parseInt(s.reps, 10);
      if ((s.done || (!isNaN(kgVal) && !isNaN(repsVal))) && repsVal > 0) {
        currentWorkoutVolume += (isNaN(kgVal) ? 0 : kgVal) * repsVal;
        currentWorkoutSets++;
      }
    });
  });

  return {
    isWorkoutActive,
    setIsWorkoutActive,
    isWorkoutMinimized,
    setIsWorkoutMinimized,
    workoutDauer,
    activeExercises,
    showAddExerciseModal,
    setShowAddExerciseModal,
    customExerciseName,
    setCustomExerciseName,
    currentWorkoutVolume,
    currentWorkoutSets,
    startWorkout,
    addSetToExercise,
    removeSetFromExercise,
    removeExercise,
    addExerciseToActiveWorkout,
    updateTargetRange,
    updateSet,
    toggleSetDone,
    endWorkout
  };
}
