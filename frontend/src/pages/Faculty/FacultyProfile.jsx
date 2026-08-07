import React, { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiUserCircle, HiLockClosed } from 'react-icons/hi';

const FacultyProfile = () => {
  const { user } = useAuth();
  const [btnLoading, setBtnLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const newPassword = watch('newPassword');

  const onSubmitPassword = async (data) => {
    setBtnLoading(true);
    try {
      await api.put('/auth/update-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password updated successfully');
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
            Profile Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            View your registry details or update login passwords.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registry Details (Left Card) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl shadow-md text-left space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-4">
              <HiUserCircle className="h-16 w-16 text-slate-350 dark:text-slate-600" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {user?.profile?.facultyName || user?.name}
                </h2>
                <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-0.5">
                  ID: {user?.profile?.facultyId || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Email Address
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  {user?.profile?.email || user?.email}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Phone Number
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  {user?.profile?.phone || 'N/A'}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Academic Department
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  {user?.profile?.department?.departmentName || 'N/A'}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Portal Login Role
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  {user?.role}
                </span>
              </div>
            </div>

            {/* Assigned subjects */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Assigned Subjects Curriculum
              </span>
              <div className="flex flex-wrap gap-2">
                {user?.profile?.subjects && user.profile.subjects.length > 0 ? (
                  user.profile.subjects.map(sub => (
                    <span
                      key={sub._id || sub}
                      className="px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg"
                    >
                      {sub.subjectCode} - {sub.subjectName} ({sub.type})
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs">No subjects assigned.</span>
                )}
              </div>
            </div>
          </div>

          {/* Change Password Card (Right Column) */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl shadow-md text-left">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <HiLockClosed className="h-5 w-5 text-primary-500" />
              Change Password
            </h2>

            <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('currentPassword', { required: 'Current password is required' })}
                />
                {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                />
                {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('confirmPassword', {
                    required: 'Confirm new password',
                    validate: (val) => val === newPassword || 'Passwords do not match',
                  })}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={btnLoading}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-75"
              >
                {btnLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FacultyProfile;
