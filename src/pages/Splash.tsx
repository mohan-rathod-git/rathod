import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getPostAuthRoute } from "@/lib/profileUtils";
import { motion, AnimatePresence } from "framer-motion";

const Splash = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, loading } = useAuth();
  const [phase, setPhase] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth >= 768;

  // Animation phases: 100ms → phase 1 (fade in bg), 800ms → phase 2 (loading dots)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Navigate away as soon as both animation and auth are ready, with safety timeout
  useEffect(() => {
    // Safety: never stay on splash longer than 5 seconds
    const safetyTimer = setTimeout(() => {
      navigate(session ? getPostAuthRoute(profile) : "/login", { replace: true });
    }, 5000);

    if (phase >= 2 && !loading) {
      clearTimeout(safetyTimer);
      const redirectTo = (location.state as { redirectTo?: string } | null)?.redirectTo;
      const isPublicRedirect = redirectTo && ["/login", "/register", "/forgot-password", "/reset-password"].some((path) => redirectTo.startsWith(path));
      const destination = isPublicRedirect ? redirectTo : session ? getPostAuthRoute(profile) : "/login";
      const t = setTimeout(() => navigate(destination || "/login", { replace: true }), 1500); // Give user time to see the beautiful splash
      return () => { clearTimeout(t); clearTimeout(safetyTimer); };
    }

    return () => clearTimeout(safetyTimer);
  }, [phase, loading, location.state, navigate, profile, session]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-end overflow-hidden"
      >
        {/* Full screen background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ 
            backgroundImage: `url(${isDesktop ? '/splash-desktop.jpg' : '/splash-mobile.png'})`,
          }}
        />

        {/* Loading dots overlay at the bottom */}
        <div className="relative z-10 pb-16 flex flex-col items-center gap-6 w-full">
          {/* Subtle gradient overlay at bottom to ensure dots are visible */}
          <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-black/60 to-transparent pointer-events-none -z-10" />
          
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="rounded-full bg-white/60"
                style={{
                  width: i === 2 ? 8 : 4, height: 4, borderRadius: 4,
                  opacity: phase >= 2 ? 1 : 0,
                  transition: `opacity 0.4s ease ${i * 0.1}s`,
                  animation: phase >= 2 ? `pulse-glow 1.5s ease-in-out ${i * 0.2}s infinite` : "none",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Splash;
