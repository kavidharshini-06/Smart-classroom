import React from 'react';

export const CardSkeleton = () => {
  return (
    <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-md rounded-2xl animate-pulse">
      <div className="flex items-center">
        <div className="h-14 w-14 rounded-xl bg-slate-200 dark:bg-slate-700 mr-5"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="w-full bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-md rounded-2xl overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700"></div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton = () => {
  return (
    <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-md rounded-2xl animate-pulse">
      <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
      <div className="h-64 bg-slate-100 dark:bg-slate-700/35 rounded-xl flex items-end justify-between p-4 gap-2">
        <div className="h-1/3 w-8 bg-slate-200 dark:bg-slate-700 rounded-t"></div>
        <div className="h-2/3 w-8 bg-slate-200 dark:bg-slate-700 rounded-t"></div>
        <div className="h-1/2 w-8 bg-slate-200 dark:bg-slate-700 rounded-t"></div>
        <div className="h-4/5 w-8 bg-slate-200 dark:bg-slate-700 rounded-t"></div>
        <div className="h-3/4 w-8 bg-slate-200 dark:bg-slate-700 rounded-t"></div>
      </div>
    </div>
  );
};
