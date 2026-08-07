import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass = 'bg-primary-500 text-white' }) => {
  return (
    <div className="flex items-center p-6 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-md rounded-2xl transition-transform hover:-translate-y-1 hover:shadow-lg duration-250">
      <div className={`p-4 rounded-xl mr-5 shadow-inner ${colorClass}`}>
        <Icon className="h-6 w-6 flex-shrink-0" />
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {title}
        </p>
        <p className="text-2xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
