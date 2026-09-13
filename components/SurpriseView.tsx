import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, RefreshCcw } from "lucide-react";
import confetti from "canvas-confetti";

interface SurpriseViewProps {
  theme: any;
}

// --- EIGENE BILD-STICKER-KOMPONENTEN ---
const Sticker2 = ({ className }: { className?: string }) => (
  <img
    src="/stickers/Sticker2.png"
    alt="Snoopy Matcha"
    className={`pointer-events-none object-contain drop-shadow-xl ${className}`}
  />
);

const Sticker3 = ({ className }: { className?: string }) => (
  <img
    src="/stickers/Sticker3.png"
    alt="To Do Pilates"
    className={`pointer-events-none object-contain drop-shadow-xl ${className}`}
  />
);

const Sticker4 = ({ className }: { className?: string }) => (
  <img
    src="/stickers/Sticker4.png"
    alt="Cherry Reformer"
    className={`pointer-events-none object-contain drop-shadow-xl ${className}`}
  />
);

const Sticker5 = ({ className }: { className?: string }) => (
  <img
    src="/stickers/Sticker5.png"
    alt="Tulips Envelope"
    className={`pointer-events-none object-contain drop-shadow-xl ${className}`}
  />
);

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
    <div className="relative flex min-h-[85vh] w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-radial from-[#0F2A1D] via-[#081710] to-[#040B07]">
      {/* Dynamische Mesh-Glows */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 50, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.2, 0.9, 1]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[15%] -left-[10%] h-[550px] w-[550px] rounded-full bg-[#1B4332]/45 blur-[120px]"
        />

        <motion.div
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 40, -20, 0],
            scale: [1, 1.15, 1.05, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-[10%] -bottom-[15%] h-[500px] w-[500px] rounded-full bg-[#F7D6D9]/20 blur-[130px]"
        />

        <motion.div
          animate={{
            scale: [0.9, 1.25, 0.9],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] left-[25%] h-[420px] w-[420px] rounded-full bg-[#D4AF37]/15 blur-[140px]"
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
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.85, 0.4] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-[#F7D6D9]/30 blur-2xl"
              />
              <button
                onClick={handleReveal}
                className="group relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#F7D6D9]/50 bg-[#113022]/90 shadow-[0_0_50px_rgba(247,214,217,0.3)] backdrop-blur-md transition-all hover:scale-110 hover:border-[#F7D6D9]"
              >
                <Heart className="h-8 w-8 fill-[#F7D6D9] text-[#F7D6D9] transition-transform group-hover:scale-110" />
              </button>
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-[#F7D6D9] italic">for lucky girl Lena</h2>
              <p className="text-xs font-bold tracking-[0.2em] text-[#F7F4EB]/60 uppercase">
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
              {/* === VORDERSEITE: DUNKELGRÜN MIT LETTERPRESS/PRÄGE-EFFEKT === */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center overflow-visible rounded-xl bg-[#113022] shadow-[0_25px_60px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.5)] ring-1 ring-[#F7F4EB]/25 transition-opacity duration-200 [backface-visibility:hidden] ${
                  isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
                }`}
              >
                {/* HIER STICKER-GRÖSSEN VORDERSEITE ANPASSEN (z. B. w-40 sm:w-60) */}
                <Sticker2 className="absolute -top-12 -right-8 z-20 w-40 rotate-[12deg] sm:-top-20 sm:-right-12 sm:w-60" />
                <Sticker5 className="absolute -bottom-6 -left-6 z-20 w-32 rotate-[-15deg] sm:-bottom-10 sm:-left-8 sm:w-48" />

                {/* Diagonale Typografie mit Letterpress-Tiefprägung */}
                <div className="pointer-events-none mt-2 flex w-full -rotate-6 flex-col px-8 sm:-rotate-[8deg] sm:px-12">
                  <span
                    style={{
                      textShadow: "0 -1px 1px rgba(0,0,0,0.8), 0 1px 1px rgba(247,214,217,0.3)"
                    }}
                    className="ml-[5%] self-start font-serif text-xl tracking-tight text-[#F7F4EB] sm:text-3xl"
                  >
                    it&apos;s a
                  </span>
                  <span
                    style={{
                      textShadow: "0 -2px 3px rgba(0,0,0,0.9), 0 1.5px 1px rgba(255,255,255,0.4)"
                    }}
                    className="-ml-[15%] self-center font-serif text-5xl leading-tight text-[#F7D6D9] italic sm:-ml-[20%] sm:text-[5.5rem]"
                  >
                    gift
                  </span>
                  <span
                    style={{
                      textShadow: "0 -1px 1px rgba(0,0,0,0.8), 0 1px 1px rgba(247,214,217,0.3)"
                    }}
                    className="mt-0 ml-[15%] self-center font-serif text-lg tracking-tight text-[#F7F4EB] sm:mt-2 sm:ml-[25%] sm:text-2xl"
                  >
                    to have
                  </span>
                  <span
                    style={{
                      textShadow: "0 -2px 3px rgba(0,0,0,0.9), 0 1.5px 1px rgba(255,255,255,0.4)"
                    }}
                    className="mr-[5%] self-end font-serif text-4xl leading-none text-[#F7D6D9] italic sm:text-[4.5rem]"
                  >
                    you.
                  </span>
                </div>

                <div className="pointer-events-none absolute bottom-3 flex flex-col items-center gap-1.5 opacity-60 sm:bottom-5">
                  <RefreshCcw className="h-3 w-3 animate-pulse text-[#F7F4EB]" />
                  <span className="text-[7px] font-bold tracking-widest text-[#F7F4EB] uppercase sm:text-[8px]">
                    Tap to turn
                  </span>
                </div>
              </div>

              {/* === RÜCKSEITE: CREME TICKET MIT PAPIER-KANTENPRÄGUNG === */}
              <div
                className={`absolute inset-0 flex [transform:rotateY(180deg)] overflow-visible rounded-xl bg-[#F7F4EB] shadow-[0_25px_60px_rgba(0,0,0,0.65),inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(70,43,40,0.12)] ring-1 ring-black/5 transition-opacity duration-200 [backface-visibility:hidden] ${
                  isFlipped ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                {/* HIER STICKER-GRÖSSEN RÜCKSEITE ANPASSEN */}
                <Sticker3 className="absolute -top-16 -left-10 z-30 w-32 rotate-[-14deg] sm:-top-24 sm:-left-16 sm:w-44" />
                <Sticker4 className="absolute -right-6 -bottom-8 z-30 w-3 rotate-[6deg] sm:-right-8 sm:-bottom-10 sm:w-44" />

                {/* Stanzungen mit eingeprägtem Innenschatten */}
                <div className="absolute -top-4 right-[25%] z-20 h-8 w-8 rounded-full bg-[#081710] shadow-[inset_0_-2px_3px_rgba(0,0,0,0.7)]" />
                <div className="absolute right-[25%] -bottom-4 z-20 h-8 w-8 rounded-full bg-[#081710] shadow-[inset_0_2px_3px_rgba(0,0,0,0.7)]" />

                {/* Linker Bereich (75%) mit geprägter Schrift */}
                <div className="relative flex w-[75%] flex-col justify-between overflow-hidden rounded-l-xl border-r-2 border-dashed border-[#5C1A21]/30 p-5 sm:p-7">
                  <div className="relative z-10 mt-2 flex items-start justify-between sm:mt-0">
                    <div className="space-y-1">
                      <h3
                        style={{
                          textShadow: "0 1px 0 rgba(255,255,255,0.8), 0 -1px 1px rgba(92,26,33,0.3)"
                        }}
                        className="mt-1 font-serif text-2xl leading-none font-bold text-[#5C1A21] sm:mt-2 sm:text-4xl"
                      >
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

                  {/* Barcode mit dezenter Rillen-Tiefenoptik */}
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
