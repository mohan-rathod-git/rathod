import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Shield, Heart, Sparkles, Target, Star } from "lucide-react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import SEO from "@/components/SEO";
import MehendiPattern from "@/components/graphics/MehendiPattern";

const AboutUs = () => {
  const navigate = useNavigate();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Banjara Bandhan",
    "url": "https://www.banjarabandhan.in",
    "logo": "https://www.banjarabandhan.in/logo.jpg",
    "founder": {
      "@type": "Person",
      "name": "Mohan Laxman Rathod",
      "jobTitle": "Founder & CEO"
    },
    "description": "Premium Banjara Community Matrimony Platform"
  };

  const values = [
    { icon: Heart, title: "Cultural Roots", desc: "Preserving Banjara traditions while embracing modern matchmaking." },
    { icon: Shield, title: "Trust & Safety", desc: "Rigorous verification to ensure authentic and secure connections." },
    { icon: Users, title: "Community First", desc: "Built exclusively for the Banjara community, by the community." },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 overflow-y-auto">
      <SEO 
        title="About Us & Founder" 
        description="Learn more about Banjara Bandhan, our mission to unite the Banjara community, and our Founder & CEO, Mohan Laxman Rathod."
        url="https://www.banjarabandhan.in/about"
        structuredData={organizationSchema}
      />
      
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-card/85 backdrop-blur-2xl border-b border-border/30 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => navigate(-1)} 
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-colors hover:bg-muted/80"
          >
            <ArrowLeft className="h-4 w-4" />
          </motion.button>
          <h1 className="font-heading text-xl font-bold text-foreground tracking-tight">About Us</h1>
        </div>
      </div>

      {/* ── Hero Section ── */}
      <div className="relative px-6 py-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-60" />
        <MehendiPattern variant="border" color="var(--primary)" opacity={0.1} className="absolute top-4 left-1/2 -translate-x-1/2 w-[200px]" />
        
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl overflow-hidden shadow-premium bg-white ring-1 ring-border/50">
            <img src="/logo.jpg" alt="Banjara Bandhan" className="w-full h-full object-cover" />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">Connecting Souls of the Wandering Star</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Banjara Bandhan is the premier matrimony platform dedicated exclusively to the Banjara community. We bridge the gap between tradition and modernity, helping families find meaningful connections worldwide.
          </p>
        </motion.div>
      </div>

      {/* ── Values ── */}
      <div className="px-5 mb-10">
        <h3 className="font-heading text-lg font-bold text-foreground mb-4">Our Core Values</h3>
        <div className="space-y-3">
          {values.map((v, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-soft"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <v.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">{v.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{v.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Founder Section ── */}
      <div className="px-5 mb-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[2rem] bg-gradient-to-br from-card to-muted p-1 border border-border/50 overflow-hidden relative"
        >
          {/* Decorative background */}
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Target className="w-32 h-32" />
          </div>

          <div className="bg-card rounded-[1.8rem] p-6 h-full relative z-10 shadow-soft">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Leadership</span>
            </div>

            <h3 className="font-heading text-2xl font-bold text-foreground">Mohan Laxman Rathod</h3>
            <p className="text-sm font-semibold text-primary mb-4">Founder & CEO</p>

            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Driven by a profound vision to unify and uplift the Banjara community, Mohan Laxman Rathod founded Banjara Bandhan to create a trusted space where cultural values and modern relationships intersect.
              </p>
              <p>
                Recognizing the challenges families face in finding verified, culturally-aligned matches in the digital age, Mohan conceptualized a platform that prioritizes safety, authenticity, and heritage. Under his leadership, Banjara Bandhan has evolved into a premium matrimony service that thousands trust.
              </p>
              <p>
                His ongoing mission is to leverage technology to bring the wandering stars closer, ensuring that every Banjara family can find their perfect bond with dignity and joy.
              </p>
            </div>
            
            <div className="mt-8 flex items-center gap-3 pt-6 border-t border-border/50">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">"Empowering our community, one bond at a time."</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AboutUs;
