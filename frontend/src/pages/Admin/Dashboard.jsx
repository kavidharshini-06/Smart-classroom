import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/StatCard';
import { CardSkeleton, ChartSkeleton } from '../../components/LoadingSkeleton';
import api from '../../services/api';
import {
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineHome,
  HiOutlineCalendar,
  HiOutlineClock,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [utilization, setUtilization] = useState([]);
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, utilRes, workRes] = await Promise.all([
          api.get('/reports/dashboard-stats'),
          api.get('/reports/classroom-utilization'),
          api.get('/reports/faculty-workload'),
        ]);

        setStats(statsRes.data.data);
        setUtilization(utilRes.data.data);
        setWorkloads(workRes.data.data);
      } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Pre-process chart data
  // Classroom utilization chart data: top 8 utilized rooms
  const roomChartData = [...utilization]
    .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage)
    .slice(0, 8)
    .map(room => ({
      name: room.roomNumber,
      'Utilization %': room.utilizationPercentage,
      type: room.type,
    }));

  // Faculty workload chart data: top 8 faculty
  const facultyChartData = [...workloads]
    .sort((a, b) => b.assignedPeriods - a.assignedPeriods)
    .slice(0, 8)
    .map(fac => ({
      name: fac.facultyName.split(' ')[1] || fac.facultyName, // surname/lastname
      'Periods / Week': fac.assignedPeriods,
    }));

  // Department distribution pie data: count of faculty by department
  const deptPieDataMap = {};
  workloads.forEach(fac => {
    const dCode = fac.departmentCode;
    deptPieDataMap[dCode] = (deptPieDataMap[dCode] || 0) + 1;
  });
  const deptPieData = Object.keys(deptPieDataMap).map(key => ({
    name: key,
    value: deptPieDataMap[key],
  }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Title Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
            System Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Welcome to the Smart Classroom Scheduler Management Console.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Departments"
            value={stats?.totalDepartments || 0}
            icon={HiOutlineAcademicCap}
            colorClass="bg-primary-500 text-white"
          />
          <StatCard
            title="Total Faculty"
            value={stats?.totalFaculty || 0}
            icon={HiOutlineUserGroup}
            colorClass="bg-emerald-500 text-white"
          />
          <StatCard
            title="Total Students"
            value={stats?.totalStudents || 0}
            icon={HiOutlineUserGroup}
            colorClass="bg-amber-500 text-white"
          />
          <StatCard
            title="Total Classrooms"
            value={stats?.totalRooms || 0}
            icon={HiOutlineHome}
            colorClass="bg-indigo-500 text-white"
          />
        </div>

        {/* Dynamic Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Room Utilization Bar Chart */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Top Classroom & Lab Utilization (%)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      borderColor: '#475569',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar dataKey="Utilization %" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Faculty Workload Chart */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Faculty Workload (Periods / Week)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={facultyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      borderColor: '#475569',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar dataKey="Periods / Week" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Sections: Today's Classes & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule Feed (Left 2 cols) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Today's Scheduled Lectures ({stats?.todaysClassesCount || 0})
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/20 rounded-full">
                <HiOutlineClock className="h-4 w-4" />
                Live view
              </span>
            </div>
            
            <div className="overflow-x-auto">
              {stats?.todaysClasses.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-10">
                  No classes scheduled for today.
                </p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="pb-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="pb-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="pb-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Faculty
                      </th>
                      <th className="pb-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Room
                      </th>
                      <th className="pb-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Section
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-750">
                    {stats?.todaysClasses.map(slot => (
                      <tr key={slot._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 text-xs font-bold text-slate-700 dark:text-slate-350">
                          {slot.period} ({slot.period === 1 ? '9 AM' : slot.period === 2 ? '10 AM' : slot.period === 3 ? '11 AM' : slot.period === 5 ? '1 PM' : slot.period === 6 ? '2 PM' : '3 PM'})
                        </td>
                        <td className="py-3 text-xs font-bold text-slate-900 dark:text-white">
                          {slot.subject?.subjectName} <span className="text-[10px] text-slate-400">({slot.subject?.subjectCode})</span>
                        </td>
                        <td className="py-3 text-xs text-slate-500 dark:text-slate-400">
                          {slot.faculty?.facultyName}
                        </td>
                        <td className="py-3 text-xs font-semibold text-primary-600 dark:text-primary-400">
                          {slot.classroom?.roomNumber}
                        </td>
                        <td className="py-3 text-xs text-slate-500 dark:text-slate-400">
                          {slot.department?.departmentCode} - S{slot.semester} - Sec {slot.section}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent System Activity Log (Right col) */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Recent System Activity
            </h2>
            <div className="space-y-4">
              {stats?.recentActivities.map(act => (
                <div key={act.id} className="flex items-start gap-3 text-left">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary-500 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                      {act.action}
                    </p>
                    <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>By: {act.user}</span>
                      <span>•</span>
                      <span>{act.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
