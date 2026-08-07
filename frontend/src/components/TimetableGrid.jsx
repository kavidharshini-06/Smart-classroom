import React from 'react';
import { HiPencil, HiTrash, HiPlus } from 'react-icons/hi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];
const LUNCH_PERIOD = 4;

const TimetableGrid = ({ timetableSlots = [], onEditSlot, onDeleteSlot, onCreateSlot, isAdmin = false }) => {
  
  // Helper to map slots into day-period coordinates
  const getSlot = (day, period) => {
    return timetableSlots.find(slot => slot.day === day && slot.period === period);
  };

  const getPeriodTime = (p) => {
    switch (p) {
      case 1: return '09:00 - 10:00';
      case 2: return '10:00 - 11:00';
      case 3: return '11:00 - 12:00';
      case 4: return '12:00 - 01:00'; // Lunch
      case 5: return '01:00 - 02:00';
      case 6: return '02:00 - 03:00';
      case 7: return '03:00 - 04:00';
      default: return '';
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
              <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-32 border-r border-slate-100 dark:border-slate-800">
                Day / Period
              </th>
              {PERIODS.map(p => (
                <th key={p} className="p-4 text-center border-r last:border-0 border-slate-100 dark:border-slate-850">
                  <span className="block text-xs font-bold text-slate-700 dark:text-white">
                    Period {p}
                  </span>
                  <span className="block text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                    {getPeriodTime(p)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
            {DAYS.map(day => (
              <tr key={day} className="hover:bg-slate-50/20">
                <td className="p-4 font-bold text-sm text-slate-850 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  {day}
                </td>
                
                {PERIODS.map(p => {
                  if (p === LUNCH_PERIOD) {
                    return (
                      <td
                        key={`${day}-${p}`}
                        className="p-3 text-center border-r last:border-0 border-slate-100 dark:border-slate-850 bg-amber-50/30 dark:bg-amber-950/5 text-amber-600 dark:text-amber-400/80 font-extrabold text-xs uppercase tracking-widest select-none"
                      >
                        Lunch Break
                      </td>
                    );
                  }

                  const slot = getSlot(day, p);

                  if (slot) {
                    return (
                      <td
                        key={`${day}-${p}`}
                        className="p-3 border-r last:border-0 border-slate-100 dark:border-slate-850 relative group transition-all"
                      >
                        <div className="h-full flex flex-col justify-between p-2.5 rounded-2xl bg-primary-50/40 dark:bg-primary-950/10 border border-primary-200/40 dark:border-primary-900/30 text-left min-h-[96px]">
                          <div>
                            <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded mb-1.5">
                              {slot.subject?.subjectCode || 'SUB'}
                            </span>
                            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight mb-1 truncate">
                              {slot.subject?.subjectName || 'Course Subject'}
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              👤 {slot.faculty?.facultyName || 'Faculty'}
                            </p>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-slate-200/30 dark:border-slate-800/40">
                            <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">
                              📍 Room {slot.classroom?.roomNumber || 'TBA'}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500">
                              {slot.department?.departmentCode || ''}-{slot.section || ''}
                            </span>
                          </div>

                          {/* Hover Admin Actions panel */}
                          {isAdmin && (
                            <div className="absolute top-2 right-2 hidden group-hover:flex gap-1 bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 p-1 rounded-xl">
                              <button
                                onClick={() => onEditSlot(slot)}
                                className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg"
                                title="Edit Slot"
                              >
                                <HiPencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteSlot(slot._id)}
                                className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 rounded-lg"
                                title="Delete Slot"
                              >
                                <HiTrash className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  }

                  // Empty Slot
                  return (
                    <td
                      key={`${day}-${p}`}
                      className="p-3 border-r last:border-0 border-slate-100 dark:border-slate-850 relative group transition-all text-center align-middle"
                    >
                      <div className="h-full flex items-center justify-center p-2 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-850 min-h-[96px]">
                        {isAdmin ? (
                          <button
                            onClick={() => onCreateSlot(day, p)}
                            className="hidden group-hover:inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-primary-600 hover:text-white dark:bg-slate-800 dark:hover:bg-primary-600 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-bold shadow-sm transition-all"
                          >
                            <HiPlus className="h-3.5 w-3.5" /> Add
                          </button>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-350 dark:text-slate-600 select-none">
                            Free
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimetableGrid;
