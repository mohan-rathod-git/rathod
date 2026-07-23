/**
 * useAdminRole — Admin role checker with idle timeout
 *
 * Queries `user_roles` table to determine the current user's admin role.
 * Implements 30-minute idle timeout that forces re-authentication.
 *
 * Role hierarchy:
 *   super_admin > admin > moderator > user (no access)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | null;

interface AdminRoleState {
  role: AdminRole;
  loading: boolean;
  isAdmin: boolean;        // admin or super_admin
  isModerator: boolean;    // moderator, admin, or super_admin
  isSuperAdmin: boolean;   // super_admin only
  sessionExpired: boolean;
}

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useAdminRole(): AdminRoleState {
  const { user } = useAuth();
  const [role, setRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch role from user_roles table
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['super_admin', 'admin', 'moderator'])
          .maybeSingle();

        if (error) {
          console.error('Failed to fetch admin role:', error);
          setRole(null);
        } else if (data) {
          setRole(data.role as AdminRole);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error('Admin role check error:', err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  // Track user activity for idle timeout
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setSessionExpired(false);
  }, []);

  useEffect(() => {
    if (!role) return; // Only track activity for admin users

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer, { passive: true }));

    // Check for idle every 60 seconds
    idleTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= IDLE_TIMEOUT_MS) {
        setSessionExpired(true);
      }
    }, 60_000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [role, resetIdleTimer]);

  return {
    role,
    loading,
    isAdmin: role === 'admin' || role === 'super_admin',
    isModerator: role === 'moderator' || role === 'admin' || role === 'super_admin',
    isSuperAdmin: role === 'super_admin',
    sessionExpired,
  };
}
