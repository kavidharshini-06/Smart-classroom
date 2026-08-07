import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Modal from '../../components/Modal';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import api from '../../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiPlus, HiSearch, HiPencilAlt, HiTrash } from 'react-icons/hi';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [selectedSemFilter, setSelectedSemFilter] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [btnLoading, setBtnLoading] = useState(false);

  // Dynamic state inside modal form
  const [selectedFormDept, setSelectedFormDept] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  // Watch department selection inside form to filter faculty dropdown
  const formDeptWatch = watch('department');

  useEffect(() => {
    if (formDeptWatch) {
      setSelectedFormDept(formDeptWatch);
    } else {
      setSelectedFormDept('');
    }
  }, [formDeptWatch]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [subRes, depRes, facRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/departments'),
        api.get('/faculty'),
      ]);
      setSubjects(subRes.data.data);
      setDepartments(depRes.data.data);
      setFaculty(facRes.data.data);
    } catch (error) {
      toast.error('Failed to load subjects information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const openAddModal = () => {
    setEditingSubject(null);
    reset();
    setModalOpen(true);
  };

  const openEditModal = (sub) => {
    setEditingSubject(sub);
    setValue('subjectName', sub.subjectName);
    setValue('subjectCode', sub.subjectCode);
    setValue('credits', sub.credits);
    setValue('department', sub.department?._id || '');
    setValue('semester', sub.semester);
    setValue('type', sub.type);
    setValue('faculty', sub.faculty?._id || '');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await api.delete(`/subjects/${id}`);
        toast.success('Subject deleted successfully');
        fetchInitialData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Delete operation failed');
      }
    }
  };

  const onSubmit = async (data) => {
    setBtnLoading(true);
    // If faculty is unassigned, send empty string or null
    const payload = {
      ...data,
      faculty: data.faculty === '' ? null : data.faculty,
    };

    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject._id}`, payload);
        toast.success('Subject updated successfully');
      } else {
        await api.post('/subjects', payload);
        toast.success('Subject created successfully');
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
  const filteredSubjects = subjects.filter((sub) => {
    const matchesSearch =
      sub.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      sub.subjectCode.toLowerCase().includes(search.toLowerCase());

    const matchesDept = selectedDeptFilter === '' || sub.department?._id === selectedDeptFilter;
    const matchesSem = selectedSemFilter === '' || sub.semester === Number(selectedSemFilter);

    return matchesSearch && matchesDept && matchesSem;
  });

  // Filter faculty dropdown in form by the selected department
  const filteredFacultyForForm = faculty.filter(
    (fac) => selectedFormDept === '' || fac.department?._id === selectedFormDept
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              Manage Academic Subjects
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Add courses, set weekly period credits, and assign faculty.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-md transition-transform hover:-translate-y-0.5"
          >
            <HiPlus className="h-5 w-5" />
            Add Subject
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
              placeholder="Search by code or name..."
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

        {/* Subject registry table */}
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Subject Code
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Subject Name
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Credits (Hours)
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Assigned Faculty
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {filteredSubjects.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-sm text-slate-400">
                        No subjects found.
                      </td>
                    </tr>
                  ) : (
                    filteredSubjects.map((sub) => (
                      <tr key={sub._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/35 transition-colors">
                        <td className="p-4 text-sm font-bold text-primary-600 dark:text-primary-400">
                          {sub.subjectCode}
                        </td>
                        <td className="p-4 text-sm font-bold text-slate-800 dark:text-white">
                          {sub.subjectName}
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-350">
                          {sub.department ? sub.department.departmentCode : 'Unassigned'} (Sem {sub.semester})
                        </td>
                        <td className="p-4 text-sm text-slate-700 dark:text-slate-300 font-semibold">
                          {sub.credits} periods/wk
                        </td>
                        <td className="p-4 text-xs">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              sub.type === 'Lab'
                                ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400'
                                : 'bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400'
                            }`}
                          >
                            {sub.type}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-350">
                          {sub.faculty ? (
                            <span className="font-semibold text-slate-800 dark:text-white">
                              {sub.faculty.facultyName}
                            </span>
                          ) : (
                            <span className="text-amber-500 font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-right space-x-1.5">
                          <button
                            onClick={() => openEditModal(sub)}
                            className="inline-flex rounded-xl p-2 bg-slate-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-slate-600 dark:text-slate-350 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="Edit"
                          >
                            <HiPencilAlt className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub._id)}
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
          title={editingSubject ? 'Edit Course Subject' : 'Add New Course Subject'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Operating Systems"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('subjectName', { required: 'Subject Name is required' })}
                />
                {errors.subjectName && <p className="text-red-500 text-xs mt-1">{errors.subjectName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS501"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('subjectCode', { required: 'Subject Code is required' })}
                />
                {errors.subjectCode && <p className="text-red-500 text-xs mt-1">{errors.subjectCode.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Credits (Periods)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  min="1"
                  max="6"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('credits', { required: 'Credits required', min: 1, max: 6 })}
                />
                {errors.credits && <p className="text-red-500 text-xs mt-1">1-6 credits</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Semester
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('semester', { required: 'Semester is required' })}
                >
                  <option value="">Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
                {errors.semester && <p className="text-red-500 text-xs mt-1">Required</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Type
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('type', { required: 'Type is required' })}
                >
                  <option value="Theory">Theory</option>
                  <option value="Lab">Lab</option>
                </select>
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
                      {dept.departmentCode}
                    </option>
                  ))}
                </select>
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
              </div>

              {/* Dynamic Faculty dropdown filtered by selected department in form */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Assign Teacher
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('faculty')}
                >
                  <option value="">Unassigned</option>
                  {filteredFacultyForForm.map((fac) => (
                    <option key={fac._id} value={fac._id}>
                      {fac.facultyName}
                    </option>
                  ))}
                </select>
              </div>
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
                {btnLoading ? 'Saving...' : 'Save Subject'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Subjects;
