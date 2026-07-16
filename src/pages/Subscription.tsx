import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Check, Crown, Star, Zap, X } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "",
    icon: Star,
    gradient: false,
    features: ["Browse limited profiles", "1 interest per day", "Basic search filters"],
    missing: ["Chat access", "See viewers", "Priority listing"],
  },
  {
    name: "Silver",
    price: "₹399",
    period: "/ 3 months",
    icon: Zap,
    gradient: false,
    features: ["10 interests per day", "View contact on match", "Advanced filters", "See who viewed you"],
    missing: ["Unlimited interests", "Priority listing"],
  },
  {
    name: "Gold",
    price: "₹799",
    period: "/ 6 months",
    icon: Crown,
    gradient: true,
    popular: true,
    features: ["Unlimited interests", "Chat with matches", "Hide from non-members", "Advanced filters", "Who viewed you"],
    missing: ["Priority listing"],
  },
  {
    name: "Diamond",
    price: "₹1,499",
    period: "/ year",
    icon: Crown,
    gradient: false,
    diamond: true,
    features: ["All Gold features", "Priority listing", "Dedicated support", "Monthly boost", "Video calls"],
    missing: [],
  },
];

const Subscription = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("Gold");

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-heading text-lg font-bold text-foreground">Premium Plans</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-5 space-y-3">
        <p className="text-sm text-muted-foreground text-center mb-2">Find your match faster with premium</p>

        {plans.map((plan, i) => (
          <button key={plan.name} onClick={() => setSelected(plan.name)}
            className={`w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
              selected === plan.name ? "ring-2 ring-primary shadow-medium" : "shadow-soft"
            } ${plan.gradient ? "gradient-saffron text-white" : plan.diamond ? "gradient-gold text-accent-foreground" : "bg-card text-foreground"}`}
            style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s both` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <plan.icon className="h-5 w-5" />
                <span className="font-heading text-base font-bold">{plan.name}</span>
                {plan.popular && <span className="rounded-lg bg-white/20 px-2 py-0.5 text-[9px] font-bold">POPULAR</span>}
              </div>
              <div className="text-right">
                <span className="font-heading text-lg font-extrabold">{plan.price}</span>
                <span className="text-xs opacity-60">{plan.period}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs">
                  <Check className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
              {plan.missing.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs opacity-40">
                  <X className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="line-through">{f}</span>
                </div>
              ))}
            </div>
          </button>
        ))}

        <button className="w-full h-13 rounded-2xl text-sm font-bold gradient-saffron text-white shadow-glow-primary active:scale-[0.97] transition-transform mt-4">
          Subscribe to {selected}
        </button>
        <p className="text-center text-[10px] text-muted-foreground">Payment coming soon</p>
      </div>

      <BottomNav />
    </div>
  );
};

export default Subscription;
