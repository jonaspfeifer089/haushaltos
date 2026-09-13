import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, RefreshCcw } from "lucide-react";
import confetti from "canvas-confetti";

interface SurpriseViewProps {
  theme: any;
}

export function SurpriseView({ theme }: SurpriseViewProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleReveal = () => {
    // Edles Konfetti: Creme, Bordeaux, Flaschengrün, Gold, Dunkelbraun
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
      const aestheticColors = ["#F7F4EB", "#5C1A21", "#113022", "#D4AF37", "#462B28"];

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
    // HINTERGRUND: Sanftes Creme-Beige
    <div className="relative flex min-h-[85vh] w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-[#EBE7DF]">
      {/* Sanfte Ambient-Schatten im Hintergrund */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] h-[400px] w-[400px] rounded-full bg-[#113022]/5 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-[10%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-[#5C1A21]/10 blur-[100px]"
        />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center px-4">
        {!isRevealed ? (
          // --- STARTBILDSCHIRM (Minimalistisches Siegel) ---
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
                className="group relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#F7F4EB] bg-[#113022] shadow-[0_10px_30px_rgba(17,48,34,0.3)] transition-all hover:scale-110"
              >
                <Heart className="h-8 w-8 fill-[#F7F4EB] text-[#F7F4EB] transition-transform group-hover:scale-110" />
              </button>
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-[#462B28] italic">for lucky girl Lena</h2>
              <p className="text-xs font-bold tracking-[0.2em] text-[#462B28]/50 uppercase">
                Tap to open
              </p>
            </div>
          </motion.div>
        ) : (
          // --- DER GUTSCHEIN (3D FLIP TICKET IM QUERFORMAT) ---
          <div className="flex flex-col items-center [perspective:1200px]">
            <motion.div
              initial={{ opacity: 0, scale: 0, rotateZ: -180, rotateY: -720 }}
              animate={{ opacity: 1, scale: 1, rotateZ: 0, rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 45, damping: 14, mass: 1.1 }}
              onClick={() => setIsFlipped(!isFlipped)}
              // Querformat-Dimensionen: Responsive für Mobile (350x180) und Desktop (550x240)
              className="relative h-[180px] w-[350px] cursor-pointer [transform-style:preserve-3d] sm:h-[240px] sm:w-[550px]"
            >
              {/* VORDERSEITE: Das edle "Ticket" */}
              <div className="absolute inset-0 flex overflow-hidden rounded-xl bg-[#F7F4EB] shadow-2xl ring-1 shadow-[#462B28]/20 ring-black/5 [backface-visibility:hidden]">
                {/* Stanzungen (Cutouts) oben und unten für den typischen Ticket-Look */}
                <div className="absolute -top-4 right-[25%] h-8 w-8 rounded-full bg-[#EBE7DF] shadow-inner" />
                <div className="absolute right-[25%] -bottom-4 h-8 w-8 rounded-full bg-[#EBE7DF] shadow-inner" />

                {/* Hauptteil des Tickets (Links 75%) */}
                <div className="flex w-[75%] flex-col justify-between border-r-2 border-dashed border-[#5C1A21]/30 p-5 sm:p-7">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-serif text-2xl leading-none font-bold text-[#5C1A21] sm:text-4xl">
                        PILATES
                      </h3>
                      <p className="text-[8px] font-bold tracking-[0.3em] text-[#5C1A21]/70 uppercase sm:text-[10px]">
                        1-on-1 Personal Session
                      </p>
                    </div>
                    <span className="font-mono text-[8px] font-bold text-[#5C1A21]/40 sm:text-[10px]">
                      Nº 001
                    </span>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex gap-6 sm:gap-10">
                      <div>
                        <p className="mb-0.5 text-[7px] font-bold tracking-widest text-[#5C1A21]/40 uppercase sm:text-[8px]">
                          Date
                        </p>
                        <p className="font-mono text-[10px] font-bold text-[#5C1A21] sm:text-xs">
                          OPEN
                        </p>
                      </div>
                      <div>
                        <p className="mb-0.5 text-[7px] font-bold tracking-widest text-[#5C1A21]/40 uppercase sm:text-[8px]">
                          Guest
                        </p>
                        <p className="font-serif text-[11px] font-bold text-[#5C1A21] italic sm:text-sm">
                          Lena
                        </p>
                      </div>
                    </div>
                    <p className="max-w-[90%] text-[8px] leading-relaxed font-medium text-[#5C1A21]/80 sm:text-[10px]">
                      Ein exklusives Personal Training. Zeit für dich, für deine Balance und einen
                      starken Core.
                    </p>
                  </div>
                </div>

                {/* Abrisskante des Tickets (Rechts 25%) */}
                <div className="flex w-[25%] flex-col items-center justify-between bg-[#F7F4EB] p-4 sm:p-6">
                  <span className="mt-6 origin-center -rotate-90 font-serif text-[10px] whitespace-nowrap text-[#5C1A21]/70 italic sm:mt-8 sm:text-xs">
                    Happy Birthday
                  </span>

                  {/* Minimalistischer Barcode */}
                  <div className="flex h-10 w-full items-end justify-center gap-[2px] pb-1 opacity-70 sm:h-14 sm:gap-[3px]">
                    <div className="w-1 bg-[#5C1A21]"></div>
                    <div className="w-0.5 bg-[#5C1A21]"></div>
                    <div className="w-1.5 bg-[#5C1A21]"></div>
                    <div className="w-0.5 bg-[#5C1A21]"></div>
                    <div className="w-1 bg-[#5C1A21]"></div>
                    <div className="w-2 bg-[#5C1A21]"></div>
                    <div className="w-0.5 bg-[#5C1A21]"></div>
                    <div className="w-1 bg-[#5C1A21]"></div>
                    <div className="w-1.5 bg-[#5C1A21]"></div>
                  </div>

                  <span className="font-mono text-[6px] font-bold tracking-[0.2em] text-[#5C1A21]/50 sm:text-[7px]">
                    CORE-26
                  </span>
                </div>
              </div>

              {/* RÜCKSEITE: Die poetische Typografie (Flaschengrün) */}
              <div className="absolute inset-0 flex [transform:rotateY(180deg)] flex-col items-center justify-center rounded-xl bg-[#113022] p-8 shadow-2xl ring-1 ring-black/10 [backface-visibility:hidden]">
                {/* Wunderschöne, verschachtelte Typografie wie im grünen Kuvert */}
                <div className="mt-2 flex w-full flex-col items-center leading-[0.85] text-[#F7F4EB]">
                  <span className="font-serif text-xl tracking-tight sm:text-2xl">it&apos;s a</span>
                  <span className="font-serif text-4xl text-[#E6C1C1] italic drop-shadow-sm sm:text-6xl">
                    gift
                  </span>
                  <span className="mt-1 font-serif text-lg tracking-tight sm:mt-2 sm:text-xl">
                    to have
                  </span>
                  <span className="font-serif text-3xl italic drop-shadow-sm sm:text-5xl">
                    you.
                  </span>
                </div>

                <div className="absolute bottom-4 flex flex-col items-center gap-1.5 opacity-40 sm:bottom-6">
                  <RefreshCcw className="h-3 w-3 animate-pulse text-[#F7F4EB]" />
                  <span className="text-[7px] font-bold tracking-widest text-[#F7F4EB] uppercase sm:text-[8px]">
                    Tap to turn
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
