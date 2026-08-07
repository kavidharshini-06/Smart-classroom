import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Modal from '../../components/Modal';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import api from '../../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiPlus, HiSearch, HiPencilAlt, HiTrash } from 'react-icons/hi';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [selectedSemFilter, setSelectedSemFilter] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [btnLoading, setBtnLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm();

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [studRes, depRes] = await Promise.all([
        api.get('/students'),
        api.get('/departments'),
      ]);
      setStudents(studRes.data.data);
      setDepartments(depRes.data.data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const openAddModal = () => {
    setEditingStudent(null);
    reset();
    setModalOpen(true);
  };

  const openEditModal = (stud) => {
    setEditingStudent(stud);
    setValue('studentName', stud.studentName);
    setValue('registerNumber', stud.registerNumber);
    setValue('department', stud.department?._id || '');
    setValue('year', stud.year);
    setValue('semester', stud.semester);
    setValue('section', stud.section);
    setValue('email', stud.user?.email || `${stud.registerNumber.toLowerCase()}@college.edu`);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deleting this student will also delete their login account. Proceed?')) {
      try {
        await api.delete(`/students/${id}`);
        toast.success('Student deleted successfully');
        fetchInitialData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Delete operation failed');
      }
    }
  };

  const onSubmit = async (data) => {
    setBtnLoading(true);
    try {
      if (editingStudent) {
        await api.put(`/students/${editingStudent._id}`, data);
        toast.success('Student profile updated successfully');
      } else {
        await api.post('/students', data);
        toast.success('Student profile and login created successfully (Default password: Student@123)');
      }
      setModalOpen(false);
      fetchInitialData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setBtnLoading(false);
    }
  };

  // Filter list by search query, department and semester
  const filteredStudents = students.filter((stud) => {
    const matchesSearch =
      stud.studentName.toLowerCase().includes(search.toLowerCase()) ||
      stud.registerNumber.toLowerCase().includes(search.toLowerCase());

    const matchesDept = selectedDeptFilter === '' || stud.department?._id === selectedDeptFilter;
    const matchesSem = selectedSemFilter === '' || stud.semester === Number(selectedSemFilter);

    return matchesSearch && matchesDept && matchesSem;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              Manage Student Registry
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Maintain student enrollment details and section allocations.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-md transition-transform hover:-translate-y-0.5"
          >
            <HiPlus className="h-5 w-5" />
            Enroll Student
          </button>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-sm">
          {/* Search bar */}
          <div className="relative flex-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <HiSearch className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Search by ID, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none"
            />
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-60 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="w-full px-3 py-2 bg-transparent text-slate-700 dark:text-slate-350 text-sm focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.departmentCode}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div className="w-full md:w-40 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            <select
              value={selectedSemFilter}
              onChange={(e) => setSelectedSemFilter(e.target.value)}
              className="w-full px-3 py-2 bg-transparent text-slate-700 dark:text-slate-350 text-sm focus:outline-none"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Sem {sem}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Registry List Table */}
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Register Number
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Academic Year
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Class Section
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-sm text-slate-400">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((stud) => (
                      <tr key={stud._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/35 transition-colors">
                        <td className="p-4 text-sm font-bold text-primary-600 dark:text-primary-400">
                          {stud.registerNumber}
                        </td>
                        <td className="p-4 text-sm font-bold text-slate-800 dark:text-white">
                          {stud.studentName}
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-350">
                          {stud.department ? stud.department.departmentCode : 'Unassigned'}
                        </td>
                        <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                          Year {stud.year} (Sem {stud.semester})
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-350 font-semibold">
                          Section {stud.section}
                        </td>
                        <td className="p-4 text-sm text-right space-x-1.5">
                          <button
                            onClick={() => openEditModal(stud)}
                            className="inline-flex rounded-xl p-2 bg-slate-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-slate-600 dark:text-slate-350 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="Edit"
                          >
                            <HiPencilAlt className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(stud._id)}
                            className="inline-flex rounded-xl p-2 bg-slate-50 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 dark:text-slate-350 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <HiTrash className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Form */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingStudent ? 'Edit Student Details' : 'Enroll New Student'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Student Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('studentName', { required: 'Student Name is required' })}
                />
                {errors.studentName && <p className="text-red-500 text-xs mt-1">{errors.studentName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Register Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. REG2026101"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('registerNumber', { required: 'Register Number is required' })}
                />
                {errors.registerNumber && <p className="text-red-500 text-xs mt-1">{errors.registerNumber.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Department
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('department', { required: 'Department is required' })}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.departmentCode} - {dept.departmentName}
                    </option>
                  ))}
                </select>
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Section
                </label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('section', { required: 'Section is required' })}
                />
                {errors.section && <p className="text-red-500 text-xs mt-1">{errors.section.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Year of Study
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('year', { required: 'Year is required' })}
                >
                  <option value="">Select Year</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
                {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Semester
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('semester', { required: 'Semester is required' })}
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
                {errors.semester && <p className="text-red-500 text-xs mt-1">{errors.semester.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                Custom Login Email (Optional)
              </label>
              <input
                type="email"
                placeholder="Leave blank to auto-generate: reg_no@college.edu"
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                {...register('email')}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-250 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={btnLoading}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-md shadow-primary-500/10 disabled:opacity-75"
              >
                {btnLoading ? 'Saving...' : 'Enroll Student'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Students;
