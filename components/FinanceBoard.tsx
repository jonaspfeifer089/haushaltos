import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  Wallet,
  Plus,
  Trash2,
  Scale,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  payer: "Lena" | "Jonas";
  created: string;
  is_settlement: boolean;
}

export function FinanceBoard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState<"Lena" | "Jonas">("Jonas");
  const [isSettlement, setIsSettlement] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchAusgaben = async () => {
      // Wir lassen .order() in der Datenbank-Abfrage weg, damit es nicht crasht, falls die Spalte anders heißt
      const { data, error } = await supabase.from("ausgaben").select("*");

      if (error) {
        console.error("Fehler beim Laden aus Supabase:", error.message);
        return;
      }

      if (data) {
        // Wir sortieren im Frontend. Das fängt ab, ob das Feld 'created', 'date' oder 'created_at' heißt.
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(
            a.created || (a as any).date || (a as any).created_at || 0
          ).getTime();
          const dateB = new Date(
            b.created || (b as any).date || (b as any).created_at || 0
          ).getTime();
          return dateB - dateA;
        });
        setExpenses(sortedData);
      }
    };
    fetchAusgaben();
  }, []);

  // Monats-Navigation
  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthName = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(
    currentDate
  );

  // Daten auf aktuell ausgewählten Monat filtern (mit Fallback für alte Einträge)
  const currentMonthExpenses = expenses.filter((exp) => {
    const timestamp = exp.created || (exp as any).date || (exp as any).created_at;

    // Wenn gar kein Datum gefunden wird, zeigen wir den Eintrag zur Sicherheit immer an
    if (!timestamp) return true;

    const d = new Date(timestamp);
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  });

  // Splitwise-Mathematik
  const sharedExpenses = currentMonthExpenses.filter((e) => !e.is_settlement);
  const settlements = currentMonthExpenses.filter((e) => e.is_settlement);

  const totalShared = sharedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const targetPerPerson = totalShared / 2;

  const lenaPaidShared = sharedExpenses
    .filter((e) => e.payer === "Lena")
    .reduce((sum, e) => sum + e.amount, 0);
  const jonasPaidShared = sharedExpenses
    .filter((e) => e.payer === "Jonas")
    .reduce((sum, e) => sum + e.amount, 0);

  const lenaSettlementsSent = settlements
    .filter((e) => e.payer === "Lena")
    .reduce((sum, e) => sum + e.amount, 0);
  const jonasSettlementsSent = settlements
    .filter((e) => e.payer === "Jonas")
    .reduce((sum, e) => sum + e.amount, 0);

  const lenaActualPaid = lenaPaidShared + lenaSettlementsSent - jonasSettlementsSent;
  const jonasActualPaid = jonasPaidShared + jonasSettlementsSent - lenaSettlementsSent;

  const jonasOwes = targetPerPerson - jonasActualPaid; // Wenn > 0, schuldet Jonas Geld. Wenn < 0, schuldet Lena ihm was.

  const formatEuro = (num: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Math.abs(num));

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || isNaN(Number(amount.replace(",", ".")))) return;

    // Setze das Datum für neue Einträge zwingend in den aktuell ausgewählten Monat,
    // damit man auch rückwirkend was für den letzten Monat eintragen kann
    const entryDate = new Date();
    entryDate.setFullYear(currentDate.getFullYear(), currentDate.getMonth());

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description: description.trim(),
      amount: parseFloat(amount.replace(",", ".")),
      payer,
      created: entryDate.toISOString(),
      is_settlement: isSettlement
    };

    setExpenses([newExpense, ...expenses]);
    setDescription("");
    setAmount("");
    setIsSettlement(false);

    const { error } = await supabase.from("ausgaben").insert([newExpense]);
    if (error) alert(`Fehler beim Speichern: ${error.message}`);
  };

  const deleteExpense = async (id: string) => {
    setExpenses(expenses.filter((exp) => exp.id !== id));
    await supabase.from("ausgaben").delete().eq("id", id);
  };

  return (
    <div className="min-h-[80vh] w-full rounded-3xl bg-[#081710] p-4 text-[#F8F5EE] sm:p-6">
      {/* Header mit Monatsnavigation */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-serif text-2xl tracking-wide text-[#F7D6D9] italic sm:text-3xl">
            Haushaltsbuch
          </h2>
          <p className="mt-1 text-xs tracking-wider text-white/50 uppercase">
            Gemeinsame Ausgaben & Abrechnung
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-full border border-[#F7D6D9]/20 bg-[#11241A] px-4 py-2">
          <button onClick={prevMonth} className="p-1 transition-colors hover:text-[#F7D6D9]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[120px] text-center text-sm font-bold">{monthName}</span>
          <button onClick={nextMonth} className="p-1 transition-colors hover:text-[#F7D6D9]">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LINKE SPALTE: DASHBOARD & ABRECHNUNG */}
        <div className="space-y-6 lg:col-span-1">
          <div className="relative overflow-hidden rounded-2xl border border-[#F7D6D9]/30 bg-gradient-to-br from-[#1B3627] to-[#11241A] p-6 shadow-[0_0_30px_rgba(247,214,217,0.05)]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Scale className="h-24 w-24" />
            </div>
            <h3 className="mb-4 text-xs font-bold tracking-widest text-[#F7D6D9]/80 uppercase">
              Status im {monthName.split(" ")[0]}
            </h3>

            <div className="relative z-10">
              {Math.abs(jonasOwes) < 0.01 ? (
                <div className="font-serif text-xl text-[#F8F5EE]">
                  Alles ist perfekt ausgeglichen. 🎉
                </div>
              ) : (
                <>
                  <div className="mb-1 text-sm text-white/70">
                    {jonasOwes > 0 ? "Jonas schuldet Lena:" : "Lena schuldet Jonas:"}
                  </div>
                  <div className="font-serif text-4xl text-[#F7D6D9] italic">
                    {formatEuro(jonasOwes)}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-[#11241A]/80 p-4 backdrop-blur-sm">
              <p className="mb-1 text-[10px] tracking-widest text-white/50 uppercase">
                Gesamt {monthName.split(" ")[0]}
              </p>
              <p className="text-lg font-medium">{formatEuro(totalShared)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#11241A]/80 p-4 backdrop-blur-sm">
              <p className="mb-1 text-[10px] tracking-widest text-white/50 uppercase">Pro Person</p>
              <p className="text-lg font-medium">{formatEuro(targetPerPerson)}</p>
            </div>
          </div>
        </div>

        {/* RECHTE SPALTE: EINGABE & LISTE */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <form
            onSubmit={addExpense}
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#11241A]/80 p-5 backdrop-blur-sm"
          >
            <div className="flex flex-col items-end gap-4 sm:flex-row">
              <div className="w-full sm:w-2/5">
                <label className="mb-1.5 block text-[10px] tracking-widest text-white/50 uppercase">
                  Was?
                </label>
                <input
                  type="text"
                  placeholder={isSettlement ? "z.B. Paypal Überweisung" : "z.B. Aldi Einkauf"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm transition-colors focus:border-[#F7D6D9]/50 focus:outline-none"
                />
              </div>
              <div className="w-full sm:w-1/4">
                <label className="mb-1.5 block text-[10px] tracking-widest text-white/50 uppercase">
                  Wie viel?
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/20 py-2.5 pr-8 pl-4 text-sm transition-colors focus:border-[#F7D6D9]/50 focus:outline-none"
                  />
                  <span className="absolute top-2.5 right-3 text-white/40">€</span>
                </div>
              </div>
              <div className="w-full sm:w-1/4">
                <label className="mb-1.5 block text-[10px] tracking-widest text-white/50 uppercase">
                  Wer zahlt?
                </label>
                <select
                  value={payer}
                  onChange={(e) => setPayer(e.target.value as "Lena" | "Jonas")}
                  className="w-full appearance-none rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm transition-colors focus:border-[#F7D6D9]/50 focus:outline-none"
                >
                  <option value="Jonas">Jonas</option>
                  <option value="Lena">Lena</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={!description || !amount}
                className="flex w-full items-center justify-center rounded-lg bg-[#F7D6D9] px-5 py-2.5 font-medium text-[#11241A] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <label className="mt-1 flex w-max cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isSettlement}
                onChange={(e) => setIsSettlement(e.target.checked)}
                className="rounded border-white/10 bg-black/20 text-[#F7D6D9] focus:ring-[#F7D6D9] focus:ring-offset-0"
              />
              <span className="text-[10px] tracking-widest text-white/60 uppercase">
                Als Ausgleichszahlung markieren (Geld wurde gesendet)
              </span>
            </label>
          </form>

          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#11241A]/40 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-widest text-white/50 uppercase">
              <Receipt className="h-4 w-4" /> Verlauf ({monthName})
            </h3>

            <div className="flex-1 space-y-2 overflow-y-auto pr-2">
              <AnimatePresence>
                {currentMonthExpenses.map((expense) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group flex items-center justify-between rounded-xl border bg-black/20 p-3.5 transition-colors hover:bg-black/30 ${
                      expense.is_settlement ? "border-emerald-500/20" : "border-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          expense.is_settlement
                            ? "bg-emerald-500/20 text-emerald-400"
                            : expense.payer === "Lena"
                              ? "bg-[#F7D6D9]/20 text-[#F7D6D9]"
                              : "bg-[#D4AF37]/20 text-[#D4AF37]"
                        }`}
                      >
                        {expense.is_settlement ? (
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        ) : (
                          expense.payer.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/90">
                          {expense.description}
                          {expense.is_settlement && (
                            <span className="ml-2 text-[9px] tracking-widest text-emerald-400 uppercase">
                              Ausgleich
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-[10px] text-white/40">
                          {new Date(expense.created).toLocaleDateString("de-DE")} von{" "}
                          {expense.payer}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`font-mono text-sm ${expense.is_settlement ? "text-emerald-400" : ""}`}
                      >
                        {formatEuro(expense.amount)}
                      </span>
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="rounded-md p-1.5 text-white/30 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-400/10 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {currentMonthExpenses.length === 0 && (
                  <div className="py-10 text-center text-sm text-white/30">
                    Keine Einträge in diesem Monat.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
