import React, { useState } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Heart, Sparkles, RefreshCcw, Smile } from "lucide-react";
import confetti from "canvas-confetti";

interface SurpriseViewProps {
  theme: any;
}

export function SurpriseView({ theme }: SurpriseViewProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleReveal = () => {
    // Konfetti passend zur Ästhetik: Creme, Altrosa, Bordeaux, Flaschengrün, Dunkelbraun
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
      const aestheticColors = ["#F7F4EB", "#E6C1C1", "#5C1A21", "#113022", "#462B28"];

      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: aestheticColors
        })
      );
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: aestheticColors
        })
      );
    }, 250);

    setIsRevealed(true);
  };

  return (
    // HINTERGRUND: Sanftes Creme-Beige, passend zur Karte
    <div className="relative flex min-h-[85vh] w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-[#EBE7DF]">
      {/* Sanfte Ambient-Schatten im Hintergrund (Grün & Rosa) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] h-[400px] w-[400px] rounded-full bg-[#113022]/10 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-[10%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-[#E6C1C1]/30 blur-[100px]"
        />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center px-4">
        {!isRevealed ? (
          // --- STARTBILDSCHIRM (Brief-Siegel Vibe) ---
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-8 text-center"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-[#5C1A21]/20 blur-xl"
              />
              <button
                onClick={handleReveal}
                className="group relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#F7F4EB] bg-[#113022] shadow-[0_10px_30px_rgba(17,48,34,0.3)] transition-all hover:scale-110"
              >
                <Heart className="h-10 w-10 fill-[#F7F4EB] text-[#F7F4EB] transition-transform group-hover:scale-110" />
              </button>
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-[#462B28] italic">for lucky girl Lena</h2>
              <p className="text-sm font-medium tracking-widest text-[#462B28]/60 uppercase">
                Tap to open
              </p>
            </div>
          </motion.div>
        ) : (
          // --- DER GUTSCHEIN (3D FLIP CARD) ---
          <div className="flex flex-col items-center space-y-8 [perspective:1200px]">
            <motion.div
              initial={{ opacity: 0, scale: 0, rotateZ: -180, rotateY: -720 }}
              animate={{ opacity: 1, scale: 1, rotateZ: 0, rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 45, damping: 14, mass: 1.1 }}
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative h-[500px] w-[340px] cursor-pointer [transform-style:preserve-3d]"
            >
              {/* VORDERSEITE (Exakt wie Bild 2: Creme & Bordeaux Typografie) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-[#F7F4EB] p-8 shadow-2xl ring-1 shadow-[#462B28]/20 ring-black/5 [backface-visibility:hidden]">
                {/* Typografie angelehnt an "it's a gift to have you" */}
                <div className="flex w-full flex-col items-start pl-4 leading-[0.85] text-[#5C1A21]">
                  <span className="ml-2 font-serif text-3xl tracking-tight">it&apos;s a</span>
                  <span className="-ml-1 font-serif text-[5.5rem] italic drop-shadow-sm">gift</span>
                  <span className="mt-1 ml-10 font-serif text-[1.7rem] tracking-tight">
                    to have
                  </span>
                  <span className="ml-16 font-serif text-[4.5rem] italic drop-shadow-sm">you.</span>
                </div>

                {/* Libra Studio Logo Vibe */}
                <div className="absolute bottom-10 flex flex-col items-center opacity-80">
                  <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full border border-[#5C1A21]">
                    <div className="h-1 w-1 rounded-full bg-[#5C1A21]" />
                  </div>
                  <span className="font-serif text-[10px] tracking-[0.3em] text-[#5C1A21] uppercase">
                    Lena Pilates
                  </span>
                </div>

                <div className="absolute top-6 right-6 flex items-center gap-1.5 opacity-40">
                  <RefreshCcw className="h-3 w-3 animate-pulse text-[#5C1A21]" />
                </div>
              </div>

              {/* RÜCKSEITE (Dunkelgrün wie das Kuvert + Bild 1 Sticker Ästhetik) */}
              <div className="absolute inset-0 flex [transform:rotateY(180deg)] flex-col items-center justify-center rounded-3xl bg-[#113022] p-8 shadow-2xl ring-4 ring-[#F7F4EB] [backface-visibility:hidden]">
                {/* --- STICKER AUS BILD 1 --- */}
                {/* Sticker 1: lucky girl */}
                <div className="absolute -top-4 -right-2 z-10 flex rotate-12 items-center gap-1 rounded-full border-4 border-[#F7F4EB] bg-[#462B28] px-4 py-1.5 text-[#E6C1C1] shadow-lg">
                  <span className="font-serif text-sm font-bold italic">lucky girl</span>
                  <Sparkles className="h-3 w-3" />
                </div>

                {/* Sticker 2: GO TO PILATES */}
                <div className="absolute top-16 -left-5 z-10 -rotate-6 rounded-[2rem] border-4 border-[#F7F4EB] bg-[#E6C1C1] px-4 py-3 text-[#462B28] shadow-lg">
                  <span className="block text-center text-xs leading-none font-black tracking-widest uppercase">
                    Go To
                    <br />
                    Pilates
                  </span>
                </div>

                {/* Sticker 3: aria s. -> lena. */}
                <div className="absolute bottom-20 -left-4 z-10 flex -rotate-12 items-center gap-1.5 rounded-[2rem] border-4 border-[#F7F4EB] bg-[#462B28] px-4 py-2 text-[#F7F4EB] shadow-lg">
                  <Heart className="h-3 w-3 fill-[#F7F4EB]" />
                  <span className="text-sm font-bold tracking-wide">lena.</span>
                </div>

                {/* Sticker 4: Dumbbell Icon */}
                <div className="absolute -right-3 bottom-6 z-10 rotate-12 rounded-full border-4 border-[#462B28] bg-[#F7F4EB] p-3 text-[#462B28] shadow-lg">
                  <Dumbbell className="h-5 w-5 fill-[#462B28]" />
                </div>
                {/* ------------------------- */}

                {/* Content der Karte */}
                <div className="relative z-0 mt-8 text-center">
                  <h3 className="mb-6 font-serif text-3xl text-[#F7F4EB] italic">Gutschein</h3>

                  <div className="space-y-3">
                    <p className="text-sm font-bold tracking-[0.2em] text-[#E6C1C1] uppercase">
                      Pilates Probetraining
                    </p>
                    <div className="mx-auto my-4 h-px w-12 bg-[#E6C1C1]/30" />
                    <p className="px-2 text-xs leading-relaxed font-medium text-[#F7F4EB]/90">
                      Ein exklusives 1-on-1 Workout mit Personal Trainer. Zeit für dich, deinen Body
                      & Mind.
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-8 w-full text-center">
                  <p className="text-[10px] font-bold tracking-widest text-[#E6C1C1]/60 uppercase">
                    Happy Birthday ♡
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
