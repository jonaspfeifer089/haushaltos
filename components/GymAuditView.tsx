import React, { useState } from "react";
import { Activity, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface GymAuditViewProps {
  activeUser: string;
  gymData?: any[]; // <-- NEU: Daten direkt übergeben
  theme: any;
}

export function GymAuditView({ activeUser, gymData = [], theme }: GymAuditViewProps) {
  const { bgCard, bgItem, textTitle, textSub, buttonPrimary } = theme;
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const triggerAudit = async () => {
    setLoading(true);
    setReport(null);
    const toastId = toast.loading("Analysiere gesamte Trainingshistorie...");

    try {
      const res = await fetch("/api/gym-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: activeUser,
          clientData: gymData // <-- Schickt die bereits geladenen Sätze direkt mit!
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Fehler beim Audit.");
      }

      setReport(data.report);
      toast.success("Trainings-Audit abgeschlossen!", { id: toastId });
    } catch (e: any) {
      toast.error(e.message || "Audit fehlgeschlagen", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${bgCard} space-y-6 rounded-2xl border p-6 shadow-sm`}>
      <div className="flex flex-col justify-between gap-4 border-b border-black/5 pb-4 sm:flex-row sm:items-center dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#005377]/10 text-[#005377] dark:bg-[#82CBEE]/20 dark:text-[#82CBEE]">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold ${textTitle}`}>
              Wissenschaftliches Performance-Audit
            </h3>
            <p className={`text-xs ${textSub}`}>
              KI-gestützte Auswertung aller Tonnagen, Zyklen und Progression für {activeUser}
            </p>
          </div>
        </div>

        <button
          onClick={triggerAudit}
          disabled={loading}
          className={`flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold ${buttonPrimary} transition-all disabled:opacity-50`}
        >
          {loading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Berechne Biomechanik...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Audit jetzt anfordern</span>
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center space-y-3 py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-[#005377] dark:text-[#82CBEE]" />
          <p className={`font-mono text-xs ${textSub}`}>
            Durchleuchte progressive Overload-Kurven, Satzvolumina und Regeneration...
          </p>
        </div>
      )}

      {!loading && !report && (
        <div
          className={`rounded-xl border border-dashed border-black/10 p-8 text-center dark:border-white/10 ${bgItem}`}
        >
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-400" />
          <h4 className={`text-xs font-bold tracking-wider uppercase ${textTitle}`}>
            Kein aktiver Prüfbericht
          </h4>
          <p className={`mx-auto mt-1 max-w-md text-xs ${textSub}`}>
            Klicke auf den Button oben, um deine Trainingshistorie nach Progressionslücken,
            vernachlässigten Muskelketten und Plateaus scannen zu lassen.
          </p>
        </div>
      )}

      {!loading && report && (
        <div
          className={`space-y-4 rounded-xl border border-black/5 p-6 font-sans text-xs leading-relaxed ${bgItem} dark:border-white/5`}
        >
          <div className="flex items-center justify-between border-b border-black/10 pb-3 dark:border-white/10">
            <span className="font-mono text-[10px] font-bold tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
              ✓ Validierter Performance-Bericht
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Stand: {new Date().toLocaleDateString("de-DE")}
            </span>
          </div>
          <div className={`whitespace-pre-wrap ${textTitle} space-y-3`}>{report}</div>
        </div>
      )}
    </div>
  );
}
