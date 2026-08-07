import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { HiMail, HiArrowNarrowLeft } from 'react-icons/hi';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setResetToken('');
    try {
      const res = await api.post('/auth/forgot-password', { email: data.email });
      toast.success(res.data.message);
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-slate-900 dark:to-slate-950 p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700/30 p-8 transition-colors duration-200">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 uppercase tracking-wider mb-4"
          >
            <HiArrowNarrowLeft className="mr-1.5 h-4 w-4" />
            Back to Login
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
            Forgot Password
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
            Enter your email address and we'll generate a reset code for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <HiMail className="h-5 w-5" />
              </span>
              <input
                type="email"
                placeholder="registered@college.edu"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
                })}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
          >
            {loading ? 'Processing...' : 'Send Reset Code'}
          </button>
        </form>

        {resetToken && (
          <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl">
            <h4 className="text-amber-800 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-1.5">
              Demo Helper: Reset Code Found
            </h4>
            <p className="text-slate-600 dark:text-slate-300 text-xs mb-3">
              Since email servers are mocked, the token has been returned. Click below to reset your password.
            </p>
            <Link
              to={`/reset-password/${resetToken}`}
              className="inline-flex w-full justify-center items-center py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Go to Password Reset Page
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
