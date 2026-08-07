import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import TimetableGrid from '../../components/TimetableGrid';
import { CardSkeleton, TableSkeleton } from '../../components/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  HiOutlineBookOpen,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineOfficeBuilding,
  HiOutlineDocumentReport,
  HiDownload,
} from 'react-icons/hi';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFacultySchedule = async () => {
    if (!user?.profile?._id) return;
    try {
      setLoading(true);
      const res = await api.get('/timetables', {
        params: { faculty: user.profile._id },
      });
      setSchedule(res.data.data);
    } catch (error) {
      toast.error('Failed to load teaching schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultySchedule();
  }, [user]);

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    const title = `${user?.name} - Weekly Teaching Schedule`;

    doc.setFontSize(16);
    doc.text('Smart Classroom & Timetable Scheduler', 14, 15);
    doc.setFontSize(12);
    doc.text(title, 14, 22);

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const tableRows = [];

    DAYS.forEach(day => {
      const row = [day];
      for (let p = 1; p <= 7; p++) {
        if (p === 4) {
          row.push('LUNCH BREAK');
          continue;
        }
        const slot = schedule.find(s => s.day === day && s.period === p);
        if (slot) {
          row.push(`${slot.subject?.subjectCode}\nRoom: ${slot.classroom?.roomNumber}\nDept: ${slot.department?.departmentCode} - S${slot.semester}`);
        } else {
          row.push('Free');
        }
      }
      tableRows.push(row);
    });

    doc.autoTable({
      head: [['Day', 'Period 1', 'Period 2', 'Period 3', 'Lunch', 'Period 5', 'Period 6', 'Period 7']],
      body: tableRows,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', halign: 'center', valign: 'middle' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold', width: 25 } },
    });

    doc.save(`${user?.name.replace(/\s+/g, '_')}_Schedule.pdf`);
  };

  // Excel Export
  const exportExcel = () => {
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const data = DAYS.map(day => {
      const row = { Day: day };
      for (let p = 1; p <= 7; p++) {
        if (p === 4) {
          row[`Period ${p} (12-1 PM)`] = 'LUNCH BREAK';
          continue;
        }
        const slot = schedule.find(s => s.day === day && s.period === p);
        if (slot) {
          row[`Period ${p}`] = `${slot.subject?.subjectCode} (${slot.subject?.subjectName}) - Dept: ${slot.department?.departmentCode} [Room ${slot.classroom?.roomNumber}]`;
        } else {
          row[`Period ${p}`] = 'Free';
        }
      }
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');
    
    worksheet['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 30 }];
    
    XLSX.writeFile(workbook, `${user?.name.replace(/\s+/g, '_')}_Schedule.xlsx`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <TableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  // Calculate statistics
  const assignedSubjects = user?.profile?.subjects || [];
  const weeklyTeachingHours = schedule.length; // count of scheduled slots
  const uniqueClassrooms = [...new Set(schedule.map(s => s.classroom?._id))].filter(Boolean);

  // Filter today's classes
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = new Date().getDay();
  const todayName = daysOfWeek[todayIndex];
  
  // Fallback to Monday for weekends in demo
  const targetDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(todayName) ? todayName : 'Monday';
  
  const todaysClasses = schedule
    .filter(s => s.day === targetDay)
    .sort((a, b) => a.period - b.period);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              Faculty Schedule Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Welcome, {user?.name}. View your assigned subjects, locations, and download schedules.
            </p>
          </div>

          {schedule.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={exportPDF}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 text-xs font-bold rounded-xl transition-colors"
              >
                <HiOutlineDocumentReport className="h-4.5 w-4.5 text-red-500" />
                Export PDF
              </button>
              <button
                onClick={exportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 text-xs font-bold rounded-xl transition-colors"
              >
                <HiDownload className="h-4.5 w-4.5 text-emerald-500" />
                Export Excel
              </button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center p-6 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-md rounded-2xl">
            <div className="p-4 rounded-xl mr-5 bg-primary-500 text-white shadow-inner">
              <HiOutlineBookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Assigned Subjects
              </p>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">
                {assignedSubjects.length} Courses
              </p>
            </div>
          </div>

          <div className="flex items-center p-6 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-md rounded-2xl">
            <div className="p-4 rounded-xl mr-5 bg-emerald-500 text-white shadow-inner">
              <HiOutlineClock className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Teaching Hours
              </p>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">
                {weeklyTeachingHours} Hours / Wk
              </p>
            </div>
          </div>

          <div className="flex items-center p-6 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-md rounded-2xl">
            <div className="p-4 rounded-xl mr-5 bg-indigo-500 text-white shadow-inner">
              <HiOutlineOfficeBuilding className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Classroom Locations
              </p>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">
                {uniqueClassrooms.length} Active Rooms
              </p>
            </div>
          </div>
        </div>

        {/* Content Panel: Today's schedule and Full week timetable */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Today's Schedule Card (Left Column) */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl shadow-md h-fit">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <HiOutlineCalendar className="h-5 w-5 text-primary-500" />
                Schedule for {targetDay}
              </h2>
              {todayName !== targetDay && (
                <span className="text-[9px] font-bold uppercase bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded">
                  Demo View
                </span>
              )}
            </div>

            <div className="space-y-3">
              {todaysClasses.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">
                  No classes scheduled.
                </p>
              ) : (
                todaysClasses.map(slot => (
                  <div
                    key={slot._id}
                    className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-750 rounded-xl text-left"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded">
                        Period {slot.period}
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350">
                        Room {slot.classroom?.roomNumber}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                      {slot.subject?.subjectName}
                    </h4>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">
                      Dept: {slot.department?.departmentCode} • Sem {slot.semester} ({slot.section})
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Full Week Schedule Grid (Right 3 Columns) */}
          <div className="xl:col-span-3 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white text-left pl-1">
              Complete Weekly Schedule Grid
            </h2>
            <TimetableGrid timetableSlots={schedule} isAdmin={false} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
