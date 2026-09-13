import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, RefreshCcw, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface SurpriseViewProps {
  theme: any;
}

// --- EIGENE BILD-STICKER-KOMPONENTEN (MIT FEINER BEWEGUNG) ---
const Sticker2 = ({ className }: { className?: string }) => (
  <motion.img
    animate={{ rotate: [11, 13, 11] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    src="/stickers/Sticker2.png"
    alt="Snoopy Matcha"
    className={`pointer-events-none object-contain drop-shadow-xl ${className}`}
  />
);

const Sticker3 = ({ className }: { className?: string }) => (
  <motion.img
    animate={{ rotate: [-15, -12, -15] }}
    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
    src="/stickers/Sticker3.png"
    alt="To Do Pilates"
    className={`pointer-events-none object-contain drop-shadow-xl ${className}`}
  />
);

const Sticker4 = ({ className }: { className?: string }) => (
  <motion.img
    animate={{ rotate: [4, 7, 4], y: [0, -2, 0] }}
    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
    src="/stickers/Sticker4.png"
    alt="Cherry Reformer"
    className={`pointer-events-none object-contain drop-shadow-xl ${className}`}
  />
);

const Sticker5 = ({ className }: { className?: string }) => (
  <motion.img
    animate={{ rotate: [-16, -13, -16] }}
    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    src="/stickers/Sticker5.png"
    alt="Tulips Envelope"
    className={`pointer-events-none object-contain drop-shadow-xl ${className}`}
  />
);

export function SurpriseView({ theme }: SurpriseViewProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleReveal = () => {
    const duration = 3.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 45 * (timeLeft / duration);
      const aestheticColors = ["#1B4332", "#5C1A21", "#F7D6D9", "#F8F5EE", "#D4AF37", "#FFB5A7"];

      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.35), y: Math.random() - 0.2 },
          colors: aestheticColors
        })
      );
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.65, 0.9), y: Math.random() - 0.2 },
          colors: aestheticColors
        })
      );
    }, 220);

    setIsRevealed(true);
  };

  return (
    <div
      className="relative flex min-h-[85vh] w-full flex-col items-center justify-center overflow-hidden rounded-3xl"
      style={{
        background: `
          radial-gradient(circle at 50% 45%, rgba(27, 67, 50, 0.45) 0%, transparent 60%),
          radial-gradient(circle at 85% 80%, rgba(247, 214, 217, 0.08) 0%, transparent 45%),
          linear-gradient(180deg, #09150F 0%, #050E0A 50%, #030806 100%)
        `
      }}
    >
      <div className="relative z-10 flex w-full flex-col items-center px-4">
        {!isRevealed ? (
          // --- STARTBILDSCHIRM MIT ZITTERNDEM BUTTON ---
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center space-y-7 text-center select-none"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.25, 1.05, 1.3, 1],
                  opacity: [0.3, 0.75, 0.4, 0.8, 0.3]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.8,
                  ease: "easeInOut",
                  times: [0, 0.15, 0.3, 0.45, 1]
                }}
                className="pointer-events-none absolute -inset-3 rounded-full bg-[#F7D6D9]/25 blur-2xl"
              />

              <motion.button
                onClick={handleReveal}
                animate={{
                  rotate: [0, -4, 4, -4, 3, -1, 0, 0, 0],
                  scale: [1, 1.04, 1, 1.06, 1, 1, 1, 1, 1],
                  x: [0, -1.5, 1.5, -1, 1, 0, 0, 0, 0]
                }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.5, 0.8, 1]
                }}
                whileHover={{ scale: 1.12, rotate: 0 }}
                whileTap={{ scale: 0.92 }}
                className="group relative flex h-24 w-24 items-center justify-center rounded-full border border-[#F7D6D9]/50 bg-[#113022]/90 shadow-[0_15px_35px_rgba(0,0,0,0.5),0_0_35px_rgba(247,214,217,0.25)] backdrop-blur-xl transition-colors duration-300 hover:border-[#F7D6D9]"
              >
                <Heart className="h-9 w-9 fill-[#F7D6D9] text-[#F7D6D9] transition-transform duration-200 group-hover:scale-110" />
              </motion.button>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl tracking-wide text-[#F7D6D9] italic sm:text-3xl">
                for lucky girl Lena
              </h2>

              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-3 w-3 animate-pulse text-[#D4AF37]" />
                <p className="text-[11px] font-bold tracking-[0.25em] text-[#F8F5EE]/60 uppercase">
                  Tap to unwrap
                </p>
                <Sparkles className="h-3 w-3 animate-pulse text-[#D4AF37]" />
              </div>
            </div>
          </motion.div>
        ) : (
          // --- DER GUTSCHEIN (QUERFORMAT) ---
          <div className="flex flex-col items-center [perspective:1400px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.2, rotateZ: -160, rotateY: -720 }}
              animate={{ opacity: 1, scale: 1, rotateZ: 0, rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 50, damping: 15, mass: 1.1 }}
              className="relative h-[180px] w-[350px] cursor-pointer select-none [transform-style:preserve-3d] sm:h-[240px] sm:w-[550px]"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* === VORDERSEITE (CLEAN, OHNE GLOW/SCHWEIF) === */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center overflow-visible rounded-2xl bg-[#113022] shadow-[0_25px_60px_rgba(0,0,0,0.65)] ring-1 ring-white/15 transition-opacity duration-200 [backface-visibility:hidden] ${
                  isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
                }`}
              >
                {/* Sticker Vorderseite */}
                <Sticker2 className="absolute -top-12 -right-8 z-20 w-40 sm:-top-20 sm:-right-12 sm:w-60" />
                <Sticker5 className="absolute -bottom-6 -left-6 z-20 w-32 sm:-bottom-10 sm:-left-8 sm:w-48" />

                {/* Diagonale Typografie */}
                <div className="pointer-events-none mt-2 flex w-full -rotate-6 flex-col px-8 sm:-rotate-[8deg] sm:px-12">
                  <span className="ml-[5%] self-start font-serif text-xl tracking-tight text-[#F8F5EE] sm:text-3xl">
                    it&apos;s a
                  </span>
                  <span className="-ml-[15%] self-center font-serif text-5xl leading-tight text-[#F7D6D9] italic sm:-ml-[20%] sm:text-[5.5rem]">
                    gift
                  </span>
                  <span className="mt-0 ml-[15%] self-center font-serif text-lg tracking-tight text-[#F8F5EE] sm:mt-2 sm:ml-[25%] sm:text-2xl">
                    to have
                  </span>
                  <span className="mr-[5%] self-end font-serif text-4xl leading-none text-[#F7D6D9] italic sm:text-[4.5rem]">
                    you.
                  </span>
                </div>

                <div className="pointer-events-none absolute bottom-3 flex items-center gap-2 opacity-60 sm:bottom-4">
                  <RefreshCcw className="h-3 w-3 text-[#F8F5EE]" />
                  <span className="text-[8px] font-bold tracking-[0.25em] text-[#F8F5EE] uppercase">
                    Tap to turn
                  </span>
                </div>
              </div>

              {/* === RÜCKSEITE === */}
              <div
                className={`absolute inset-0 flex [transform:rotateY(180deg)] overflow-visible rounded-2xl bg-[#F8F5EE] shadow-[0_25px_60px_rgba(0,0,0,0.65)] ring-1 ring-black/10 transition-opacity duration-200 [backface-visibility:hidden] ${
                  isFlipped ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                {/* Sticker Rückseite */}
                <Sticker3 className="absolute -top-16 -left-10 z-30 w-32 sm:-top-24 sm:-left-16 sm:w-44" />
                <Sticker4 className="absolute -right-6 -bottom-8 z-30 w-36 sm:-right-8 sm:-bottom-10 sm:w-52" />

                {/* Stanzungen (Cutouts) */}
                <div className="absolute -top-4 right-[25%] z-20 h-8 w-8 rounded-full bg-[#07130E] shadow-inner" />
                <div className="absolute right-[25%] -bottom-4 z-20 h-8 w-8 rounded-full bg-[#07130E] shadow-inner" />

                {/* Linker Bereich (75%) */}
                <div className="relative flex w-[75%] flex-col justify-between overflow-hidden rounded-l-2xl border-r-2 border-dashed border-[#5C1A21]/25 p-5 sm:p-7">
                  <div className="relative z-10 mt-2 flex items-start justify-between sm:mt-0">
                    <div className="space-y-1">
                      <h3 className="mt-1 font-serif text-2xl leading-none font-bold text-[#5C1A21] sm:mt-2 sm:text-4xl">
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
                <div className="relative z-10 flex w-[25%] flex-col items-center justify-between overflow-hidden rounded-r-2xl bg-[#F8F5EE] p-4 sm:p-6">
                  <span className="mt-6 origin-center -rotate-90 font-serif text-[10px] whitespace-nowrap text-[#5C1A21]/70 italic sm:mt-8 sm:text-xs">
                    Happy Birthday
                  </span>

                  {/* Minimalistischer Barcode */}
                  <div className="flex h-10 w-full items-end justify-center gap-[2px] pb-1 opacity-75 sm:h-14 sm:gap-[3px]">
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
