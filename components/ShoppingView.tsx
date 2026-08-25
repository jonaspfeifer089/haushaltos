import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Trash2 } from "lucide-react";
import { EinkaufItem, EINKAUF_KATEGORIEN, SCHNELLWAHL_FAVORITEN } from "../types";
import { ermittleKategorie } from "../lib/mciEngine";

interface ShoppingViewProps {
  einkauf: EinkaufItem[];
  addEinkauf: (artikelName?: string, userFuer?: string) => Promise<void>;
  markEinkaufErledigt: (item: EinkaufItem, status: "Erledigt" | "Offen") => Promise<void>;
  deleteEinkauf: (item: EinkaufItem) => Promise<void>;
  springConfig: any;
  tapGesture: any;
  theme: any;
}

export function ShoppingView({
  einkauf,
  addEinkauf,
  markEinkaufErledigt,
  deleteEinkauf,
  springConfig,
  tapGesture,
  theme
}: ShoppingViewProps) {
  const [neuerArtikel, setNeuerArtikel] = useState("");
  const [einkaufFuer, setEinkaufFuer] = useState<string>("Beide");

  const {
    bgCard,
    bgItem,
    bgInput,
    textTitle,
    textSub,
    badgeBlue,
    badgeGreen,
    buttonPrimary,
    isDarkMode
  } = theme;

  const offeneEinkaeufe = einkauf.filter((e) => e.status !== "Erledigt");
  const einkaufNachKategorien = EINKAUF_KATEGORIEN.reduce(
    (acc, kat) => {
      const items = offeneEinkaeufe.filter(
        (i) => (i.kategorie || ermittleKategorie(i.artikel)) === kat
      );
      if (items.length > 0) acc[kat] = items;
      return acc;
    },
    {} as Record<string, EinkaufItem[]>
  );

  const handleAdd = async (favorit?: string) => {
    const text = favorit || neuerArtikel;
    if (!text.trim()) return;
    await addEinkauf(text, favorit ? "Beide" : einkaufFuer);
    if (!favorit) setNeuerArtikel("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${textTitle}`}>Einkaufsliste</h2>
          <p className={`text-xs ${textSub}`}>Wischen: Links = Erledigen, Rechts = Löschen</p>
        </div>
        <span className={`rounded-full px-3 py-1 font-mono text-xs font-bold ${badgeBlue}`}>
          {offeneEinkaeufe.length} offen
        </span>
      </div>

      <div className={`${bgCard} space-y-2 rounded-2xl p-5`}>
        <div className={`text-[11px] font-bold ${textSub}`}>Schnellwahl:</div>
        <div className="flex flex-wrap gap-2">
          {SCHNELLWAHL_FAVORITEN.map((fav, idx) => (
            <button
              key={idx}
              onClick={() => handleAdd(fav)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${bgItem} ${textTitle}`}
            >
              + {fav}
            </button>
          ))}
        </div>
      </div>

      <div className={`${bgCard} rounded-2xl p-6`}>
        <div
          className={`mb-6 grid grid-cols-1 gap-3 border-b pb-6 sm:grid-cols-12 ${isDarkMode ? "border-white/[0.08]" : "border-[#E8E2D9]"}`}
        >
          <input
            type="text"
            placeholder="Neuer Artikel..."
            value={neuerArtikel}
            onChange={(e) => setNeuerArtikel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className={`w-full sm:col-span-8 ${bgInput} rounded-xl border px-4 py-2.5 text-sm font-medium focus:outline-none`}
          />
          <select
            value={einkaufFuer}
            onChange={(e) => setEinkaufFuer(e.target.value)}
            className={`w-full sm:col-span-2 ${bgInput} rounded-xl border px-3 py-2.5 text-xs font-semibold focus:outline-none`}
          >
            <option value="Beide">👥 Beide</option>
            <option value="Jonas">👤 Nur Jonas</option>
            <option value="Lena">👤 Nur Lena</option>
          </select>
          <motion.button
            whileTap={tapGesture}
            onClick={() => handleAdd()}
            className={`w-full px-4 py-2.5 sm:col-span-2 ${buttonPrimary} flex items-center justify-center rounded-xl text-xs font-bold`}
          >
            Hinzufügen
          </motion.button>
        </div>

        <div className="space-y-6">
          {Object.entries(einkaufNachKategorien).map(([kategorie, items]) => (
            <div key={kategorie} className="space-y-2">
              <div className={`text-[10px] font-bold ${textSub} px-1 tracking-wider uppercase`}>
                {kategorie}
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="relative overflow-hidden rounded-xl">
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
                        if (isSwipeRight) deleteEinkauf(item);
                        else if (isSwipeLeft) markEinkaufErledigt(item, "Erledigt");
                      }}
                      className={`relative z-10 flex items-center justify-between rounded-xl border p-3.5 ${bgItem} ${bgCard} cursor-grab shadow-sm`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${textTitle}`}>{item.artikel}</span>
                        {item.fuer && item.fuer !== "Beide" && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${badgeBlue}`}
                          >
                            👤 {item.fuer}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => markEinkaufErledigt(item, "Erledigt")}
                        className={`h-7 rounded-lg px-3 text-[11px] font-bold ${badgeGreen} flex items-center gap-1 hover:opacity-80`}
                      >
                        <Check className="h-3.5 w-3.5" /> Erledigt
                      </button>
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(einkaufNachKategorien).length === 0 && (
            <div className={`p-6 text-center text-xs ${textSub}`}>Einkaufsliste ist leer. ✨</div>
          )}
        </div>
      </div>
    </div>
  );
}
