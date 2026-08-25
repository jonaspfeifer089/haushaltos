import { useState, useEffect } from "react";
import { GymItem, PUSH_ROUTINE, PULL_ROUTINE } from "../types";
import { supabase } from "../lib/supabaseClient";

export function useWorkoutSession(activeUser: string, gymData: GymItem[], setGymData: any) {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isWorkoutMinimized, setIsWorkoutMinimized] = useState(false);
  const [workoutDauer, setWorkoutDauer] = useState(0);
  const [activeExercises, setActiveExercises] = useState<any[]>([]);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState("");

  useEffect(() => {
    let interval: any;
    if (isWorkoutActive) interval = setInterval(() => setWorkoutDauer((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

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
      } catch (e) {}
    }
  }, []);

  const startWorkout = (type: "push" | "pull" | "empty") => {
    setWorkoutDauer(0);
    const exerciseNames =
      type === "push"
        ? PUSH_ROUTINE
        : type === "pull"
          ? PULL_ROUTINE
          : ["Bankdrücken (Langhantel)"];
    const builtExercises = exerciseNames.map((name) => {
      const previousSets = gymData
        .filter((g) => g.username === activeUser && g.uebung.toLowerCase() === name.toLowerCase())
        .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
      const sets = [1, 2, 3].map((setNum) => {
        const lastMatchingSet = previousSets.find((s) => s.setnum === setNum) || previousSets[0];
        const prevText = lastMatchingSet
          ? `${lastMatchingSet.gewicht}kg x ${lastMatchingSet.reps}`
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
  };

  const addSetToExercise = (exerciseId: string) => {
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const nextSetNum = ex.sets.length + 1;
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id: crypto.randomUUID(),
              set: nextSetNum,
              prev: ex.sets[ex.sets.length - 1]?.prev || "-",
              kg: "",
              reps: "",
              done: false
            }
          ]
        };
      })
    );
  };

  const removeSetFromExercise = (exerciseId: string, setId: string) => {
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
    const previousSets = gymData
      .filter((g) => g.username === activeUser && g.uebung.toLowerCase() === name.toLowerCase())
      .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
    const sets = [1, 2, 3].map((setNum) => {
      const lastMatchingSet = previousSets.find((s) => s.setnum === setNum) || previousSets[0];
      return {
        id: crypto.randomUUID(),
        set: setNum,
        prev: lastMatchingSet ? `${lastMatchingSet.gewicht}kg x ${lastMatchingSet.reps}` : "-",
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
        return {
          ...ex,
          sets: ex.sets.map((s: any) => (s.id === setId ? { ...s, [field]: value } : s))
        };
      })
    );
  };

  const toggleSetDone = (exerciseId: string, setId: string) => {
    setActiveExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s: any) => (s.id === setId ? { ...s, done: !s.done } : s))
        };
      })
    );
  };

  const endWorkout = async () => {
    const today = new Date().toISOString().split("T")[0];
    const completedSets: GymItem[] = [];
    activeExercises.forEach((ex) => {
      ex.sets
        .filter((s: any) => s.done && s.kg && s.reps)
        .forEach((s: any) => {
          completedSets.push({
            id: crypto.randomUUID(),
            datum: today,
            uebung: ex.name,
            gewicht: parseFloat(s.kg),
            reps: parseInt(s.reps, 10),
            setnum: s.set,
            username: activeUser
          });
        });
    });

    if (completedSets.length === 0) {
      setIsWorkoutActive(false);
      return;
    }

    setGymData((prev: GymItem[]) => [...prev, ...completedSets]);
    setIsWorkoutActive(false);
    setIsWorkoutMinimized(false);
    localStorage.removeItem("haushalt_active_workout");

    for (const set of completedSets) {
      await supabase.from("gym").insert(set);
    }

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
    });
  };

  let currentWorkoutVolume = 0;
  let currentWorkoutSets = 0;
  activeExercises.forEach((ex) => {
    ex.sets.forEach((s: any) => {
      if (s.done && s.kg && s.reps) {
        currentWorkoutVolume += parseFloat(s.kg) * parseInt(s.reps, 10);
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
