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
  HiOutlineAcademicCap,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUserCircle,
  HiOutlineBell,
  HiOutlineDocumentReport,
  HiDownload,
} from 'react-icons/hi';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudentDashboardData = async () => {
    if (!user?.profile) return;
    try {
      setLoading(true);
      const [scheduleRes, notifRes] = await Promise.all([
        api.get('/timetables', {
          params: {
            department: user.profile.department?._id || user.profile.department,
            semester: user.profile.semester,
            section: user.profile.section,
          },
        }),
        api.get('/notifications'),
      ]);
      setSchedule(scheduleRes.data.data);
      setAnnouncements(notifRes.data.data.slice(0, 3)); // show top 3 announcements
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDashboardData();
  }, [user]);

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    const title = `${user?.name} (${user?.profile?.registerNumber}) - Weekly Lecture Schedule`;

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
          row.push(`${slot.subject?.subjectCode}\nRoom: ${slot.classroom?.roomNumber}\n${slot.faculty?.facultyName}`);
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

    doc.save(`${user?.profile?.registerNumber}_Schedule.pdf`);
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
          row[`Period ${p}`] = `${slot.subject?.subjectCode} (${slot.subject?.subjectName}) - ${slot.faculty?.facultyName} [Room ${slot.classroom?.roomNumber}]`;
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
    
    XLSX.writeFile(workbook, `${user?.profile?.registerNumber}_Schedule.xlsx`);
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
              Student Schedule Portal
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Welcome, {user?.name}. Check your daily lectures, rooms, and announcements.
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

        {/* Stats Registry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Registry info */}
          <div className="flex items-center p-6 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-md rounded-2xl">
            <div className="p-4 rounded-xl mr-5 bg-primary-500 text-white shadow-inner">
              <HiOutlineAcademicCap className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Enrollment Details
              </p>
              <p className="text-md font-bold text-slate-800 dark:text-white">
                {user?.profile?.department?.departmentCode || 'CSE'} Department
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Register Number: {user?.profile?.registerNumber}
              </p>
            </div>
          </div>

          {/* Academic semester */}
          <div className="flex items-center p-6 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-md rounded-2xl">
            <div className="p-4 rounded-xl mr-5 bg-emerald-500 text-white shadow-inner">
              <HiOutlineCalendar className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Current Semester
              </p>
              <p className="text-md font-bold text-slate-800 dark:text-white">
                Semester {user?.profile?.semester} (Year {user?.profile?.year})
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Class Section: {user?.profile?.section}
              </p>
            </div>
          </div>

          {/* Active schedule blocks count */}
          <div className="flex items-center p-6 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-md rounded-2xl">
            <div className="p-4 rounded-xl mr-5 bg-indigo-500 text-white shadow-inner">
              <HiOutlineClock className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Weekly Class Load
              </p>
              <p className="text-md font-bold text-slate-800 dark:text-white">
                {schedule.length} Periods Scheduled
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Across Monday to Friday
              </p>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Today's schedule feeds & announcements (Left Column) */}
          <div className="xl:col-span-1 space-y-6">
            {/* Today's Schedule Card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-2xl shadow-md text-left">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
                <h2 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <HiOutlineClock className="h-5 w-5 text-primary-500" />
                  Today's Schedule ({targetDay})
                </h2>
                {todayName !== targetDay && (
                  <span className="text-[8px] font-extrabold uppercase bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">
                    Demo
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {todaysClasses.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">
                    No lectures scheduled today.
                  </p>
                ) : (
                  todaysClasses.map(slot => (
                    <div
                      key={slot._id}
                      className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-750 rounded-xl text-left"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded">
                          Period {slot.period}
                        </span>
                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-350">
                          Room {slot.classroom?.roomNumber}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {slot.subject?.subjectName}
                      </h4>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                        👤 {slot.faculty?.facultyName}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Announcements Board */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-5 rounded-2xl shadow-md text-left">
              <h2 className="text-xs font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
                <HiOutlineBell className="h-5 w-5 text-indigo-500" />
                Latest Announcements
              </h2>

              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4">
                    No announcements published.
                  </p>
                ) : (
                  announcements.map(ann => (
                    <div key={ann._id} className="text-left space-y-1">
                      <h3 className="font-bold text-xs text-slate-950 dark:text-white leading-tight">
                        {ann.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-3">
                        {ann.message}
                      </p>
                      <span className="block text-[8px] text-slate-400 pt-0.5">
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Weekly Schedule Grid (Right 3 Columns) */}
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

export default StudentDashboard;
