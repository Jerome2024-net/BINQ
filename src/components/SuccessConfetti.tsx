"use client";

import { useEffect, useState } from "react";

export default function SuccessConfetti() {
  const [particles, setParticles] = useState<{ id: number; x: number; delay: number; color: string; size: number }[]>([]);

  useEffect(() => {
    const colors = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#fbbf24", "#f59e0b", "#ffffff"];
    const p = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.6,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 4,
    }));
    setParticles(p);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`,
            top: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.size > 7 ? "50%" : "1px",
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0.3);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti-fall 2.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
