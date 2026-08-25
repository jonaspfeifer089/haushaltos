import { GymItem } from "../types";

export function ermittleKategorie(artikel: string): string {
  const a = artikel.toLowerCase();
  if (
    /apfel|äpfel|banane|beere|salat|tomate|gurke|zitrone|kartoffel|zwiebel|avocado|paprika|obst|gemüse|birne/.test(
      a
    )
  )
    return "Obst & Gemüse";
  if (/milch|käse|joghurt|butter|quark|tofu|sahne|frischkäse|fleisch|wurst|ei|eier/.test(a))
    return "Kühlregal";
  if (/brot|toast|pasta|nudel|reis|mehl|zucker|öl|hafer|müsli|konserve|bohnen|kichererbsen/.test(a))
    return "Vorrat & Teigwaren";
  if (/wasser|saft|bier|wein|cola|limo|sprudel|tee|kaffee/.test(a)) return "Getränke";
  if (/spüli|papier|seife|shampoo|zahnpasta|putzmittel|waschmittel|müllbeutel|deo/.test(a))
    return "Drogerie & Haushalt";
  return "Sonstiges";
}

export const calculate1RM = (weight: number, reps: number) => Math.round(weight * (1 + reps / 30));

export function getNextSetTarget(
  exerciseName: string,
  setNum: number,
  previousSets: GymItem[],
  targetMin = 8,
  targetMax = 12
) {
  const lastSet = previousSets.find((s) => s.setnum === setNum) || previousSets[0];
  if (!lastSet) return { targetKg: 20, targetReps: targetMin, label: "Startgewicht" };

  const isCompound = /bank|rudern|drücken|lat|presse/i.test(exerciseName);
  const step = isCompound ? 2.5 : 1.25;

  if (lastSet.reps >= targetMax) {
    return {
      targetKg: lastSet.gewicht + step,
      targetReps: targetMin,
      label: `🔥 +${step}kg Overload!`
    };
  }
  return {
    targetKg: lastSet.gewicht,
    targetReps: lastSet.reps + 1,
    label: `⚡ +1 Rep (${lastSet.reps + 1} WDH)`
  };
}

export const formatDauer = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const calculateDaysLeft = (targetDateStr: string) =>
  Math.ceil((new Date(targetDateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
