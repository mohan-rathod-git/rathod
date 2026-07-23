/**
 * AdminUsers — Section 3: User Management
 *
 * Server-side paginated, searchable user table.
 * Designed to stay fast at 10,000+ rows.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAction } from '@/lib/adminAudit';
import { toast } from 'sonner';
import {
  Search, ChevronLeft, ChevronRight, ShieldCheck, Ban, Eye, Loader2, Filter, X,
} from 'lucide-react';
import { motion } from 'framer-motion';

const PAGE_SIZE = 20;

const AdminUsers = () => {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    verification: '' as '' | 'verified' | 'unverified',
    status: '' as '' | 'active' | 'suspended' | 'banned',
  });

  // Ban modal state
  const [banModal, setBanModal] = useState<{ userId: string; name: string } | null>(null);
  const [banReason, setBanReason] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    // Server-side search
    if (search.trim()) {
      query = query.or(
        `full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%,user_id.eq.${search.trim()}`
      );
    }

    // Filters
    if (filters.verification === 'verified') {
      query = query.eq('is_verified', true);
    } else if (filters.verification === 'unverified') {
      query = query.eq('is_verified', false);
    }

    if (filters.status === 'banned') {
      query = query.eq('registration_step', -2);
    } else if (filters.status === 'suspended') {
      query = query.eq('registration_step', -1);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } else {
      setUsers(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [page, search, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleBan = async () => {
    if (!banModal || !banReason.trim() || !adminUser) return;
    setActionLoading(banModal.userId);

    // Log to audit trail first
    await logAdminAction(adminUser.id, {
      action: 'ban_user',
      targetType: 'user',
      targetId: banModal.userId,
      details: { reason: banReason, user_name: banModal.name },
    });

    // Mark as banned (registration_step = -2)
    const { error } = await supabase
      .from('profiles')
      .update({ registration_step: -2 } as any)
      .eq('user_id', banModal.userId);

    if (error) {
      toast.error('Failed to ban user');
    } else {
      toast.success(`${banModal.name} has been banned`);
      fetchUsers();
    }

    setActionLoading(null);
    setBanModal(null);
    setBanReason('');
  };

  const handleVerify = async (userId: string, name: string) => {
    if (!adminUser) return;
    setActionLoading(userId);

    await logAdminAction(adminUser.id, {
      action: 'verify_user',
      targetType: 'user',
      targetId: userId,
      details: { user_name: name },
    });

    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to verify user');
    } else {
      toast.success(`${name} verified`);
      fetchUsers();
    }
    setActionLoading(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground">
          {totalCount.toLocaleString()} total users
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or user ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 focus:shadow-soft transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/30 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-5 p-4 rounded-2xl bg-card border border-border/30 flex flex-wrap gap-4"
        >
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Verification</label>
            <select
              value={filters.verification}
              onChange={(e) => { setFilters(f => ({ ...f, verification: e.target.value as any })); setPage(0); }}
              className="rounded-xl bg-muted px-3 py-2 text-sm border-0"
            >
              <option value="">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Status</label>
            <select
              value={filters.status}
              onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value as any })); setPage(0); }}
              className="rounded-xl bg-muted px-3 py-2 text-sm border-0"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <button
            onClick={() => { setFilters({ verification: '', status: '' }); setPage(0); }}
            className="self-end text-xs text-primary font-semibold hover:underline"
          >
            Clear filters
          </button>
        </motion.div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Location</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Joined</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    <td className="px-4 py-3"><div className="h-5 w-32 bg-muted rounded animate-pulse" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><div className="h-5 w-24 bg-muted rounded animate-pulse" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-5 w-16 bg-muted rounded animate-pulse" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-5 w-20 bg-muted rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-20 bg-muted rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.user_id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.photo_url || '/placeholder.svg'}
                          alt=""
                          className="h-9 w-9 rounded-xl object-cover bg-muted"
                        />
                        <div>
                          <p className="font-semibold text-foreground">{u.full_name || 'Unnamed'}</p>
                          <p className="text-[10px] text-muted-foreground">{u.email || u.user_id?.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {u.city_village ? `${u.city_village}, ${u.state}` : u.state || '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        {u.is_verified && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="h-3 w-3" /> Verified
                          </span>
                        )}
                        {u.registration_step === -2 && (
                          <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                            Banned
                          </span>
                        )}
                        {u.is_online && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500" title="Online" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/profile/${u.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                          title="View profile"
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                        {!u.is_verified && (
                          <button
                            onClick={() => handleVerify(u.user_id, u.full_name)}
                            disabled={actionLoading === u.user_id}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-emerald-500/10 transition-colors"
                            title="Verify user"
                          >
                            {actionLoading === u.user_id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                          </button>
                        )}
                        {u.registration_step !== -2 && (
                          <button
                            onClick={() => setBanModal({ userId: u.user_id, name: u.full_name || 'User' })}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors"
                            title="Ban user"
                          >
                            <Ban className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-card border border-border/30 disabled:opacity-40 hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-foreground px-2">
              {page + 1} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-card border border-border/30 disabled:opacity-40 hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Ban confirmation modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setBanModal(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-card rounded-2xl shadow-elevated border border-border/30 p-6 max-w-md w-full"
          >
            <button onClick={() => setBanModal(null)} className="absolute top-4 right-4">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Ban className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-foreground">Ban User</h3>
                <p className="text-xs text-muted-foreground">Banning <strong>{banModal.name}</strong></p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Reason (required, logged to audit trail)
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Describe the reason for banning this user..."
                  rows={3}
                  className="w-full rounded-xl bg-muted px-4 py-3 text-sm border-0 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setBanModal(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBan}
                  disabled={!banReason.trim() || actionLoading === banModal.userId}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-destructive hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === banModal.userId ? 'Banning...' : 'Confirm Ban'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
