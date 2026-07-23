/**
 * Notification Bell — Shows unread count and notification dropdown
 */

import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    setIsOpen(false);
    if (notif.fromUserId) {
      navigate(`/profile/${notif.fromUserId}`);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white active:bg-white/20 transition-colors"
      >
        <Bell className="h-4.5 w-4.5" />
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-3 z-50 w-80 max-h-96 overflow-y-auto rounded-2xl bg-card shadow-elevated border border-border/30"
          >
            <div className="sticky top-0 bg-card/95 backdrop-blur-md px-4 py-3 border-b border-border/30">
              <h3 className="font-heading font-bold text-foreground text-sm">Notifications</h3>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {notifications.slice(0, 15).map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex w-full gap-3 p-3.5 text-left transition-colors hover:bg-primary/5 ${
                      !notif.read ? 'bg-primary/3' : ''
                    }`}
                  >
                    <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                      {notif.fromUserPhoto ? (
                        <img src={notif.fromUserPhoto} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                          {notif.fromUserName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{notif.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.body}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
