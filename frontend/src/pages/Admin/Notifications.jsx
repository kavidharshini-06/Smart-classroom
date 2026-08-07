import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Modal from '../../components/Modal';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import api from '../../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiPlus, HiBell } from 'react-icons/hi';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
    } catch (error) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openAddModal = () => {
    reset();
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setBtnLoading(true);
    try {
      await api.post('/notifications', data);
      toast.success('Announcement broadcasted successfully');
      setModalOpen(false);
      fetchAnnouncements();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              Broadcasting Center
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Publish system-wide notifications or targeted announcements for students and faculty.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-md transition-transform hover:-translate-y-0.5"
          >
            <HiPlus className="h-5 w-5" />
            Send Announcement
          </button>
        </div>

        {/* Announcement Feed */}
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="space-y-4">
            <h2 className="text-md font-extrabold text-slate-800 dark:text-white mb-2 pl-1">
              Announcement History ({notifications.length})
            </h2>

            {notifications.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-10 text-center rounded-3xl text-slate-400 text-sm">
                No announcements broadcasted yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className="p-5 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-sm text-left flex gap-4"
                  >
                    <div className="p-3.5 bg-primary-50 dark:bg-primary-950/20 text-primary-500 rounded-xl h-fit">
                      <HiBell className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                          {notif.title}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-400">
                        Audience: {notif.recipientRole === 'All' ? 'All Roles' : notif.recipientRole}
                      </span>
                      
                      <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed pt-1.5">
                        {notif.message}
                      </p>
                      
                      <div className="text-[9px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/50 mt-3 flex justify-between">
                        <span>Sender: {notif.sender?.name} ({notif.sender?.role})</span>
                        <span>Read by: {notif.readBy.length} users</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Form */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Compose Announcement"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                Announcement Title
              </label>
              <input
                type="text"
                placeholder="e.g. Schedule Update - Mid-term Exams"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                Audience Group
              </label>
              <select
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                {...register('recipientRole', { required: 'Audience Group is required' })}
              >
                <option value="All">All Users (Students + Faculty)</option>
                <option value="Faculty">Faculty Only</option>
                <option value="Student">Students Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                Message Content
              </label>
              <textarea
                rows="4"
                placeholder="Enter details here..."
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                {...register('message', { required: 'Message is required' })}
              />
              {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-250 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={btnLoading}
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-md shadow-primary-500/10 disabled:opacity-75"
              >
                {btnLoading ? 'Broadcasting...' : 'Send Announcement'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
