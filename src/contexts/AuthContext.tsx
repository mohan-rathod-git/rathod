import { createContext, useCallback, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const profileFetchedRef = useRef(false);

  const fetchProfile = useCallback(async (authUser: User) => {
    // Avoid duplicate fetches
    if (profileFetchedRef.current) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (!mountedRef.current) return;

    if (data) {
      setProfile(data);
      profileFetchedRef.current = true;
      return;
    }

    // Profile might not exist yet after signup — single retry after 300ms
    if (!data && !error) {
      await new Promise((r) => setTimeout(r, 300));
      if (!mountedRef.current) return;

      const { data: retryData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (mountedRef.current) {
        setProfile(retryData ?? null);
        if (retryData) profileFetchedRef.current = true;
      }
    } else {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    profileFetchedRef.current = false; // Allow re-fetch
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (mountedRef.current) {
      setProfile(data ?? null);
      profileFetchedRef.current = true;
    }
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    profileFetchedRef.current = false;

    // Get initial session synchronously if cached
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mountedRef.current) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer to avoid Supabase client deadlock
          setTimeout(() => {
            if (mountedRef.current) fetchProfile(session.user);
          }, 0);
        } else {
          setProfile(null);
          profileFetchedRef.current = false;
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mountedRef.current) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).finally(() => {
          if (mountedRef.current) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    profileFetchedRef.current = false;
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
