import { Quote, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import MehendiPattern from "@/components/graphics/MehendiPattern";

const SuccessStoryBanner = () => (
  <motion.div
    whileTap={{ scale: 0.98 }}
    className="overflow-hidden rounded-2xl bg-card shadow-soft hover:shadow-medium transition-shadow cursor-pointer relative group"
  >
    {/* Subtle mehendi decoration */}
    <div className="absolute top-0 right-0 pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity">
      <MehendiPattern
        variant="corner-tl"
        color="hsl(var(--primary))"
        opacity={0.08}
        className="w-[120px] h-[120px] transform scale-x-[-1]"
        animate={false}
      />
    </div>

    <div className="gradient-warm px-4 py-5 pb-8 relative">
      <div className="flex -space-x-3 mb-3">
        <motion.div
          whileHover={{ scale: 1.1, rotate: -5 }}
          className="h-11 w-11 rounded-xl bg-card border-2 border-white/30 flex items-center justify-center text-sm font-bold text-primary shadow-md"
        >
          P
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="h-11 w-11 rounded-xl bg-card border-2 border-white/30 flex items-center justify-center text-sm font-bold text-secondary shadow-md"
        >
          A
        </motion.div>
      </div>
      <div className="flex items-center gap-2">
        <p className="font-heading text-sm font-bold text-foreground">Priya & Arun</p>
        <Sparkles className="h-3 w-3 text-accent animate-glow-pulse" />
      </div>
      <p className="text-[11px] text-muted-foreground mt-0.5">Married 2025</p>
    </div>
    <div className="relative -mt-4 rounded-t-2xl bg-card px-4 py-3.5">
      <Quote className="h-4 w-4 text-primary/30 mb-1" />
      <p className="text-xs text-muted-foreground italic leading-relaxed">
        "Our traditions brought us together through Banjara Bandhan!"
      </p>
    </div>
  </motion.div>
);

export default SuccessStoryBanner;
