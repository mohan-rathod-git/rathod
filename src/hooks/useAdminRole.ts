/**
 * useAdminRole — Admin role checker with idle timeout
 *
 * Queries `user_roles` table to determine the current user's admin role.
 * Implements 30-minute idle timeout that forces re-authentication.
 *
 * Role hierarchy:
 *   super_admin > admin > moderator > user (no access)
 *
 * Auto-provisions super_admin for the default admin phone (8088291011).
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

/** The default super admin phone number — always gets super_admin role */
const DEFAULT_SUPER_ADMIN_PHONES = ['8088291011', '+918088291011', '918088291011'];

/** Role priority — higher number = higher privilege */
const ROLE_PRIORITY: Record<string, number> = {
  moderator: 1,
  admin: 2,
  super_admin: 3,
};

export function useAdminRole(): AdminRoleState {
  const { user, profile } = useAuth();
  const [role, setRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const provisionedRef = useRef(false);

  // Check if current user is the default super admin by phone
  const isDefaultSuperAdmin = useCallback((): boolean => {
    const userPhone = user?.phone || profile?.phone || '';
    return DEFAULT_SUPER_ADMIN_PHONES.some(
      (p) => userPhone === p || userPhone.endsWith(p)
    );
  }, [user, profile]);

  // Auto-provision super_admin for default admin phone
  const autoProvisionSuperAdmin = useCallback(async () => {
    if (!user || provisionedRef.current) return;
    if (!isDefaultSuperAdmin()) return;

    provisionedRef.current = true;

    try {
      // Check if super_admin role already exists for this user
      const { data: existing } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin' as any);

      if (existing && existing.length > 0) return; // Already has super_admin

      // Insert super_admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'super_admin' as any });

      if (error && !error.message.includes('duplicate')) {
        console.error('Failed to auto-provision super_admin:', error);
      } else {
        console.log('[AdminRole] Auto-provisioned super_admin for default admin phone');
      }
    } catch (err) {
      console.error('Auto-provision error:', err);
    }
  }, [user, isDefaultSuperAdmin]);

  // Fetch role from user_roles table
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      // Auto-provision super_admin for default phone BEFORE fetching roles
      await autoProvisionSuperAdmin();

      try {
        // Fetch ALL admin roles for this user (they may have multiple)
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['super_admin', 'admin', 'moderator']);

        if (error) {
          console.error('Failed to fetch admin role:', error);
          setRole(null);
        } else if (data && data.length > 0) {
          // Pick the highest-privilege role
          let highestRole: AdminRole = null;
          let highestPriority = 0;
          for (const row of data) {
            const priority = ROLE_PRIORITY[row.role as string] || 0;
            if (priority > highestPriority) {
              highestPriority = priority;
              highestRole = row.role as AdminRole;
            }
          }
          
          if (isDefaultSuperAdmin()) {
            setRole('super_admin');
          } else {
            setRole(highestRole);
          }
        } else {
          if (isDefaultSuperAdmin()) {
            setRole('super_admin');
          } else {
            setRole(null);
          }
        }
      } catch (err) {
        console.error('Admin role check error:', err);
        if (isDefaultSuperAdmin()) {
          setRole('super_admin');
        } else {
          setRole(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user, autoProvisionSuperAdmin]);

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
