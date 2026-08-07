import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import {
  HiMenu,
  HiOutlineBell,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineLogout,
  HiCheck,
} from 'react-icons/hi';

const Navbar = ({ toggleSidebar }) => {
  const { logout, user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.slice(0, 5)); // show top 5
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set polling interval for updates every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 transition-colors duration-200">
      {/* Left side: hamburger menu & title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <HiMenu className="h-6 w-6" />
        </button>
        <span className="hidden sm:block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          ERP System
        </span>
      </div>

      {/* Right side: theme, notifications, profile */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
          aria-label="Toggle theme"
        >
          {darkMode ? <HiOutlineSun className="h-5 w-5 text-amber-400" /> : <HiOutlineMoon className="h-5 w-5" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
            aria-label="Notifications"
          >
            <HiOutlineBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-4 shadow-xl ring-1 ring-black/5 transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2 mb-3">
                <h3 className="font-bold text-sm text-slate-950 dark:text-white">
                  Recent Announcements
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline flex items-center gap-0.5"
                  >
                    <HiCheck className="h-4 w-4" />
                    Read All
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">
                    No notifications available
                  </p>
                ) : (
                  notifications.map((notif) => {
                    const isRead = notif.readBy.some(id => id.toString() === user?.id?.toString());
                    return (
                      <div
                        key={notif._id}
                        onClick={() => !isRead && handleMarkAsRead(notif._id)}
                        className={`p-2.5 rounded-xl text-left transition-all ${
                          isRead
                            ? 'bg-slate-50/50 dark:bg-slate-900/30'
                            : 'bg-primary-50/40 dark:bg-primary-950/10 border-l-2 border-primary-500 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-950/20'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-0.5">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* User Profile display */}
        <div className="flex items-center gap-2 pl-1">
          <div className="hidden md:block text-right">
            <p className="text-xs font-bold text-slate-800 dark:text-white">{user?.name}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
              {user?.role}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-xl p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
            title="Log Out"
          >
            <HiOutlineLogout className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
