import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Heart, Sparkles, Unlock, RefreshCcw, Wind, Activity } from "lucide-react";
import confetti from "canvas-confetti";

interface SurpriseViewProps {
  theme: any;
}

export function SurpriseView({ theme }: SurpriseViewProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const { textTitle, textSub } = theme;

  const handleReveal = () => {
    // 1. Konfetti-Feuerwerk (3 Sekunden)
    const duration = 6 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          // Pilates Vibe Farben: Salbei, Gold, Blush, Weiß
          colors: ["#8FBC8F", "#FFB6C1", "#FFD700", "#F5F5DC", "#FFFFFF"]
        })
      );
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#8FBC8F", "#FFB6C1", "#FFD700", "#F5F5DC", "#FFFFFF"]
        })
      );
    }, 250);

    // 2. Ansicht umschalten
    setIsRevealed(true);
  };

  return (
    // INDIVIDUELLER HINTERGRUND FÜR DEN GANZEN TAB
    <div className="relative flex min-h-[85vh] w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-[#0C0F0E]">
      {/* ANIMIERTE MESH-GRADIENTS (Teal & Blush) IM HINTERGRUND */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-teal-600/20 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] -right-[20%] h-[500px] w-[500px] rounded-full bg-rose-400/15 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] left-[20%] h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-[100px]"
        />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center px-4">
        {!isRevealed ? (
          // --- MYSTERIÖSER STARTBILDSCHIRM ---
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-8 text-center"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-teal-500/20 blur-xl"
              />
              <button
                onClick={handleReveal}
                className="group relative flex h-28 w-28 items-center justify-center rounded-full border border-teal-500/30 bg-black/40 shadow-[0_0_40px_-10px_rgba(20,184,166,0.3)] backdrop-blur-md transition-all hover:scale-105 hover:border-teal-500/60 hover:shadow-[0_0_60px_-10px_rgba(20,184,166,0.5)]"
              >
                <Unlock className="h-10 w-10 text-teal-400 transition-transform group-hover:rotate-12" />
              </button>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-[0.2em] text-white/90 uppercase">
                Verschlüsseltes Paket
              </h2>
              <p className="mx-auto max-w-xs text-sm leading-relaxed font-medium text-teal-100/60">
                Biometrische Freigabe erforderlich. <br /> Berühre das Schloss, um die Überraschung
                zu entschlüsseln.
              </p>
            </div>
          </motion.div>
        ) : (
          // --- DER GUTSCHEIN (3D FLIP CARD) ---
          <div className="flex flex-col items-center space-y-8 [perspective:1200px]">
            <motion.div
              initial={{ opacity: 0, scale: 0, rotateZ: -180, rotateY: -720 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotateZ: 0,
                rotateY: isFlipped ? 180 : 0
              }}
              transition={{
                type: "spring",
                stiffness: 45,
                damping: 14,
                mass: 1.1
              }}
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative h-[500px] w-[340px] cursor-pointer [transform-style:preserve-3d]"
            >
              {/* VORDERSEITE (Teal/Gold Boutique Vibe) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] p-6 text-center shadow-2xl ring-1 shadow-teal-900/40 ring-white/10 [backface-visibility:hidden]">
                <div className="absolute top-6 left-6 text-teal-300/30">
                  <Wind className="h-6 w-6" />
                </div>
                <div className="absolute right-6 bottom-6 text-teal-300/30">
                  <Sparkles className="h-6 w-6" />
                </div>

                <Gift className="mb-6 h-14 w-14 text-teal-300" />
                <h3 className="mb-2 font-mono text-xs font-bold tracking-[0.4em] text-teal-200/70 uppercase">
                  Happy Birthday
                </h3>
                <h2 className="bg-gradient-to-br from-white via-teal-100 to-teal-300 bg-clip-text text-5xl font-black tracking-tight text-transparent">
                  LENA
                </h2>

                <div className="mt-12 flex items-center gap-2 rounded-full border border-white/5 bg-black/20 px-4 py-2 backdrop-blur-md">
                  <RefreshCcw className="h-3 w-3 animate-pulse text-teal-300" />
                  <span className="text-[10px] font-bold tracking-widest text-teal-100 uppercase">
                    Antippen zum Umdrehen
                  </span>
                </div>
              </div>

              {/* RÜCKSEITE (Heller, eleganter Sand-Ton) */}
              <div className="absolute inset-0 flex [transform:rotateY(180deg)] flex-col justify-between rounded-3xl bg-gradient-to-br from-[#FAF9F6] to-[#EBE5D9] p-8 text-[#2C3E50] shadow-2xl ring-1 ring-black/5 [backface-visibility:hidden]">
                <div className="space-y-5 pt-4 text-center">
                  <h3 className="font-serif text-2xl font-bold text-[#2C5364] italic">
                    Exklusiver Gutschein
                  </h3>
                  <div className="mx-auto h-px w-20 bg-[#2C5364]/20" />
                  <h4 className="text-lg font-bold tracking-widest text-[#2C5364] uppercase">
                    Pilates Probetraining
                  </h4>
                  <p className="text-sm leading-relaxed font-medium text-[#546E7A]">
                    Ein exklusives 1-on-1 Pilates Training mit einem Personal Trainer. Für eine
                    perfekte Balance, einen starken Core und einen freien Geist.
                  </p>
                </div>

                <div className="space-y-4 rounded-xl border border-[#2C5364]/10 bg-white/60 p-4 text-center backdrop-blur-md">
                  <div className="font-mono text-xs font-bold tracking-widest text-[#2C5364]/70">
                    CODE: CORE-2026
                  </div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#2C5364]/30 bg-[#2C5364]/5">
                    <Activity className="h-6 w-6 text-[#2C5364]/60" />
                  </div>
                  <p className="text-[9px] font-bold tracking-wider text-[#2C5364]/50 uppercase">
                    Herzlichen Glückwunsch, mein Schatz!
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
