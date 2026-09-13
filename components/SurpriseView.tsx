import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, RefreshCcw } from "lucide-react";
import confetti from "canvas-confetti";

interface SurpriseViewProps {
  theme: any;
}

// --- EIGENE BILD-STICKER-KOMPONENTEN ---
// Die "pointer-events-none" Klasse verhindert, dass die Sticker den Klick auf die Karte blockieren

const Sticker1 = ({ className }: { className?: string }) => (
  <img
    src="/stickers/Sticker1.png"
    alt="Yoga Figur"
    className={`pointer-events-none object-contain drop-shadow-lg ${className}`}
  />
);

const Sticker2 = ({ className }: { className?: string }) => (
  <img
    src="/stickers/Sticker2.png"
    alt="Snoopy Matcha"
    className={`pointer-events-none object-contain drop-shadow-lg ${className}`}
  />
);

const Sticker3 = ({ className }: { className?: string }) => (
  <img
    src="/stickers/Sticker3.png"
    alt="To Do Pilates"
    className={`pointer-events-none object-contain drop-shadow-lg ${className}`}
  />
);

const Sticker4 = ({ className }: { className?: string }) => (
  <img
    src="/stickers/Sticker4.png"
    alt="Cherry Reformer"
    className={`pointer-events-none object-contain drop-shadow-lg ${className}`}
  />
);

// -------------------------------------------------------------------

export function SurpriseView({ theme }: SurpriseViewProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleReveal = () => {
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
      // Farben: Flaschengrün, Bordeaux, Altrosa, Creme, Gold
      const aestheticColors = ["#113022", "#5C1A21", "#F7D6D9", "#F7F4EB", "#D4AF37"];

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
    // HINTERGRUND: Extrem dunkles, edles Waldgrün
    <div className="relative flex min-h-[85vh] w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-[#09150F]">
      {/* Ambient-Schatten */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[10%] h-[300px] w-[300px] rounded-full bg-[#F7D6D9]/10 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[10%] bottom-[20%] h-[400px] w-[400px] rounded-full bg-[#113022]/40 blur-[100px]"
        />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center px-4">
        {!isRevealed ? (
          // --- STARTBILDSCHIRM ---
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-8 text-center"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-[#F7D6D9]/20 blur-xl"
              />
              <button
                onClick={handleReveal}
                className="group relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#F7D6D9]/50 bg-[#113022]/80 shadow-[0_0_40px_-10px_rgba(247,214,217,0.2)] backdrop-blur-md transition-all hover:scale-110 hover:border-[#F7D6D9]"
              >
                <Heart className="h-8 w-8 fill-[#F7D6D9] text-[#F7D6D9] transition-transform group-hover:scale-110" />
              </button>
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-[#F7D6D9] italic">for lucky girl Lena</h2>
              <p className="text-xs font-bold tracking-[0.2em] text-[#F7F4EB]/50 uppercase">
                Tap to open
              </p>
            </div>
          </motion.div>
        ) : (
          // --- DER GUTSCHEIN (QUERFORMAT) ---
          <div className="flex flex-col items-center [perspective:1200px]">
            <motion.div
              initial={{ opacity: 0, scale: 0, rotateZ: -180, rotateY: -720 }}
              animate={{ opacity: 1, scale: 1, rotateZ: 0, rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 45, damping: 14, mass: 1.1 }}
              className="relative h-[180px] w-[350px] cursor-pointer select-none [transform-style:preserve-3d] sm:h-[240px] sm:w-[550px]"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* === VORDERSEITE (DUNKELGRÜN MIT TYPOGRAFIE & STICKERN) === */}
              <div className="absolute inset-0 flex flex-col items-center justify-center overflow-visible rounded-xl bg-[#113022] shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-[#F7F4EB]/20 [backface-visibility:hidden]">
                {/* Sticker (Vorderseite) */}
                <Sticker2 className="absolute -top-5 right-2 z-20 w-20 rotate-[12deg] sm:-top-8 sm:right-4 sm:w-28" />
                <Sticker1 className="absolute -bottom-4 left-4 z-20 w-16 rotate-[-10deg] sm:-bottom-6 sm:left-8 sm:w-24" />

                {/* Die diagonale Typografie */}
                <div className="pointer-events-none mt-2 flex w-full -rotate-6 flex-col px-8 sm:-rotate-[8deg] sm:px-12">
                  <span className="ml-[5%] self-start font-serif text-xl tracking-tight text-[#F7F4EB] sm:text-3xl">
                    it&apos;s a
                  </span>
                  <span className="-ml-[15%] self-center font-serif text-5xl leading-tight text-[#F7D6D9] italic drop-shadow-md sm:-ml-[20%] sm:text-[5.5rem]">
                    gift
                  </span>
                  <span className="mt-0 ml-[15%] self-center font-serif text-lg tracking-tight text-[#F7F4EB] sm:mt-2 sm:ml-[25%] sm:text-2xl">
                    to have
                  </span>
                  <span className="mr-[5%] self-end font-serif text-4xl leading-none text-[#F7D6D9] italic drop-shadow-md sm:text-[4.5rem]">
                    you.
                  </span>
                </div>

                <div className="pointer-events-none absolute bottom-3 flex flex-col items-center gap-1.5 opacity-50 sm:bottom-5">
                  <RefreshCcw className="h-3 w-3 animate-pulse text-[#F7F4EB]" />
                  <span className="text-[7px] font-bold tracking-widest text-[#F7F4EB] uppercase sm:text-[8px]">
                    Tap to turn
                  </span>
                </div>
              </div>

              {/* === RÜCKSEITE (HELLES CREME TICKET & STICKER) === */}
              <div className="absolute inset-0 flex [transform:rotateY(180deg)] overflow-visible rounded-xl bg-[#F7F4EB] shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-black/5 [backface-visibility:hidden]">
                {/* Sticker (Rückseite) - Brechen cool über die Kante */}
                <Sticker3 className="absolute -top-6 left-2 z-30 w-24 rotate-[-8deg] sm:-top-8 sm:left-6 sm:w-32" />
                <Sticker4 className="absolute right-[18%] -bottom-5 z-30 w-24 rotate-[12deg] sm:right-[20%] sm:-bottom-8 sm:w-36" />

                {/* Stanzungen (Cutouts) */}
                <div className="absolute -top-4 right-[25%] z-20 h-8 w-8 rounded-full bg-[#09150F] shadow-inner" />
                <div className="absolute right-[25%] -bottom-4 z-20 h-8 w-8 rounded-full bg-[#09150F] shadow-inner" />

                {/* Linker Bereich (75%) */}
                <div className="relative flex w-[75%] flex-col justify-between overflow-hidden rounded-l-xl border-r-2 border-dashed border-[#5C1A21]/30 p-5 sm:p-7">
                  <div className="relative z-10 mt-2 flex items-start justify-between sm:mt-0">
                    <div className="space-y-1">
                      <h3 className="font-serif text-2xl leading-none font-bold text-[#5C1A21] sm:text-4xl">
                        PILATES
                      </h3>
                      <p className="text-[7px] font-bold tracking-[0.3em] text-[#5C1A21]/70 uppercase sm:text-[10px]">
                        1-on-1 Personal Session
                      </p>
                    </div>
                    <span className="pt-1 font-mono text-[8px] font-bold text-[#5C1A21]/40 sm:text-[10px]">
                      Nº 001
                    </span>
                  </div>

                  <div className="relative z-10 mb-2 space-y-3 sm:mb-0 sm:space-y-4">
                    <div className="flex gap-6 sm:gap-10">
                      <div>
                        <p className="mb-0.5 text-[6px] font-bold tracking-widest text-[#5C1A21]/40 uppercase sm:text-[8px]">
                          Date
                        </p>
                        <p className="font-mono text-[9px] font-bold text-[#5C1A21] sm:text-xs">
                          OPEN
                        </p>
                      </div>
                      <div>
                        <p className="mb-0.5 text-[6px] font-bold tracking-widest text-[#5C1A21]/40 uppercase sm:text-[8px]">
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

                {/* Abrisskante (Rechts 25%) */}
                <div className="relative z-10 flex w-[25%] flex-col items-center justify-between overflow-hidden rounded-r-xl bg-[#F7F4EB] p-4 sm:p-6">
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
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
