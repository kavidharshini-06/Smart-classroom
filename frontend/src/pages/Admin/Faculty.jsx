import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Modal from '../../components/Modal';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import api from '../../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiPlus, HiSearch, HiPencilAlt, HiTrash } from 'react-icons/hi';

const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
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
      const [facRes, depRes, subRes] = await Promise.all([
        api.get('/faculty'),
        api.get('/departments'),
        api.get('/subjects'),
      ]);
      setFaculty(facRes.data.data);
      setDepartments(depRes.data.data);
      setSubjects(subRes.data.data);
    } catch (error) {
      toast.error('Failed to load faculty information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const openAddModal = () => {
    setEditingFaculty(null);
    reset();
    setModalOpen(true);
  };

  const openEditModal = (fac) => {
    setEditingFaculty(fac);
    setValue('facultyName', fac.facultyName);
    setValue('facultyId', fac.facultyId);
    setValue('department', fac.department?._id || '');
    setValue('email', fac.email);
    setValue('phone', fac.phone);
    
    // Set selected subjects
    const subIds = fac.subjects ? fac.subjects.map(s => s._id || s) : [];
    setValue('subjects', subIds);

    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deleting this faculty member will also delete their user login. Proceed?')) {
      try {
        await api.delete(`/faculty/${id}`);
        toast.success('Faculty deleted successfully');
        fetchInitialData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Delete operation failed');
      }
    }
  };

  const onSubmit = async (data) => {
    setBtnLoading(true);
    // Format subjects list
    const payload = {
      ...data,
      subjects: Array.isArray(data.subjects) ? data.subjects : [data.subjects].filter(Boolean),
    };

    try {
      if (editingFaculty) {
        await api.put(`/faculty/${editingFaculty._id}`, payload);
        toast.success('Faculty profile updated successfully');
      } else {
        await api.post('/faculty', payload);
        toast.success('Faculty profile and user login created successfully (Default password: Faculty@123)');
      }
      setModalOpen(false);
      fetchInitialData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setBtnLoading(false);
    }
  };

  // Filter list by search query and department dropdown
  const filteredFaculty = faculty.filter((fac) => {
    const matchesSearch =
      fac.facultyName.toLowerCase().includes(search.toLowerCase()) ||
      fac.facultyId.toLowerCase().includes(search.toLowerCase()) ||
      fac.email.toLowerCase().includes(search.toLowerCase());

    const matchesDept = selectedDeptFilter === '' || fac.department?._id === selectedDeptFilter;

    return matchesSearch && matchesDept;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              Manage Faculty Profiles
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Configure faculty details, teaching subjects, and login mappings.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-md transition-transform hover:-translate-y-0.5"
          >
            <HiPlus className="h-5 w-5" />
            Add Faculty Member
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
              placeholder="Search by ID, name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none"
            />
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="w-full px-3 py-2 bg-transparent text-slate-700 dark:text-slate-350 text-sm focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.departmentCode} - {dept.departmentName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Faculty List Table */}
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Faculty ID
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Contact details
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Assigned Subjects
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {filteredFaculty.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-sm text-slate-400">
                        No faculty members found.
                      </td>
                    </tr>
                  ) : (
                    filteredFaculty.map((fac) => (
                      <tr key={fac._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/35 transition-colors">
                        <td className="p-4 text-sm font-bold text-primary-600 dark:text-primary-400">
                          {fac.facultyId}
                        </td>
                        <td className="p-4 text-sm font-bold text-slate-800 dark:text-white">
                          {fac.facultyName}
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-350">
                          {fac.department ? fac.department.departmentCode : 'Unassigned'}
                        </td>
                        <td className="p-4 text-xs space-y-0.5 text-slate-500 dark:text-slate-400">
                          <p>{fac.email}</p>
                          <p>{fac.phone}</p>
                        </td>
                        <td className="p-4 text-xs">
                          <div className="flex flex-wrap gap-1">
                            {fac.subjects && fac.subjects.length > 0 ? (
                              fac.subjects.map((sub) => (
                                <span
                                  key={sub._id || sub}
                                  className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-md"
                                >
                                  {sub.subjectCode}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400">No subjects assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-right space-x-1.5">
                          <button
                            onClick={() => openEditModal(fac)}
                            className="inline-flex rounded-xl p-2 bg-slate-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-slate-600 dark:text-slate-350 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="Edit"
                          >
                            <HiPencilAlt className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(fac._id)}
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
          title={editingFaculty ? 'Edit Faculty Member' : 'Add New Faculty Member'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Faculty Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Jane Smith"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('facultyName', { required: 'Faculty Name is required' })}
                />
                {errors.facultyName && <p className="text-red-500 text-xs mt-1">{errors.facultyName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Faculty ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. FAC101"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('facultyId', { required: 'Faculty ID is required' })}
                />
                {errors.facultyId && <p className="text-red-500 text-xs mt-1">{errors.facultyId.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Department
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('department', { required: 'Department selection is required' })}
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
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +1-555-0199"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('phone', { required: 'Phone number is required' })}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="faculty@college.edu"
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
                })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Checkbox array for Subjects selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 ml-1">
                Assign Subjects
              </label>
              <div className="border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 max-h-36 overflow-y-auto bg-slate-50 dark:bg-slate-900 grid grid-cols-2 gap-2">
                {subjects.map((sub) => (
                  <label key={sub._id} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      value={sub._id}
                      className="rounded border-slate-350 text-primary-600 focus:ring-primary-500"
                      {...register('subjects')}
                    />
                    <span>{sub.subjectCode} - {sub.subjectName}</span>
                  </label>
                ))}
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
                {btnLoading ? 'Saving...' : 'Save Faculty'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Faculty;
