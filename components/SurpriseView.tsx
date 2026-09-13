import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Heart, Sparkles, Unlock, RefreshCcw } from "lucide-react";
import confetti from "canvas-confetti";

interface SurpriseViewProps {
  theme: any;
}

export function SurpriseView({ theme }: SurpriseViewProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const { textTitle, textSub, isDarkMode } = theme;

  const handleReveal = () => {
    // 1. Konfetti-Feuerwerk starten (Dauer: 3 Sekunden)
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
          colors: ["#FFC0CB", "#FF69B4", "#FF1493", "#FFD700", "#FFFFFF"]
        })
      );
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#FFC0CB", "#FF69B4", "#FF1493", "#FFD700", "#FFFFFF"]
        })
      );
    }, 250);

    // 2. Ansicht umschalten
    setIsRevealed(true);
  };

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden py-10">
      {!isRevealed ? (
        // --- MYSTERIÖSER STARTBILDSCHIRM ---
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-6 text-center"
        >
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl"
            />
            <button
              onClick={handleReveal}
              className="relative flex h-24 w-24 items-center justify-center rounded-full border border-rose-500/30 bg-[#121214] shadow-[0_0_40px_-10px_rgba(244,63,94,0.3)] transition-all hover:scale-105 hover:border-rose-500/60 hover:shadow-[0_0_60px_-10px_rgba(244,63,94,0.5)]"
            >
              <Unlock className="h-8 w-8 text-rose-400" />
            </button>
          </div>
          <div className="space-y-2">
            <h2 className={`text-xl font-bold tracking-widest uppercase ${textTitle}`}>
              Verschlüsseltes Paket
            </h2>
            <p className={`text-sm ${textSub}`}>
              Authentifizierung erforderlich. <br /> Berühre das Schloss, um die Datei zu öffnen.
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
              stiffness: 50,
              damping: 12,
              mass: 1.2
            }}
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative h-[480px] w-[320px] cursor-pointer [transform-style:preserve-3d]"
          >
            {/* VORDERSEITE */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-[#1A1A1D] via-[#2A1B20] to-[#4A1525] p-6 text-center shadow-2xl ring-1 shadow-rose-900/20 ring-white/10 [backface-visibility:hidden]">
              <div className="absolute top-6 left-6 text-rose-300/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="absolute right-6 bottom-6 text-rose-300/30">
                <Heart className="h-6 w-6" />
              </div>

              <Gift className="mb-6 h-14 w-14 text-rose-400" />
              <h3 className="mb-2 font-mono text-xs font-bold tracking-[0.3em] text-rose-300/70 uppercase">
                Happy Birthday
              </h3>
              <h2 className="bg-gradient-to-br from-white to-rose-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
                Für Lena
              </h2>

              <div className="mt-8 flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 backdrop-blur-md">
                <RefreshCcw className="h-3 w-3 animate-pulse text-rose-300" />
                <span className="text-[10px] font-medium tracking-wider text-rose-200 uppercase">
                  Antippen zum Umdrehen
                </span>
              </div>
            </div>

            {/* RÜCKSEITE */}
            <div className="absolute inset-0 flex [transform:rotateY(180deg)] flex-col justify-between rounded-3xl bg-gradient-to-br from-[#FDFBF7] to-[#F3EBE1] p-8 text-[#2C1820] shadow-2xl ring-1 ring-black/5 [backface-visibility:hidden]">
              <div className="space-y-4 pt-4 text-center">
                <h3 className="font-serif text-2xl font-bold text-[#8B3A4C] italic">
                  Gutschein für...
                </h3>
                <div className="mx-auto h-px w-16 bg-[#8B3A4C]/30" />
                <p className="leading-relaxed font-medium text-[#4A2B35]">
                  Ein romantisches Wochenende zu zweit inkl. Spa, gutem Essen und absolut keiner
                  Notwendigkeit, einen Putzplan zu erfüllen.
                </p>
              </div>

              <div className="space-y-4 rounded-xl border border-[#8B3A4C]/10 bg-white/50 p-4 text-center backdrop-blur-sm">
                <div className="font-mono text-xs font-bold tracking-widest text-[#8B3A4C]/60">
                  CODE: LENA-2026
                </div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-[#8B3A4C]/30">
                  <Heart className="h-6 w-6 text-[#8B3A4C]/50" />
                </div>
                <p className="text-[9px] font-bold tracking-wider text-[#8B3A4C]/40 uppercase">
                  Einlösbar auf Lebenszeit
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
