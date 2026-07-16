import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getPostAuthRoute } from "@/lib/profileUtils";

const Splash = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, loading } = useAuth();
  const [phase, setPhase] = useState(0);

  // Faster animation phases: 100ms → phase 1, 800ms → phase 2
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Navigate away as soon as both animation and auth are ready, with safety timeout
  useEffect(() => {
    // Safety: never stay on splash longer than 4 seconds
    const safetyTimer = setTimeout(() => {
      navigate(session ? getPostAuthRoute(profile) : "/login", { replace: true });
    }, 4000);

    if (phase >= 2 && !loading) {
      clearTimeout(safetyTimer);
      const redirectTo = (location.state as { redirectTo?: string } | null)?.redirectTo;
      const isPublicRedirect = redirectTo && ["/login", "/register", "/forgot-password", "/reset-password"].some((path) => redirectTo.startsWith(path));
      const destination = isPublicRedirect ? redirectTo : session ? getPostAuthRoute(profile) : "/login";
      const t = setTimeout(() => navigate(destination || "/login", { replace: true }), 150);
      return () => { clearTimeout(t); clearTimeout(safetyTimer); };
    }

    return () => clearTimeout(safetyTimer);
  }, [phase, loading, location.state, navigate, profile, session]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ease-out ${phase >= 2 ? "opacity-0 scale-105" : "opacity-100 scale-100"}`}
      style={{ background: "linear-gradient(145deg, hsl(14 80% 52%) 0%, hsl(355 50% 32%) 50%, hsl(20 25% 10%) 100%)" }}>

      <div className="absolute inset-0 flex items-center justify-center">
        {[320, 260, 200, 140].map((size, i) => (
          <div
            key={size}
            className="absolute rounded-full border"
            style={{
              width: size, height: size,
              borderColor: `rgba(255,255,255,${0.04 + i * 0.02})`,
              opacity: phase >= 1 ? 1 : 0,
              transform: phase >= 1 ? "scale(1)" : "scale(0.3)",
              transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s`,
              animation: phase >= 1 ? `spin-slow ${30 + i * 10}s linear infinite ${i % 2 === 0 ? "" : "reverse"}` : "none",
            }}
          />
        ))}
      </div>

      <div
        className="absolute"
        style={{
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, hsla(14,80%,52%,0.3) 0%, transparent 70%)",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 0.3s ease 0.1s",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-8">
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: 100, height: 100, marginLeft: -50, marginTop: -50,
              border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 20,
              opacity: phase >= 1 ? 1 : 0,
              transform: phase >= 1 ? "rotate(45deg) scale(1)" : "rotate(45deg) scale(0.5)",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s",
              animation: phase >= 1 ? "spin-slow 25s linear infinite reverse" : "none",
            }}
          />
          <div
            className="relative flex items-center justify-center"
            style={{
              width: 72, height: 72, borderRadius: 22,
              background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
              opacity: phase >= 1 ? 1 : 0,
              transform: phase >= 1 ? "scale(1)" : "scale(0.5)",
              transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1) 0.08s",
            }}
          >
            <span className="text-4xl font-heading font-extrabold text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>ब</span>
          </div>
        </div>

        <h1
          className="font-heading text-[28px] font-extrabold text-white tracking-tight"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1) 0.15s",
            textShadow: "0 2px 12px rgba(0,0,0,0.2)",
          }}
        >
          बंजारा बंधन
        </h1>

        <p
          className="mt-1.5 font-heading text-sm font-semibold tracking-[0.2em] uppercase"
          style={{
            color: "rgba(255,255,255,0.7)",
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
          }}
        >
          Banjara Bandhan
        </p>

        <div
          className="mt-6 flex items-center gap-3"
          style={{ opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.3s ease 0.25s" }}
        >
          <span className="h-px w-8 bg-white/20" />
          <p className="text-[11px] text-white/40 tracking-[0.3em] uppercase font-medium">Connecting Souls</p>
          <span className="h-px w-8 bg-white/20" />
        </div>
      </div>

      <div className="absolute bottom-20 flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="rounded-full bg-white/30"
            style={{
              width: i === 2 ? 8 : 4, height: 4, borderRadius: 4,
              opacity: phase >= 1 ? 1 : 0,
              transition: `opacity 0.3s ease ${0.25 + i * 0.04}s`,
              animation: phase >= 1 ? `pulse-glow 1.8s ease-in-out ${i * 0.15}s infinite` : "none",
            }}
          />
        ))}
      </div>

      <p
        className="absolute bottom-8 text-[10px] text-white/20 tracking-widest uppercase font-medium"
        style={{ opacity: phase >= 1 ? 1 : 0, transition: "opacity 0.3s ease 0.3s" }}
      >
        Made with ❤️ for Banjara Community
      </p>
    </div>
  );
};

export default Splash;
