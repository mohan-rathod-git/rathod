import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Sparkles } from "lucide-react";

const rashis = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

const gunScores = [
  { name: "Varna", max: 1 }, { name: "Vashya", max: 2 }, { name: "Tara", max: 3 },
  { name: "Yoni", max: 4 }, { name: "Graha Maitri", max: 5 }, { name: "Gana", max: 6 },
  { name: "Bhakoot", max: 7 }, { name: "Nadi", max: 8 },
];

const HoroscopeMatch = () => {
  const navigate = useNavigate();
  const [yourRashi, setYourRashi] = useState("");
  const [partnerRashi, setPartnerRashi] = useState("");
  const [showResult, setShowResult] = useState(false);

  const getScore = () => {
    if (!yourRashi || !partnerRashi) return null;
    const seed = (rashis.indexOf(yourRashi) + 1) * (rashis.indexOf(partnerRashi) + 1);
    return gunScores.map((g) => ({
      ...g,
      score: Math.min(Math.round((((seed * 7 + g.max * 13) % (g.max * 3 + 1)) / (g.max * 3)) * g.max * 10) / 10, g.max),
    }));
  };

  const scores = showResult ? getScore() : null;
  const total = scores ? scores.reduce((a, s) => a + s.score, 0) : 0;
  const pct = Math.round((total / 36) * 100);
  const color = pct >= 67 ? "text-teal" : pct >= 50 ? "text-accent" : "text-destructive";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h1 className="font-heading text-lg font-bold text-foreground">Kundli Match</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-6 space-y-5">
        <div className="grid grid-cols-2 gap-3 animate-fade-up">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Your Rashi</label>
            <select value={yourRashi} onChange={(e) => { setYourRashi(e.target.value); setShowResult(false); }}
              className="flex h-12 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-soft">
              <option value="">Select</option>
              {rashis.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Partner's Rashi</label>
            <select value={partnerRashi} onChange={(e) => { setPartnerRashi(e.target.value); setShowResult(false); }}
              className="flex h-12 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground shadow-soft">
              <option value="">Select</option>
              {rashis.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <button onClick={() => yourRashi && partnerRashi && setShowResult(true)}
          disabled={!yourRashi || !partnerRashi}
          className="w-full h-13 rounded-2xl text-sm font-bold gradient-saffron text-white shadow-glow-primary active:scale-[0.97] transition-transform disabled:opacity-40 animate-fade-up-1">
          Check Compatibility
        </button>

        {showResult && scores && (
          <div className="space-y-5 animate-scale-in">
            <div className="flex flex-col items-center py-6">
              <div className={`relative flex h-32 w-32 items-center justify-center rounded-full bg-muted`}>
                <svg className="absolute inset-0" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="56" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                  <circle cx="64" cy="64" r="56" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                    strokeDasharray={`${(pct / 100) * 352} 352`} strokeLinecap="round"
                    transform="rotate(-90 64 64)" className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="text-center">
                  <p className={`font-heading text-2xl font-extrabold ${color} tabular-nums`}>{total.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground">of 36</p>
                </div>
              </div>
              <p className={`mt-4 font-heading text-sm font-bold ${color}`}>
                {pct >= 67 ? "Excellent Match! ✨" : pct >= 50 ? "Good Compatibility" : "Low Compatibility"}
              </p>
            </div>

            <div className="rounded-2xl bg-card shadow-soft p-4 space-y-3">
              <h3 className="font-heading text-sm font-bold text-foreground">Gun Milan</h3>
              {scores.map((g) => (
                <div key={g.name} className="flex items-center gap-3">
                  <span className="text-xs text-foreground w-20 font-medium">{g.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full gradient-saffron transition-all duration-700 ease-out" style={{ width: `${(g.score / g.max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground w-10 text-right tabular-nums">{g.score}/{g.max}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-[10px] text-muted-foreground italic">
              For reference only. Consult a qualified jyotishi for detailed analysis.
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default HoroscopeMatch;
