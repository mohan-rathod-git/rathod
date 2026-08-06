/**
 * AuthCallback — Supabase OAuth & magic-link callback handler
 *
 * Handles ALL Supabase auth callback flows:
 *  1. Google OAuth implicit flow: /#access_token=... (hash fragment)
 *  2. Google OAuth PKCE flow:     /?code=...         (query param)
 *  3. Email confirmation:         /?token_hash=...   (new format)
 *  4. Password reset:             /?type=recovery    (query param)
 *  5. Magic link:                 /#access_token=... (hash fragment)
 *  6. Error:                      /?error=...        (query param)
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const searchParams = url.searchParams;

      // ─── 1. Error in query params ───
      const errorParam = searchParams.get("error") || hashParams.get("error");
      if (errorParam) {
        const desc =
          searchParams.get("error_description") ||
          hashParams.get("error_description") ||
          errorParam;
        const friendlyMsg = decodeURIComponent(desc.replace(/\+/g, " "));
        setErrorMsg(friendlyMsg);
        setStatus("error");
        toast.error(`Authentication failed: ${friendlyMsg}`);
        setTimeout(() => navigate("/login", { replace: true }), 3000);
        return;
      }

      // ─── 2. Password recovery ───
      const flowType = hashParams.get("type") || searchParams.get("type");
      if (flowType === "recovery") {
        // The SDK will have set the session from the hash; go to reset page
        navigate("/reset-password", { replace: true });
        return;
      }

      // ─── 3. Hash-based implicit flow (/#access_token=...) ───
      // This is what Supabase sends when the redirect URL is the app root.
      // The SDK automatically reads the hash via detectSessionFromUrl,
      // but we need to call getSession() AFTER a tick to let it process.
      const hashAccessToken = hashParams.get("access_token");
      if (hashAccessToken) {
        // Give the Supabase SDK time to parse the hash and set localStorage
        await new Promise((r) => setTimeout(r, 50));

        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          // Manually set the session from the hash tokens
          const { data: setData, error: setError } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashParams.get("refresh_token") || "",
          });

          if (setError || !setData.session) {
            setErrorMsg("Failed to establish session. Please try again.");
            setStatus("error");
            setTimeout(() => navigate("/login", { replace: true }), 3000);
            return;
          }

          await postLoginRedirect(setData.session.user);
          return;
        }

        await postLoginRedirect(data.session.user);
        return;
      }

      // ─── 4. PKCE flow (/?code=...) ───
      const code = searchParams.get("code");
      if (code) {
        // The SDK exchanges the code automatically on getSession()
        await new Promise((r) => setTimeout(r, 100));
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          // Listen for the auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              subscription.unsubscribe();
              if (event === "SIGNED_IN" && session?.user) {
                await postLoginRedirect(session.user);
              } else if (event === "PASSWORD_RECOVERY") {
                navigate("/reset-password", { replace: true });
              } else {
                setErrorMsg("Authentication failed. Please try again.");
                setStatus("error");
                setTimeout(() => navigate("/login", { replace: true }), 3000);
              }
            }
          );
          return;
        }
        await postLoginRedirect(data.session.user);
        return;
      }

      // ─── 5. Already have a session (e.g., navigated here directly) ───
      const { data, error } = await supabase.auth.getSession();
      if (data.session?.user) {
        await postLoginRedirect(data.session.user);
        return;
      }

      // ─── 6. No token found — listen for auth state change ───
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          subscription.unsubscribe();
          if (event === "SIGNED_IN" && session?.user) {
            await postLoginRedirect(session.user);
          } else if (event === "PASSWORD_RECOVERY") {
            navigate("/reset-password", { replace: true });
          } else {
            setErrorMsg("No authentication token found. Please try again.");
            setStatus("error");
            setTimeout(() => navigate("/login", { replace: true }), 3000);
          }
        }
      );
    };

    const postLoginRedirect = async (user: any) => {
      try {
        // Ensure profile row exists (critical for Google OAuth users who have no profile yet)
        const { ensureProfileRow } = await import("@/lib/profilePersistence");
        await ensureProfileRow(user, {
          email: user.email ?? null,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        });

        const { data: profile } = await supabase
          .from("profiles")
          .select("registration_step, profile_completion")
          .eq("user_id", user.id)
          .maybeSingle();

        toast.success("Welcome! You're signed in.");

        // Route based on profile completion
        if (!profile || !profile.registration_step || profile.registration_step <= 1) {
          navigate("/register", { replace: true });
        } else if (profile.registration_step === 2) {
          navigate("/register/step2", { replace: true });
        } else if (profile.registration_step === 3) {
          navigate("/register/step3", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch {
        navigate("/", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
      {status === "loading" ? (
        <>
          {/* Branded loading */}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
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
          <a
            href="/login"
            className="px-6 py-3 rounded-2xl gradient-saffron text-white text-sm font-bold shadow-glow-primary"
          >
            Back to Login
          </a>
        </>
      )}
    </div>
  );
};

export default AuthCallback;
