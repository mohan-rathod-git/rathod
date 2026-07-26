/**
 * AuthCallback — Supabase OAuth & magic-link callback handler
 *
 * Supabase redirects here after:
 *  - Google OAuth sign-in
 *  - Email confirmation (signup)
 *  - Password reset link
 *
 * This page reads the hash/search params Supabase appends, lets the
 * client SDK exchange the code/token, then sends the user to the
 * correct destination.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ensureProfileRow } from "@/lib/profilePersistence";
import { getPostAuthRoute } from "@/lib/profileUtils";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      // Check URL params for error first
      const url = new URL(window.location.href);
      const errorParam = url.searchParams.get("error");
      const errorDesc = url.searchParams.get("error_description");

      if (errorParam) {
        const friendlyMsg = errorDesc?.replace(/\+/g, " ") || errorParam;
        setErrorMsg(friendlyMsg);
        setStatus("error");
        toast.error(`Authentication failed: ${friendlyMsg}`);
        setTimeout(() => navigate("/login", { replace: true }), 3000);
        return;
      }

      // Let Supabase SDK process the URL and establish the session.
      // getSession() automatically processes hash params (PKCE code / implicit token).
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        // The SDK may need to exchange a PKCE code — listen for the event
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            subscription.unsubscribe();

            if (event === "PASSWORD_RECOVERY") {
              // Redirect to the reset-password page
              navigate("/reset-password", { replace: true });
              return;
            }

            if (session?.user) {
              await postLoginRedirect(session.user);
            } else {
              setErrorMsg("Authentication failed. Please try again.");
              setStatus("error");
              setTimeout(() => navigate("/login", { replace: true }), 3000);
            }
          }
        );

        // Trigger session check again to fire the event
        await supabase.auth.getSession();
        return;
      }

      // Check if this is a password recovery flow
      if (data.session?.user?.email && url.searchParams.get("type") === "recovery") {
        navigate("/reset-password", { replace: true });
        return;
      }

      if (data.session?.user) {
        await postLoginRedirect(data.session.user);
      }
    };

    const postLoginRedirect = async (user: any) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        await ensureProfileRow(user);
      }

      toast.success("Welcome!");
      navigate(getPostAuthRoute(profile ?? ({ registration_step: 1 } as any)), {
        replace: true,
      });
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
      {status === "loading" ? (
        <>
          {/* Branded loading spinner */}
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-glow-primary">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -inset-2 rounded-3xl border-2 border-primary/30 animate-ping opacity-40" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="font-heading text-base font-bold text-foreground">
              Signing you in…
            </p>
            <p className="text-xs text-muted-foreground">
              Please wait while we verify your credentials
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </div>
          <div className="text-center space-y-1.5">
            <p className="font-heading text-base font-bold text-foreground">
              Authentication Error
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {errorMsg || "Something went wrong. Redirecting to login…"}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AuthCallback;
