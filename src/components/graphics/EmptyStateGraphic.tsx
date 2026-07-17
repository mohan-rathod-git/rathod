/**
 * EmptyStateGraphic — Beautiful illustrated empty states
 * Replaces boring text-only empty states with delightful vector art.
 */
import { motion } from "framer-motion";

interface EmptyStateGraphicProps {
  variant: "no-messages" | "no-matches" | "no-profiles" | "no-results";
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}

const EmptyStateGraphic = ({ variant, title, subtitle, action }: EmptyStateGraphicProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-16 text-center px-6"
    >
      <div className="relative mb-6">
        {/* Decorative morph blob behind */}
        <div
          className="absolute inset-0 -m-6 animate-morph opacity-20"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--accent) / 0.3))",
            filter: "blur(20px)",
          }}
        />

        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <IllustrationSVG variant={variant} />
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="font-heading text-base font-bold text-foreground"
      >
        {title}
      </motion.p>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mt-2 text-sm text-muted-foreground max-w-[260px] leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}

      {action && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          onClick={action.onClick}
          className="mt-5 px-6 py-2.5 rounded-2xl gradient-saffron text-white text-sm font-semibold shadow-glow-primary active:scale-95 transition-transform"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};

const IllustrationSVG = ({ variant }: { variant: string }) => {
  const size = 120;

  if (variant === "no-messages") {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Chat bubble */}
        <rect x="20" y="25" width="80" height="55" rx="16" fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary) / 0.2)" strokeWidth="1.5" />
        <path d="M45 80 L55 95 L65 80" fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary) / 0.2)" strokeWidth="1.5" />
        {/* Message lines */}
        <rect x="35" y="40" width="40" height="4" rx="2" fill="hsl(var(--primary) / 0.15)" />
        <rect x="35" y="50" width="30" height="4" rx="2" fill="hsl(var(--primary) / 0.1)" />
        <rect x="35" y="60" width="20" height="4" rx="2" fill="hsl(var(--primary) / 0.07)" />
        {/* Heart */}
        <g transform="translate(82, 30)">
          <path d="M8 3 C5 0, 0 1, 0 5 C0 10, 8 14, 8 14 C8 14, 16 10, 16 5 C16 1, 11 0, 8 3Z"
            fill="hsl(var(--primary) / 0.2)" className="animate-breathe" />
        </g>
        {/* Sparkles */}
        <circle cx="25" cy="20" r="2" fill="hsl(var(--accent))" fillOpacity="0.3" className="animate-breathe" />
        <circle cx="100" cy="40" r="1.5" fill="hsl(var(--accent))" fillOpacity="0.4" style={{ animationDelay: "0.5s" }} className="animate-breathe" />
      </svg>
    );
  }

  if (variant === "no-matches") {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Two overlapping hearts */}
        <g transform="translate(25, 30)" opacity="0.8">
          <path d="M20 8 C13 0, 0 2, 0 12 C0 26, 20 36, 20 36 C20 36, 40 26, 40 12 C40 2, 27 0, 20 8Z"
            fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--primary) / 0.25)" strokeWidth="1.5" />
        </g>
        <g transform="translate(55, 25)" opacity="0.8">
          <path d="M20 8 C13 0, 0 2, 0 12 C0 26, 20 36, 20 36 C20 36, 40 26, 40 12 C40 2, 27 0, 20 8Z"
            fill="hsl(var(--accent) / 0.1)" stroke="hsl(var(--accent) / 0.2)" strokeWidth="1.5" />
        </g>
        {/* Connection line */}
        <line x1="45" y1="50" x2="75" y2="45" stroke="hsl(var(--primary) / 0.15)" strokeWidth="1" strokeDasharray="4 3" />
        {/* Decorative dots */}
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={30 + i * 16} cy={85 + Math.sin(i) * 5} r={2} fill="hsl(var(--primary) / 0.15)" />
        ))}
        {/* Stars */}
        <g transform="translate(15, 20)">
          <path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4Z" fill="hsl(var(--accent) / 0.25)" className="animate-breathe" />
        </g>
        <g transform="translate(95, 60)">
          <path d="M4 0 L5 3 L8 4 L5 5 L4 8 L3 5 L0 4 L3 3Z" fill="hsl(var(--accent) / 0.3)" className="animate-breathe" style={{ animationDelay: "1s" }} />
        </g>
      </svg>
    );
  }

  if (variant === "no-profiles" || variant === "no-results") {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Person silhouette */}
        <circle cx="60" cy="38" r="16" fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary) / 0.2)" strokeWidth="1.5" />
        <path d="M30 95 C30 70, 42 60, 60 60 C78 60, 90 70, 90 95" fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary) / 0.15)" strokeWidth="1.5" />
        {/* Search circle */}
        <circle cx="85" cy="75" r="15" stroke="hsl(var(--accent) / 0.3)" strokeWidth="2" fill="none" />
        <line x1="96" y1="86" x2="105" y2="95" stroke="hsl(var(--accent) / 0.3)" strokeWidth="2" strokeLinecap="round" />
        {/* Decorative */}
        <circle cx="20" cy="65" r="2" fill="hsl(var(--primary) / 0.15)" className="animate-breathe" />
        <circle cx="105" cy="30" r="1.5" fill="hsl(var(--accent) / 0.25)" className="animate-breathe" style={{ animationDelay: "0.7s" }} />
      </svg>
    );
  }

  return null;
};

export default EmptyStateGraphic;
