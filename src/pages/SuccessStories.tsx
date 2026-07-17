import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Heart, PenLine, Quote, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import MehendiPattern from "@/components/graphics/MehendiPattern";

const stories = [
  { id: 1, names: "Rahul & Meena Rathod", location: "Pune, Maharashtra", date: "March 2025", quote: "We found each other through Banjara Bandhan and it was truly destiny. Our families connected instantly because of shared values." },
  { id: 2, names: "Suresh & Kavita Pawar", location: "Hyderabad, Telangana", date: "January 2025", quote: "Being from the same Banjara community made everything easier. From matching gotras to family blessings — everything fell into place." },
  { id: 3, names: "Vikram & Priya Chavan", location: "Bangalore, Karnataka", date: "November 2024", quote: "We connected over our love for Banjara culture and traditions. The app made it so easy to find someone who shares our values." },
];

const SuccessStories = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/85 backdrop-blur-2xl border-b border-border/30 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-colors hover:bg-muted/80"
          >
            <ArrowLeft className="h-4 w-4" />
          </motion.button>
          <h1 className="font-heading text-lg font-bold text-foreground">Success Stories</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-5 space-y-4">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center py-5 relative"
        >
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 relative overflow-hidden">
              <Heart className="h-7 w-7 text-primary relative z-10" />
              {/* Inner glow */}
              <div className="absolute inset-0 animate-breathe opacity-40 bg-primary/10 rounded-2xl" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-accent animate-glow-pulse" />
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-[260px] leading-relaxed">
            Real couples who found love on Banjara Bandhan
          </p>
        </motion.div>

        {/* Story cards */}
        {stories.map((story, i) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl bg-card shadow-soft overflow-hidden hover:shadow-medium transition-shadow group relative"
          >
            {/* Mehendi decoration */}
            <div className="absolute top-0 right-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <MehendiPattern
                variant="corner-tl"
                color="hsl(var(--primary))"
                opacity={0.06}
                className="w-[100px] h-[100px] transform scale-x-[-1]"
                animate={false}
              />
            </div>

            <div className="gradient-warm p-4 pb-8 relative">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    className="h-11 w-11 rounded-xl bg-card border-2 border-white/30 flex items-center justify-center text-sm font-bold text-primary shadow-md"
                  >
                    {story.names.split(" & ")[0][0]}
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="h-11 w-11 rounded-xl bg-card border-2 border-white/30 flex items-center justify-center text-sm font-bold text-secondary shadow-md"
                  >
                    {story.names.split(" & ")[1][0]}
                  </motion.div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-heading text-sm font-bold text-foreground">{story.names}</h3>
                    <Sparkles className="h-3 w-3 text-accent" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{story.location} · {story.date}</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-3.5 -mt-4 bg-card rounded-t-2xl relative">
              <Quote className="h-4 w-4 text-primary/30 mb-1" />
              <p className="text-xs text-muted-foreground leading-relaxed italic">{story.quote}</p>
            </div>
          </motion.div>
        ))}

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          whileTap={{ scale: 0.97 }}
          className="w-full h-12 rounded-2xl text-sm font-bold border-2 border-primary text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 mt-4"
        >
          <PenLine className="h-4 w-4" />
          Share Your Story
        </motion.button>
      </div>

      <BottomNav />
    </div>
  );
};

export default SuccessStories;
