import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Heart, Sparkles, RefreshCcw } from "lucide-react";
import confetti from "canvas-confetti";

interface SurpriseViewProps {
  theme: any;
}

export function SurpriseView({ theme }: SurpriseViewProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleReveal = () => {
    // 1. Konfetti-Feuerwerk (3 Sekunden) - Süße, feminine Farben
    const duration = 3 * 1000;
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
          // Pink, Rosegold, Pfirsich, Weiß
          colors: ["#FFC0CB", "#FFB6C1", "#FF69B4", "#FFF0F5", "#FFD700"]
        })
      );
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#FFC0CB", "#FFB6C1", "#FF69B4", "#FFF0F5", "#FFD700"]
        })
      );
    }, 250);

    // 2. Ansicht umschalten
    setIsRevealed(true);
  };

  return (
    // INDIVIDUELLER HINTERGRUND: Sanftes Rosa/Creme
    <div className="relative flex min-h-[85vh] w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-[#FFF5F7]">
      {/* ANIMIERTE MESH-GRADIENTS (Warme, süße Pastelltöne) IM HINTERGRUND */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] h-[500px] w-[500px] rounded-full bg-pink-300/30 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] -right-[10%] h-[500px] w-[500px] rounded-full bg-rose-200/40 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] left-[20%] h-[400px] w-[400px] rounded-full bg-fuchsia-200/30 blur-[100px]"
        />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center px-4">
        {!isRevealed ? (
          // --- SÜSSER STARTBILDSCHIRM ---
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-8 text-center"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-pink-400/30 blur-xl"
              />
              <button
                onClick={handleReveal}
                className="group relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-white/60 bg-white/40 shadow-[0_0_40px_-10px_rgba(244,114,182,0.4)] backdrop-blur-md transition-all hover:scale-110 hover:border-white hover:shadow-[0_0_60px_-10px_rgba(244,114,182,0.6)]"
              >
                <Heart className="h-12 w-12 fill-pink-400 text-pink-500 transition-transform group-hover:scale-110" />
              </button>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-[0.1em] text-pink-600">
                Eine Überraschung für dich
              </h2>
              <p className="mx-auto max-w-xs text-sm leading-relaxed font-medium text-pink-400/80">
                Tippe auf das Herz, um dein
                <br />
                Geburtstagsgeschenk auszupacken 💕
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
              {/* VORDERSEITE (Wunderschönes, weiches Pink/Rosegold) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-[#FF9A9E] to-[#FECFEF] p-6 text-center shadow-2xl ring-4 shadow-pink-500/30 ring-white/40 [backface-visibility:hidden]">
                {/* Süße Deko-Icons in den Ecken */}
                <div className="absolute top-6 left-6 text-white/50">
                  <Sparkles className="h-7 w-7" />
                </div>
                <div className="absolute right-6 bottom-6 text-white/50">
                  <Heart className="h-7 w-7 fill-white/30" />
                </div>

                <Gift className="mb-6 h-16 w-16 text-white drop-shadow-md" />
                <h3 className="mb-2 font-mono text-xs font-bold tracking-[0.4em] text-white/90 uppercase">
                  Happy Birthday
                </h3>
                <h2 className="text-6xl font-black tracking-tight text-white drop-shadow-lg">
                  LENA
                </h2>

                <div className="mt-12 flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-5 py-2.5 shadow-sm backdrop-blur-md">
                  <RefreshCcw className="h-3.5 w-3.5 animate-pulse text-white" />
                  <span className="text-[10px] font-bold tracking-widest text-white uppercase">
                    Antippen zum Umdrehen
                  </span>
                </div>
              </div>

              {/* RÜCKSEITE (Weiß/Creme mit elegantem Pink) */}
              <div className="absolute inset-0 flex [transform:rotateY(180deg)] flex-col justify-between rounded-3xl bg-[#FFFAFA] p-8 text-[#831843] shadow-2xl ring-4 ring-white [backface-visibility:hidden]">
                <div className="space-y-5 pt-4 text-center">
                  <h3 className="font-serif text-2xl font-bold text-pink-400 italic">
                    Gutschein für ein...
                  </h3>
                  <div className="mx-auto h-px w-20 bg-pink-200" />
                  <h4 className="text-xl font-black tracking-widest text-pink-600 uppercase drop-shadow-sm">
                    Pilates <br /> Probetraining
                  </h4>
                  <p className="px-2 text-sm leading-relaxed font-medium text-pink-900/70">
                    Ein exklusives 1-on-1 Training mit Personal Trainer. Für eine perfekte Balance,
                    einen starken Core und etwas Zeit nur für dich.
                  </p>
                </div>

                <div className="space-y-4 rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/50 p-4 text-center">
                  <div className="font-mono text-xs font-bold tracking-widest text-pink-400">
                    CODE: CORE-2026
                  </div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pink-100">
                    <Heart className="h-6 w-6 fill-pink-300 text-pink-400" />
                  </div>
                  <p className="text-[10px] font-bold tracking-wider text-pink-500/80 uppercase">
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
