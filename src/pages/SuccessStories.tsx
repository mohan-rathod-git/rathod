import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Heart, PenLine, Quote } from "lucide-react";

const stories = [
  { id: 1, names: "Rahul & Meena Rathod", location: "Pune, Maharashtra", date: "March 2025", quote: "We found each other through Banjara Bandhan and it was truly destiny. Our families connected instantly because of shared values." },
  { id: 2, names: "Suresh & Kavita Pawar", location: "Hyderabad, Telangana", date: "January 2025", quote: "Being from the same Banjara community made everything easier. From matching gotras to family blessings — everything fell into place." },
  { id: 3, names: "Vikram & Priya Chavan", location: "Bangalore, Karnataka", date: "November 2024", quote: "We connected over our love for Banjara culture and traditions. The app made it so easy to find someone who shares our values." },
];

const SuccessStories = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-heading text-lg font-bold text-foreground">Success Stories</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-5 space-y-4">
        <div className="flex flex-col items-center py-4 animate-fade-up">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Heart className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-[260px]">
            Real couples who found love on Banjara Bandhan
          </p>
        </div>

        {stories.map((story, i) => (
          <div key={story.id} className="rounded-2xl bg-card shadow-soft overflow-hidden"
            style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s both` }}>
            <div className="gradient-warm p-4 pb-8">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  <div className="h-11 w-11 rounded-xl bg-card border-2 border-white/30 flex items-center justify-center text-sm font-bold text-primary">
                    {story.names.split(" & ")[0][0]}
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-card border-2 border-white/30 flex items-center justify-center text-sm font-bold text-secondary">
                    {story.names.split(" & ")[1][0]}
                  </div>
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-foreground">{story.names}</h3>
                  <p className="text-[11px] text-muted-foreground">{story.location} · {story.date}</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-3.5 -mt-4 bg-card rounded-t-2xl relative">
              <Quote className="h-4 w-4 text-primary/30 mb-1" />
              <p className="text-xs text-muted-foreground leading-relaxed">{story.quote}</p>
            </div>
          </div>
        ))}

        <button className="w-full h-12 rounded-2xl text-sm font-bold border-2 border-primary text-primary active:scale-[0.97] transition-transform flex items-center justify-center gap-2 mt-4">
          <PenLine className="h-4 w-4" />
          Share Your Story
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default SuccessStories;
