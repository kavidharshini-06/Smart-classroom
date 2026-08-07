import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiSun, HiMoon } from 'react-icons/hi';

const Login = () => {
  const { login } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setBtnLoading(true);
    try {
      const loggedUser = await login(data.email, data.password);
      if (loggedUser.role === 'Admin') navigate('/admin/dashboard');
      else if (loggedUser.role === 'Faculty') navigate('/faculty/dashboard');
      else if (loggedUser.role === 'Student') navigate('/student/dashboard');
    } catch (err) {
      // toast is already fired in context
      console.error(err);
    } finally {
      setBtnLoading(false);
    }
  };

  // Helper function to fill credentials for testing
  const quickFill = (role) => {
    if (role === 'Admin') {
      setValue('email', 'admin@college.edu');
      setValue('password', 'Admin@123');
    } else if (role === 'Faculty') {
      setValue('email', 'faculty@college.edu');
      setValue('password', 'Faculty@123');
    } else if (role === 'Student') {
      setValue('email', 'student@college.edu');
      setValue('password', 'Student@123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-slate-900 dark:to-slate-950 p-4 relative transition-colors duration-200">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform"
        aria-label="Toggle theme"
      >
        {darkMode ? <HiSun className="h-5 w-5 text-amber-400" /> : <HiMoon className="h-5 w-5 text-slate-700" />}
      </button>

      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700/30 p-8 transition-colors duration-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-2xl text-white mb-3 shadow-lg shadow-primary-500/20">
            <span className="text-3xl font-extrabold tracking-wider">S</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
            EduSchedule Portal
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Smart Classroom & Timetable Scheduler
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email field */}
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
                placeholder="you@college.edu"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
                })}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
          </div>

          {/* Password field */}
          <div>
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <HiLockClosed className="h-5 w-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={btnLoading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
          >
            {btnLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Helper Panel */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
          <p className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">
            Demo Quick Fills
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => quickFill('Admin')}
              className="py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:border-primary-300 dark:hover:border-primary-900 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Admin
            </button>
            <button
              onClick={() => quickFill('Faculty')}
              className="py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:border-primary-300 dark:hover:border-primary-900 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Faculty
            </button>
            <button
              onClick={() => quickFill('Student')}
              className="py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:border-primary-300 dark:hover:border-primary-900 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
