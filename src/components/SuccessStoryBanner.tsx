import { Quote } from "lucide-react";

const SuccessStoryBanner = () => (
  <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
    <div className="gradient-warm px-4 py-5 pb-8">
      <div className="flex -space-x-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-card border-2 border-white/30 flex items-center justify-center text-sm font-bold text-primary">P</div>
        <div className="h-10 w-10 rounded-xl bg-card border-2 border-white/30 flex items-center justify-center text-sm font-bold text-secondary">A</div>
      </div>
      <p className="font-heading text-sm font-bold text-foreground">Priya & Arun</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">Married 2025</p>
    </div>
    <div className="relative -mt-4 rounded-t-2xl bg-card px-4 py-3.5">
      <Quote className="h-4 w-4 text-primary/30 mb-1" />
      <p className="text-xs text-muted-foreground italic leading-relaxed">
        "Our traditions brought us together through Banjara Bandhan!"
      </p>
    </div>
  </div>
);

export default SuccessStoryBanner;
