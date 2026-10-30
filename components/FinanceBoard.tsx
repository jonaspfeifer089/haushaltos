import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Wallet, Plus, Trash2, Scale } from "lucide-react";
import { supabase } from "../lib/supabaseClient"; // <-- Dein Supabase Client

export interface Expense {
  id: string;
  description: string;
  amount: number;
  payer: "Lena" | "Jonas";
  date: string;
}

export function FinanceBoard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState<"Lena" | "Jonas">("Jonas");

  // 1. Daten beim Laden aus Supabase holen
  useEffect(() => {
    const fetchAusgaben = async () => {
      const { data, error } = await supabase
        .from("ausgaben")
        .select("*")
        .order("date", { ascending: false });

      if (data) {
        setExpenses(data);
      }
    };
    fetchAusgaben();
  }, []);

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const lenaPaid = expenses
    .filter((e) => e.payer === "Lena")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const jonasPaid = expenses
    .filter((e) => e.payer === "Jonas")
    .reduce((sum, exp) => sum + exp.amount, 0);

  const balance = lenaPaid - jonasPaid;
  const owesAmount = Math.abs(balance) / 2;

  const formatEuro = (num: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(num);

  // 2. Neue Ausgabe in Supabase speichern
  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || isNaN(Number(amount.replace(",", ".")))) return;

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description: description.trim(),
      amount: parseFloat(amount.replace(",", ".")),
      payer,
      date: new Date().toISOString()
    };

    // Sofort im UI anzeigen (Optimistic Update)
    setExpenses([newExpense, ...expenses]);
    setDescription("");
    setAmount("");

    // In DB schreiben
    await supabase.from("ausgaben").insert([newExpense]);
  };

  // 3. Ausgabe aus Supabase löschen
  const deleteExpense = async (id: string) => {
    setExpenses(expenses.filter((exp) => exp.id !== id));
    await supabase.from("ausgaben").delete().eq("id", id);
  };

  return (
    <div className="min-h-[80vh] w-full rounded-3xl bg-[#081710] p-4 text-[#F8F5EE] sm:p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="font-serif text-2xl tracking-wide text-[#F7D6D9] italic sm:text-3xl">
            Haushaltsbuch
          </h2>
          <p className="mt-1 text-xs tracking-wider text-white/50 uppercase">
            Gemeinsame Ausgaben & Abrechnung
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#F7D6D9]/30 bg-[#11241A]">
          <Wallet className="h-5 w-5 text-[#F7D6D9]" />
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
              Aktuelle Abrechnung
            </h3>

            <div className="relative z-10">
              {balance === 0 ? (
                <div className="font-serif text-xl text-[#F8F5EE]">
                  Alles ist perfekt ausgeglichen.
                </div>
              ) : (
                <>
                  <div className="mb-1 text-sm text-white/70">
                    {balance > 0 ? "Jonas schuldet Lena:" : "Lena schuldet Jonas:"}
                  </div>
                  <div className="font-serif text-4xl text-[#F7D6D9] italic">
                    {formatEuro(owesAmount)}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-[#11241A]/80 p-4 backdrop-blur-sm">
              <p className="mb-1 text-[10px] tracking-widest text-white/50 uppercase">Gesamt</p>
              <p className="text-lg font-medium">{formatEuro(total)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#11241A]/80 p-4 backdrop-blur-sm">
              <p className="mb-1 text-[10px] tracking-widest text-white/50 uppercase">Pro Person</p>
              <p className="text-lg font-medium">{formatEuro(total / 2)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#11241A]/80 p-4 backdrop-blur-sm">
              <p className="mb-1 text-[10px] tracking-widest text-white/50 uppercase">
                Lena hat gezahlt
              </p>
              <p className="text-lg font-medium text-[#F7D6D9]">{formatEuro(lenaPaid)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#11241A]/80 p-4 backdrop-blur-sm">
              <p className="mb-1 text-[10px] tracking-widest text-white/50 uppercase">
                Jonas hat gezahlt
              </p>
              <p className="text-lg font-medium text-[#D4AF37]">{formatEuro(jonasPaid)}</p>
            </div>
          </div>
        </div>

        {/* RECHTE SPALTE: EINGABE & LISTE */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <form
            onSubmit={addExpense}
            className="flex flex-col items-end gap-4 rounded-2xl border border-white/10 bg-[#11241A]/80 p-5 backdrop-blur-sm sm:flex-row"
          >
            <div className="w-full sm:w-2/5">
              <label className="mb-1.5 block text-[10px] tracking-widest text-white/50 uppercase">
                Was?
              </label>
              <input
                type="text"
                placeholder="z.B. Aldi Einkauf"
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
                Wer?
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
          </form>

          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#11241A]/40 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-widest text-white/50 uppercase">
              <Receipt className="h-4 w-4" /> Verlauf
            </h3>

            <div className="flex-1 space-y-2 overflow-y-auto pr-2">
              <AnimatePresence>
                {expenses.map((expense) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-3.5 transition-colors hover:bg-black/30"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          expense.payer === "Lena"
                            ? "bg-[#F7D6D9]/20 text-[#F7D6D9]"
                            : "bg-[#D4AF37]/20 text-[#D4AF37]"
                        }`}
                      >
                        {expense.payer.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/90">{expense.description}</p>
                        <p className="mt-0.5 text-[10px] text-white/40">
                          {new Date(expense.date).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm">{formatEuro(expense.amount)}</span>
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="rounded-md p-1.5 text-white/30 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-400/10 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {expenses.length === 0 && (
                  <div className="py-10 text-center text-sm text-white/30">
                    Noch keine Ausgaben in diesem Monat.
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
