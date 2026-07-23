/**
 * AdminLayout — Shared shell for all admin pages
 *
 * Provides:
 * - Sidebar navigation (desktop) / bottom sheet nav (mobile)
 * - Breadcrumbs
 * - Admin watermark
 * - Realtime connection indicator
 */

import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Flag,
  Megaphone,
  BarChart3,
  ScrollText,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Shield,
  Layout,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  requiredRole: 'moderator' | 'admin' | 'super_admin';
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, requiredRole: 'moderator' },
  { label: 'Users', path: '/admin/users', icon: Users, requiredRole: 'moderator' },
  { label: 'Verification', path: '/admin/verification', icon: ShieldCheck, requiredRole: 'moderator' },
  { label: 'Reports', path: '/admin/reports', icon: Flag, requiredRole: 'moderator' },
  { label: 'Broadcasts', path: '/admin/broadcasts', icon: Megaphone, requiredRole: 'admin' },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3, requiredRole: 'admin' },
  { label: 'Audit Log', path: '/admin/audit-log', icon: ScrollText, requiredRole: 'admin' },
  { label: 'Landing Hero', path: '/admin/landing', icon: Layout, requiredRole: 'admin' },
];

const AdminLayout = () => {
  const { role, isAdmin, isSuperAdmin } = useAdminRole();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter nav items by role
  const visibleNav = navItems.filter((item) => {
    if (item.requiredRole === 'super_admin') return isSuperAdmin;
    if (item.requiredRole === 'admin') return isAdmin;
    return true; // moderator sees moderator items
  });

  // Breadcrumb from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    path: '/' + pathSegments.slice(0, i + 1).join('/'),
  }));

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-sm font-bold text-foreground">Admin Panel</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Moderator'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold shadow-soft'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 border-t border-border/30 space-y-1">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          <span>Back to App</span>
        </NavLink>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5 transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* ADMIN VIEW watermark */}
      <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none flex justify-center">
        <div className="bg-amber-500/90 text-white text-[10px] font-bold tracking-widest uppercase px-4 py-0.5 rounded-b-lg shadow-md">
          ADMIN PANEL
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border/30 lg:bg-card/50 lg:backdrop-blur-sm fixed h-full z-30">
        <NavContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-card z-50 shadow-elevated lg:hidden"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-5 right-4 h-8 w-8 flex items-center justify-center rounded-xl bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        {/* Top bar (mobile) */}
        <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/30 px-4 pt-8 pb-3 lg:pt-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-muted"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.path} className="flex items-center gap-1.5 whitespace-nowrap">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <span className={i === breadcrumbs.length - 1 ? 'text-foreground font-semibold' : ''}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
