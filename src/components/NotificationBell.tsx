/**
 * NotificationBell — Navigates directly to /notifications page
 *
 * Clicking the bell icon navigates to the full notification page
 * instead of opening a dropdown popup. Shows unread badge count.
 */

import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => navigate('/notifications')}
      className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white active:bg-white/20 transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-[18px] w-[18px]" />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-md"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default NotificationBell;
