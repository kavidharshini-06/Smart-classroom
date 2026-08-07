import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import TimetableGrid from '../../components/TimetableGrid';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  HiSparkles,
  HiTrash,
  HiDownload,
  HiOutlineDocumentReport,
} from 'react-icons/hi';

const Timetables = () => {
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedSec, setSelectedSec] = useState('A');

  // Generator result state (for listing scheduling conflicts)
  const [generatorResult, setGeneratorResult] = useState(null);
  const [conflictsModalOpen, setConflictsModalOpen] = useState(false);

  // Manual Slot Edit/Create States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState(null); // holds day/period or slot object
  const [btnLoading, setBtnLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm();

  // Load basic configurations
  const fetchConfigurations = async () => {
    try {
      const [depRes, facRes, subRes, classRes] = await Promise.all([
        api.get('/departments'),
        api.get('/faculty'),
        api.get('/subjects'),
        api.get('/classrooms'),
      ]);
      setDepartments(depRes.data.data);
      setFacultyList(facRes.data.data);
      setSubjects(subRes.data.data);
      setClassrooms(classRes.data.data);

      // Select first department as default if available
      if (depRes.data.data.length > 0) {
        setSelectedDept(depRes.data.data[0]._id);
        setSelectedSem('1');
      }
    } catch (error) {
      toast.error('Failed to load scheduling configurations');
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  // Fetch timetable slots based on active filters
  const fetchTimetable = async () => {
    if (!selectedDept || !selectedSem || !selectedSec) return;
    setLoading(true);
    try {
      const res = await api.get('/timetables', {
        params: {
          department: selectedDept,
          semester: selectedSem,
          section: selectedSec,
        },
      });
      setTimetableSlots(res.data.data);
    } catch (error) {
      toast.error('Failed to retrieve timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedDept, selectedSem, selectedSec]);

  // Trigger Automatic Generation
  const handleAutoGenerate = async () => {
    const confirmGen = window.confirm(
      'Generating a new timetable will overwrite existing schedules for selected classes. Do you wish to continue?'
    );
    if (!confirmGen) return;

    setLoading(true);
    try {
      const res = await api.post('/timetables/generate', {});
      toast.success(res.data.message);
      
      if (res.data.unscheduled && res.data.unscheduled.length > 0) {
        setGeneratorResult(res.data.unscheduled);
        setConflictsModalOpen(true);
      }
      fetchTimetable();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Timetable generation failed');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Clear Timetable
  const handleClearTimetable = async () => {
    const confirmClear = window.confirm(
      'Are you sure you want to clear the entire timetable? This cannot be undone.'
    );
    if (!confirmClear) return;

    setLoading(true);
    try {
      await api.delete('/timetables/clear');
      toast.success('Timetable cleared successfully');
      setTimetableSlots([]);
    } catch (error) {
      toast.error('Failed to clear timetable');
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Form for Existing Slot
  const handleEditSlot = (slot) => {
    setTargetSlot(slot);
    setValue('subject', slot.subject?._id || '');
    setValue('faculty', slot.faculty?._id || '');
    setValue('classroom', slot.classroom?._id || '');
    setEditModalOpen(true);
  };

  // Open Create Form for Empty Cell
  const handleCreateSlot = (day, period) => {
    setTargetSlot({ day, period });
    reset();
    setEditModalOpen(true);
  };

  // Handle Delete Slot
  const handleDeleteSlot = async (id) => {
    if (window.confirm('Delete this timetable entry?')) {
      try {
        await api.delete(`/timetables/${id}`);
        toast.success('Slot deleted successfully');
        fetchTimetable();
      } catch (error) {
        toast.error('Failed to delete slot');
      }
    }
  };

  // Save Manual Entry Form (both Create and Update)
  const onSubmitSlotForm = async (data) => {
    setBtnLoading(true);
    try {
      if (targetSlot._id) {
        // Edit existing slot
        await api.put(`/timetables/${targetSlot._id}`, data);
        toast.success('Slot updated successfully');
      } else {
        // Create new slot
        const payload = {
          ...data,
          department: selectedDept,
          semester: Number(selectedSem),
          section: selectedSec,
          day: targetSlot.day,
          period: targetSlot.period,
        };
        await api.post('/timetables', payload);
        toast.success('Slot created successfully');
      }
      setEditModalOpen(false);
      fetchTimetable();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed due to resources overlaps.');
    } finally {
      setBtnLoading(false);
    }
  };

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    const deptObj = departments.find(d => d._id === selectedDept);
    const title = `${deptObj?.departmentCode} - Semester ${selectedSem} (Section ${selectedSec}) Timetable`;

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
        const slot = timetableSlots.find(s => s.day === day && s.period === p);
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

    doc.save(`${deptObj?.departmentCode}_Sem${selectedSem}_Sec${selectedSec}_Timetable.pdf`);
  };

  // Excel Export
  const exportExcel = () => {
    const deptObj = departments.find(d => d._id === selectedDept);
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const data = DAYS.map(day => {
      const row = { Day: day };
      for (let p = 1; p <= 7; p++) {
        if (p === 4) {
          row[`Period ${p} (12-1 PM)`] = 'LUNCH BREAK';
          continue;
        }
        const slot = timetableSlots.find(s => s.day === day && s.period === p);
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
    
    // Fit columns width
    worksheet['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 30 }];
    
    XLSX.writeFile(workbook, `${deptObj?.departmentCode}_Sem${selectedSem}_Sec${selectedSec}_Timetable.xlsx`);
  };

  // Find department code for UI display
  const currentDeptObj = departments.find(d => d._id === selectedDept);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              Timetable Schedule Manager
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Auto-generate conflict-free schedules or adjust teaching periods manually.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleAutoGenerate}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20"
            >
              <HiSparkles className="h-5 w-5 animate-pulse" />
              Auto-Generate Timetable
            </button>
            <button
              onClick={handleClearTimetable}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 font-bold text-sm rounded-xl transition-colors"
            >
              <HiTrash className="h-5 w-5" />
              Clear All
            </button>
          </div>
        </div>

        {/* Filters and Exports Toolbar */}
        <div className="flex flex-col xl:flex-row gap-4 bg-white dark:bg-slate-800 p-4 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-sm">
          <div className="flex flex-wrap gap-3 flex-1">
            {/* Department */}
            <div className="flex flex-col w-full sm:w-60">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                Select Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-350 text-sm rounded-xl focus:outline-none"
              >
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.departmentName} ({dept.departmentCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div className="flex flex-col w-32">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                Semester
              </label>
              <select
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-350 text-sm rounded-xl focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div className="flex flex-col w-28">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                Section
              </label>
              <select
                value={selectedSec}
                onChange={(e) => setSelectedSec(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-350 text-sm rounded-xl focus:outline-none"
              >
                {['A', 'B', 'C'].map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Export Actions */}
          {timetableSlots.length > 0 && (
            <div className="flex items-end gap-2">
              <button
                onClick={exportPDF}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-250 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 text-xs font-bold rounded-xl transition-colors"
              >
                <HiOutlineDocumentReport className="h-4.5 w-4.5 text-red-500" />
                Export PDF
              </button>
              <button
                onClick={exportExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-250 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 text-xs font-bold rounded-xl transition-colors"
              >
                <HiDownload className="h-4.5 w-4.5 text-emerald-500" />
                Export Excel
              </button>
            </div>
          )}
        </div>

        {/* Schedule grid view */}
        {loading ? (
          <div className="flex h-64 items-center justify-center bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl animate-pulse">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-md font-extrabold text-slate-800 dark:text-white">
                Schedule for {currentDeptObj?.departmentCode} • Semester {selectedSem} • Section {selectedSec}
              </h2>
            </div>
            
            <TimetableGrid
              timetableSlots={timetableSlots}
              onEditSlot={handleEditSlot}
              onDeleteSlot={handleDeleteSlot}
              onCreateSlot={handleCreateSlot}
              isAdmin={true}
            />
          </div>
        )}

        {/* Dynamic Edit/Create Manual Slot Modal */}
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={targetSlot?._id ? 'Adjust Timetable Slot' : `Schedule Period Slot: ${targetSlot?.day}, Period ${targetSlot?.period}`}
        >
          <form onSubmit={handleSubmit(onSubmitSlotForm)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                Subject
              </label>
              <select
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                {...register('subject', { required: 'Subject is required' })}
              >
                <option value="">Select Subject</option>
                {subjects
                  .filter(sub => sub.department?._id === selectedDept && sub.semester === Number(selectedSem))
                  .map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.subjectCode} - {sub.subjectName} ({sub.type})
                    </option>
                  ))}
              </select>
              {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                Faculty
              </label>
              <select
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                {...register('faculty', { required: 'Faculty member is required' })}
              >
                <option value="">Select Faculty</option>
                {facultyList.map((fac) => (
                  <option key={fac._id} value={fac._id}>
                    {fac.facultyName} ({fac.department?.departmentCode})
                  </option>
                ))}
              </select>
              {errors.faculty && <p className="text-red-500 text-xs mt-1">{errors.faculty.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                Classroom / Lab
              </label>
              <select
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                {...register('classroom', { required: 'Room is required' })}
              >
                <option value="">Select Room</option>
                {classrooms
                  .filter(room => room.status === 'Active')
                  .map((room) => (
                    <option key={room._id} value={room._id}>
                      {room.roomNumber} - {room.building} ({room.type}, Capacity: {room.capacity})
                    </option>
                  ))}
              </select>
              {errors.classroom && <p className="text-red-500 text-xs mt-1">{errors.classroom.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-250 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={btnLoading}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-md shadow-primary-500/10 disabled:opacity-75"
              >
                {btnLoading ? 'Saving...' : 'Save Slot'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Conflicts Log Modal (for auto-scheduler failures) */}
        <Modal
          isOpen={conflictsModalOpen}
          onClose={() => setConflictsModalOpen(false)}
          title="Scheduling Conflicts Log"
        >
          <div className="space-y-3 text-left">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-400 rounded-xl text-xs font-semibold">
              Warning: Some subject sessions could not be scheduled automatically because of strict resource limitations.
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {generatorResult?.map((conf, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-750 rounded-xl"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {conf.subjectCode} - {conf.subjectName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Target Class: Semester {conf.semester}, Section {conf.section}
                  </p>
                  <p className="text-[10px] font-semibold text-red-500 dark:text-red-400 mt-1">
                    Reason: {conf.reason}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <button
                onClick={() => setConflictsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl"
              >
                Close Log
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Timetables;
