import { useEffect, useState } from "react";

/**
 * A celebration overlay with a happy animated cat
 * that appears when a cleaning duty is marked as done.
 * On desktop it renders as a centered card; on mobile it fills the screen.
 */
export default function CleaningCelebration({
  area,
  onDone,
}: {
  area: string;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");

  useEffect(() => {
    // enter → show
    const t1 = setTimeout(() => setPhase("show"), 50);
    // show → exit
    const t2 = setTimeout(() => setPhase("exit"), 2800);
    // exit → unmount
    const t3 = setTimeout(() => onDone(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const opacity = phase === "enter" ? "opacity-0" : phase === "exit" ? "opacity-0" : "opacity-100";
  const cardScale = phase === "enter" ? "scale-90 opacity-0" : phase === "exit" ? "scale-105 opacity-0" : "scale-100 opacity-100";

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${opacity}`}
    >
      {/* Centered card */}
      <div
        className={`relative w-full max-w-sm mx-4 rounded-3xl bg-primary overflow-hidden shadow-2xl transition-all duration-700 ease-out ${cardScale}`}
      >
        {/* Sparkle particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-white/60 animate-bounce"
              style={{
                left: `${8 + (i * 6.5) % 84}%`,
                top: `${10 + (i * 7.3) % 70}%`,
                fontSize: `${10 + (i % 3) * 6}px`,
                animationDelay: `${(i * 0.17) % 1.5}s`,
                animationDuration: `${1.2 + (i % 3) * 0.5}s`,
              }}
            >
              {["✦", "˚", "⊹", "✧", "₊", "˚"][i % 6]}
            </span>
          ))}
        </div>

        {/* Content */}
        <div className="relative flex flex-col items-center px-8 py-10 gap-4">
          {/* Pixel cat walking */}
          <div className="relative">
            <img
              src="/happy_cats/cat-walk.gif"
              alt=""
              width={100}
              height={100}
              className="drop-shadow-2xl"
              style={{ imageRendering: "pixelated", animation: "cat-bounce 1s ease-in-out infinite alternate" }}
            />
            <span
              className="absolute -top-4 -right-2 text-3xl"
              style={{ animation: "sparkle-spin 2s linear infinite" }}
            >
              ✦
            </span>
          </div>

          <p className="font-headline text-3xl font-bold italic text-white tracking-tight text-center">
            Awesome!
          </p>
          <p className="font-body text-white/80 text-sm text-center max-w-[220px]">
            {area} Cleaning marked as done. You're a star!
          </p>
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes cat-bounce {
          0% { transform: translateY(0) rotate(-2deg); }
          100% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes sparkle-spin {
          0% { transform: rotate(0deg) scale(1); opacity: 1; }
          50% { transform: rotate(180deg) scale(1.3); opacity: 0.6; }
          100% { transform: rotate(360deg) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
