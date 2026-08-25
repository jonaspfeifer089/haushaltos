import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Trash2 } from "lucide-react";
import { TodoItem, TODO_KATEGORIEN } from "../types";

interface TodoViewProps {
  todos: TodoItem[];
  activeUser: string;
  addTodo: (text: string, kat: string, zust: string) => Promise<void>;
  markTodoErledigt: (item: TodoItem, status: "Erledigt" | "Offen") => Promise<void>;
  deleteTodo: (item: TodoItem) => Promise<void>;
  springConfig: any;
  tapGesture: any;
  theme: any;
}

export function TodoView({
  todos,
  activeUser,
  addTodo,
  markTodoErledigt,
  deleteTodo,
  springConfig,
  tapGesture,
  theme
}: TodoViewProps) {
  const [neuesTodo, setNeuesTodo] = useState("");
  const [todoKategorie, setTodoKategorie] = useState<string>("Haushalt & Reparatur");
  const [todoZustaendig, setTodoZustaendig] = useState<string>("Beide");
  const [activeTodoFilter, setActiveTodoFilter] = useState<string>("Alle");

  const { bgCard, bgItem, bgInput, textTitle, textSub, badgeBlue, badgeGreen, buttonPrimary } =
    theme;

  const offeneTodos = todos.filter((t) => t.status !== "Erledigt");
  const filteredTodos =
    activeTodoFilter === "Alle"
      ? offeneTodos
      : offeneTodos.filter(
          (t) => t.kategorie === activeTodoFilter || t.zustaendig === activeTodoFilter
        );

  const handleAdd = async () => {
    if (!neuesTodo.trim()) return;
    await addTodo(neuesTodo.trim(), todoKategorie, todoZustaendig);
    setNeuesTodo("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>To-Do Liste</h2>
          <p className={`text-xs ${textSub}`}>Wischen: Links = Erledigen, Rechts = Löschen</p>
        </div>
        <span className={`rounded-full px-3 py-1 font-mono text-xs font-bold ${badgeBlue}`}>
          {offeneTodos.length} offen
        </span>
      </div>

      <div className={`${bgCard} space-y-4 rounded-2xl p-6`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <input
            type="text"
            placeholder="Neue Aufgabe..."
            value={neuesTodo}
            onChange={(e) => setNeuesTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className={`w-full sm:col-span-6 ${bgInput} rounded-xl border px-4 py-2.5 text-sm font-medium focus:outline-none`}
          />
          <select
            value={todoKategorie}
            onChange={(e) => setTodoKategorie(e.target.value)}
            className={`w-full sm:col-span-3 ${bgInput} rounded-xl border px-3 py-2.5 text-xs font-semibold focus:outline-none`}
          >
            {TODO_KATEGORIEN.map((kat) => (
              <option key={kat} value={kat}>
                {kat}
              </option>
            ))}
          </select>
          <select
            value={todoZustaendig}
            onChange={(e) => setTodoZustaendig(e.target.value)}
            className={`sm:col-span-1.5 w-full ${bgInput} rounded-xl border px-3 py-2.5 text-xs font-semibold focus:outline-none`}
          >
            <option value="Beide">Beide</option>
            <option value="Jonas">Jonas</option>
            <option value="Lena">Lena</option>
          </select>
          <motion.button
            whileTap={tapGesture}
            onClick={handleAdd}
            className={`sm:col-span-1.5 w-full px-4 py-2.5 ${buttonPrimary} flex items-center justify-center rounded-xl text-xs font-bold`}
          >
            Hinzufügen
          </motion.button>
        </div>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto pt-2 pb-1">
          {["Alle", ...TODO_KATEGORIEN, "Jonas", "Lena", "Beide"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveTodoFilter(filter)}
              className={`rounded-xl px-3 py-1 text-xs font-bold whitespace-nowrap transition-all ${activeTodoFilter === filter ? `${badgeBlue} shadow-sm` : `${bgItem} ${textSub}`}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className={`${bgCard} space-y-3 rounded-2xl p-6`}>
        {filteredTodos.map((todo) => (
          <div key={todo.id} className="relative overflow-hidden rounded-xl">
            <div className="absolute inset-0 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#49111C] via-[#251A1E] to-[#5B8C5A] px-4 text-white">
              <div className="flex items-center gap-1 text-xs font-bold text-rose-200">
                <Trash2 className="h-4 w-4" /> Löschen
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-200">
                Erledigt <Check className="h-4 w-4" />
              </div>
            </div>
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              whileTap={tapGesture}
              layout
              transition={springConfig}
              onDragEnd={(_, info) => {
                const isSwipeRight = info.offset.x > 80 || info.velocity.x > 500;
                const isSwipeLeft = info.offset.x < -80 || info.velocity.x < -500;
                if (isSwipeRight) deleteTodo(todo);
                else if (isSwipeLeft) markTodoErledigt(todo, "Erledigt");
              }}
              className={`relative z-10 flex justify-between rounded-xl border p-4 ${bgItem} ${bgCard} cursor-grab shadow-sm`}
            >
              <div>
                <span className={`text-sm font-semibold ${textTitle} block`}>{todo.aufgabe}</span>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${badgeBlue}`}>
                    {todo.kategorie}
                  </span>
                  <span className="text-[10px] font-bold opacity-70">👤 {todo.zustaendig}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => markTodoErledigt(todo, "Erledigt")}
                  className={`h-7 rounded-lg px-3 text-[11px] font-bold ${badgeGreen} flex items-center gap-1 hover:opacity-80`}
                >
                  <Check className="h-3.5 w-3.5" /> <span>Erledigen</span>
                </button>
              </div>
            </motion.div>
          </div>
        ))}
        {filteredTodos.length === 0 && (
          <div className={`p-6 text-center text-xs ${textSub}`}>
            Keine offenen To-Dos vorhanden. 🎉
          </div>
        )}
      </div>
    </div>
  );
}
