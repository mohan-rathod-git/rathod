/**
 * FirstMessageCelebration — One-time heart/confetti burst
 *
 * Triggers a brief celebratory animation when the first message
 * is sent in a matched couple's chat. Only fires once per match
 * (tracked via localStorage).
 *
 * Respects prefers-reduced-motion.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface FirstMessageCelebrationProps {
  /** Unique match key (sorted user IDs) */
  matchKey: string;
  /** Whether to trigger the celebration */
  trigger: boolean;
}

// SVG heart particle
const HeartParticle = ({ delay, x, y, size, rotation }: {
  delay: number; x: number; y: number; size: number; rotation: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
    animate={{
      opacity: [0, 1, 1, 0],
      scale: [0, 1.2, 1, 0.6],
      x: x,
      y: y,
      rotate: rotation,
    }}
    transition={{
      duration: 1.6,
      delay,
      ease: 'easeOut',
      times: [0, 0.2, 0.6, 1],
    }}
    className="absolute pointer-events-none"
    style={{ left: '50%', top: '50%' }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="currentColor"
      />
    </svg>
  </motion.div>
);

// Generate random particles
const generateParticles = () => {
  const particles = [];
  const colors = [
    'text-rose-400', 'text-pink-400', 'text-red-400',
    'text-orange-400', 'text-amber-400', 'text-rose-300',
  ];

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const distance = 60 + Math.random() * 80;
    particles.push({
      id: i,
      delay: Math.random() * 0.3,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 20,
      size: 14 + Math.random() * 12,
      rotation: Math.random() * 360 - 180,
      color: colors[i % colors.length],
    });
  }
  return particles;
};

const FirstMessageCelebration = ({ matchKey, trigger }: FirstMessageCelebrationProps) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [particles] = useState(generateParticles);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!trigger) return;

    const storageKey = `bb_first_msg_celebrated_${matchKey}`;
    const alreadyCelebrated = localStorage.getItem(storageKey);

    if (alreadyCelebrated) return;

    // Mark as celebrated immediately
    localStorage.setItem(storageKey, 'true');

    if (shouldReduceMotion) return; // Skip animation for reduced motion

    setShowCelebration(true);

    // Auto-dismiss after animation completes
    const timer = setTimeout(() => {
      setShowCelebration(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [trigger, matchKey, shouldReduceMotion]);

  return (
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center"
        >
          {/* Central heart burst */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.5, 1.2],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="text-rose-500"
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.div>

          {/* Particle burst */}
          {particles.map((p) => (
            <div key={p.id} className={p.color}>
              <HeartParticle
                delay={p.delay}
                x={p.x}
                y={p.y}
                size={p.size}
                rotation={p.rotation}
              />
            </div>
          ))}

          {/* "First Message!" label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: [0, 1, 1, 0], y: [20, -30, -40, -60] }}
            transition={{ duration: 2, times: [0, 0.2, 0.7, 1] }}
            className="absolute text-center"
            style={{ top: '35%' }}
          >
            <span className="text-sm font-bold text-rose-500 bg-card/80 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-soft">
              💕 First message! 💕
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirstMessageCelebration;
