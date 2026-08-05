/**
 * AdminRoles — Role Management (super_admin only)
 *
 * Promote users to admin/moderator, demote or remove roles.
 * Every change is logged to the immutable audit trail.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAction } from '@/lib/adminAudit';
import { toast } from 'sonner';
import { Shield, Search, UserPlus, ChevronDown, Loader2, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

type AppRole = 'super_admin' | 'admin' | 'moderator';

const roleColors: Record<AppRole, string> = {
  super_admin: 'text-violet-600 bg-violet-500/10',
  admin: 'text-primary bg-primary/10',
  moderator: 'text-emerald-600 bg-emerald-500/10',
};

const roleIcons: Record<AppRole, React.ElementType> = {
  super_admin: ShieldAlert,
  admin: Shield,
  moderator: ShieldCheck,
};

const AdminRoles = () => {
  const { user: adminUser } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [profileMap, setProfileMap] = useState<Map<string, any>>(new Map());

  // Add role form
  const [showAdd, setShowAdd] = useState(false);
  const [addUserId, setAddUserId] = useState('');
  const [addRole, setAddRole] = useState<AppRole>('moderator');
  const [addLoading, setAddLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRoles(data);
      // Fetch profiles
      const ids = data.map((r: any) => r.user_id);
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, photo_url, email')
          .in('user_id', ids);
        setProfileMap(new Map((profiles || []).map((p: any) => [p.user_id, p])));
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddRole = async () => {
    if (!addUserId.trim() || !adminUser) return;
    setAddLoading(true);

    await logAdminAction(adminUser.id, {
      action: 'role_change',
      targetType: 'user',
      targetId: addUserId,
      details: { new_role: addRole, op: 'grant' },
    });

    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: addUserId, role: addRole }, { onConflict: 'user_id' });

    if (error) {
      toast.error(`Failed to assign role: ${error.message}`);
    } else {
      toast.success(`Role ${addRole} granted`);
      setAddUserId('');
      setShowAdd(false);
      load();
    }
    setAddLoading(false);
  };

  const handleChangeRole = async (userId: string, newRole: AppRole) => {
    if (!adminUser) return;
    setActionLoading(userId);

    await logAdminAction(adminUser.id, {
      action: 'role_change',
      targetType: 'user',
      targetId: userId,
      details: { new_role: newRole, op: 'change' },
    });

    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) { toast.error('Failed to change role'); }
    else { toast.success(`Role updated to ${newRole}`); load(); }
    setActionLoading(null);
  };

  const handleRevoke = async (userId: string, name: string) => {
    if (!adminUser) return;
    if (!confirm(`Revoke all admin privileges from ${name}?`)) return;
    setActionLoading(userId);

    await logAdminAction(adminUser.id, {
      action: 'role_change',
      targetType: 'user',
      targetId: userId,
      details: { op: 'revoke' },
    });

    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId);
    if (error) { toast.error('Failed to revoke role'); }
    else { toast.success(`Privileges revoked from ${name}`); load(); }
    setActionLoading(null);
  };

  const filtered = roles.filter((r) => {
    const p = profileMap.get(r.user_id);
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p?.full_name || '').toLowerCase().includes(q) ||
      r.user_id.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Role Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {roles.length} admin/moderator accounts
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-saffron text-white text-sm font-bold"
        >
          <UserPlus className="h-4 w-4" />
          Grant Role
        </button>
      </div>

      {/* Add role panel */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl bg-card border border-border/30 p-5 shadow-soft"
        >
          <h3 className="font-heading text-sm font-bold text-foreground mb-4">Grant Role to User</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">User UUID</label>
              <input
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                placeholder="Paste user UUID from Auth → Users..."
                className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm border-0 font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Role</label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as AppRole)}
                className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm border-0 focus:outline-none"
              >
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              onClick={handleAddRole}
              disabled={!addUserId.trim() || addLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Grant Role
            </button>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or UUID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border/30 text-sm focus:outline-none focus:border-primary/30"
        />
      </div>

      {/* Roles list */}
      <div className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-soft">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No admin roles assigned yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {filtered.map((r, i) => {
              const profile = profileMap.get(r.user_id);
              const RoleIcon = roleIcons[r.role as AppRole] || Shield;
              return (
                <motion.div
                  key={r.id || r.user_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors"
                >
                  <img
                    src={profile?.photo_url || '/placeholder.svg'}
                    alt=""
                    className="h-10 w-10 rounded-xl object-cover bg-muted flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {profile?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{r.user_id}</p>
                  </div>

                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full capitalize ${roleColors[r.role as AppRole] || ''}`}>
                    <RoleIcon className="h-3 w-3" />
                    {r.role.replace('_', ' ')}
                  </span>

                  {/* Role selector */}
                  <div className="relative">
                    <select
                      value={r.role}
                      onChange={(e) => handleChangeRole(r.user_id, e.target.value as AppRole)}
                      disabled={actionLoading === r.user_id}
                      className="rounded-lg bg-muted px-3 py-1.5 text-xs border-0 focus:outline-none pr-7 appearance-none cursor-pointer"
                    >
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                  </div>

                  <button
                    onClick={() => handleRevoke(r.user_id, profile?.full_name || 'User')}
                    disabled={actionLoading === r.user_id}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors flex-shrink-0"
                    title="Revoke all privileges"
                  >
                    {actionLoading === r.user_id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRoles;
