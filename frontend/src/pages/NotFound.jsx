import React from 'react';
import { Link } from 'react-router-dom';
import { HiHome } from 'react-icons/hi';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 transition-colors duration-200">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-primary-500 tracking-widest font-sans animate-bounce">
          404
        </h1>
        <div className="bg-amber-400 text-slate-950 px-3 py-1 text-sm font-semibold rounded rotate-12 inline-block -mt-3 mb-6">
          Page Not Found
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-4 mb-2">
          Lost in Space?
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5"
        >
          <HiHome className="h-5 w-5" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
