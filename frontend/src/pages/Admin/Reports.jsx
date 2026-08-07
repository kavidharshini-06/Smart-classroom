import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { TableSkeleton, ChartSkeleton } from '../../components/LoadingSkeleton';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  HiOutlineDocumentReport,
  HiDownload,
  HiChevronRight,
  HiOutlineOfficeBuilding,
  HiOutlineUser,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Reports = () => {
  const [reportType, setReportType] = useState('faculty'); // 'faculty' or 'rooms'
  const [facultyData, setFacultyData] = useState([]);
  const [roomsData, setRoomsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facRes, roomsRes] = await Promise.all([
        api.get('/reports/faculty-workload'),
        api.get('/reports/classroom-utilization'),
      ]);
      setFacultyData(facRes.data.data);
      setRoomsData(roomsRes.data.data);
    } catch (error) {
      toast.error('Failed to retrieve reports data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF();
    const title = reportType === 'faculty' ? 'Faculty Workload Report' : 'Classroom & Lab Utilization Report';
    
    doc.setFontSize(16);
    doc.text('Smart Classroom & Timetable Scheduler', 14, 15);
    doc.setFontSize(12);
    doc.text(title, 14, 22);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    if (reportType === 'faculty') {
      const headers = [['Faculty ID', 'Faculty Name', 'Department', 'Assigned Periods / Week']];
      const rows = facultyData.map(fac => [
        fac.facultyId,
        fac.facultyName,
        fac.departmentCode,
        `${fac.assignedPeriods} periods`,
      ]);

      doc.autoTable({
        head: headers,
        body: rows,
        startY: 34,
        styles: { fontSize: 10, cellPadding: 3 },
      });
      doc.save('Faculty_Workload_Report.pdf');
    } else {
      const headers = [['Room Number', 'Building', 'Type', 'Capacity', 'Utilization Rate']];
      const rows = roomsData.map(room => [
        room.roomNumber,
        room.building,
        room.type,
        `${room.capacity} seats`,
        `${room.utilizationPercentage}%`,
      ]);

      doc.autoTable({
        head: headers,
        body: rows,
        startY: 34,
        styles: { fontSize: 10, cellPadding: 3 },
      });
      doc.save('Classroom_Utilization_Report.pdf');
    }
  };

  // Excel Export
  const exportExcel = () => {
    let wsData = [];
    let filename = '';

    if (reportType === 'faculty') {
      wsData = facultyData.map(fac => ({
        'Faculty ID': fac.facultyId,
        'Faculty Name': fac.facultyName,
        'Department': fac.departmentCode,
        'Email': fac.email,
        'Phone': fac.phone,
        'Assigned Periods / Week': fac.assignedPeriods,
      }));
      filename = 'Faculty_Workload_Report.xlsx';
    } else {
      wsData = roomsData.map(room => ({
        'Room Number': room.roomNumber,
        'Building': room.building,
        'Capacity': room.capacity,
        'Room Type': room.type,
        'Occupied Slots / Week': room.occupiedSlots,
        'Utilization Percentage': `${room.utilizationPercentage}%`,
      }));
      filename = 'Classroom_Utilization_Report.xlsx';
    }

    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, filename);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-6 animate-pulse"></div>
          <ChartSkeleton />
          <TableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  // Pre-process chart data based on active report view
  const chartData = reportType === 'faculty'
    ? facultyData.slice(0, 10).map(f => ({ name: f.facultyName.split(' ')[1] || f.facultyName, value: f.assignedPeriods }))
    : roomsData.slice(0, 10).map(r => ({ name: r.roomNumber, value: r.utilizationPercentage }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              Reports & Academic Analytics
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Visualize faculty workloads, monitor room occupancy, and export audit files.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              <HiOutlineDocumentReport className="h-4.5 w-4.5 text-red-500" />
              Download PDF
            </button>
            <button
              onClick={exportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              <HiDownload className="h-4.5 w-4.5 text-emerald-500" />
              Download Excel
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-white dark:bg-slate-800 p-1.5 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-sm max-w-sm">
          <button
            onClick={() => setReportType('faculty')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
              reportType === 'faculty'
                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/10'
                : 'text-slate-500 hover:text-slate-850 dark:hover:text-white'
            }`}
          >
            <HiOutlineUser className="h-4 w-4" />
            Faculty Workloads
          </button>
          <button
            onClick={() => setReportType('rooms')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
              reportType === 'rooms'
                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/10'
                : 'text-slate-500 hover:text-slate-850 dark:hover:text-white'
            }`}
          >
            <HiOutlineOfficeBuilding className="h-4 w-4" />
            Classroom Utilization
          </button>
        </div>

        {/* Statistics Chart */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl shadow-md">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
            {reportType === 'faculty' ? 'Assigned Hours Breakdown' : 'Room Utilization Breakdown (%)'}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Bar dataKey="value" fill={reportType === 'faculty' ? '#10b981' : '#0ea5e9'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Table Grid */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            {reportType === 'faculty' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Faculty ID
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Faculty Name
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Assigned Periods / Week
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                      Contact
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {facultyData.map(fac => (
                    <tr key={fac.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/35 transition-colors">
                      <td className="p-4 text-sm font-bold text-primary-600 dark:text-primary-400">
                        {fac.facultyId}
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-800 dark:text-white">
                        {fac.facultyName}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-350">
                        {fac.departmentCode}
                      </td>
                      <td className="p-4 text-sm font-semibold text-slate-800 dark:text-white">
                        {fac.assignedPeriods} periods
                      </td>
                      <td className="p-4 text-xs text-slate-500 dark:text-slate-400 text-right">
                        <p>{fac.email}</p>
                        <p>{fac.phone}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Room Number
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Building
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Seating Capacity
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Room Type
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Weekly Occupancy (Slots)
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                      Utilization Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {roomsData.map(room => (
                    <tr key={room.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/35 transition-colors">
                      <td className="p-4 text-sm font-bold text-primary-600 dark:text-primary-400">
                        {room.roomNumber}
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-800 dark:text-white">
                        {room.building}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-350">
                        {room.capacity} seats
                      </td>
                      <td className="p-4 text-xs">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            room.type === 'Lab'
                              ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400'
                              : 'bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400'
                          }`}
                        >
                          {room.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-700 dark:text-slate-300 font-semibold">
                        {room.occupiedSlots} / 30 slots
                      </td>
                      <td className="p-4 text-sm text-right font-bold text-slate-800 dark:text-white">
                        <span
                          className={`px-2 py-0.5 rounded-lg ${
                            room.utilizationPercentage > 75
                              ? 'bg-red-50 dark:bg-red-950/10 text-red-600'
                              : room.utilizationPercentage > 35
                              ? 'bg-amber-50 dark:bg-amber-950/10 text-amber-600'
                              : 'bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600'
                          }`}
                        >
                          {room.utilizationPercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
