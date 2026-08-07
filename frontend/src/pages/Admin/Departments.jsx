import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Modal from '../../components/Modal';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import api from '../../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiPlus, HiSearch, HiPencilAlt, HiTrash } from 'react-icons/hi';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [btnLoading, setBtnLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm();

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      setDepartments(res.data.data);
    } catch (error) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openAddModal = () => {
    setEditingDepartment(null);
    reset();
    setModalOpen(true);
  };

  const openEditModal = (dep) => {
    setEditingDepartment(dep);
    setValue('departmentName', dep.departmentName);
    setValue('departmentCode', dep.departmentCode);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await api.delete(`/departments/${id}`);
        toast.success('Department deleted successfully');
        fetchDepartments();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Delete operation failed');
      }
    }
  };

  const onSubmit = async (data) => {
    setBtnLoading(true);
    try {
      if (editingDepartment) {
        // Edit Department
        await api.put(`/departments/${editingDepartment._id}`, data);
        toast.success('Department updated successfully');
      } else {
        // Add Department
        await api.post('/departments', data);
        toast.success('Department added successfully');
      }
      setModalOpen(false);
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setBtnLoading(false);
    }
  };

  // Filter departments by search query
  const filteredDepartments = departments.filter(
    (dep) =>
      dep.departmentName.toLowerCase().includes(search.toLowerCase()) ||
      dep.departmentCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              Manage Departments
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Add, update, or remove academic departments.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-md transition-transform hover:-translate-y-0.5"
          >
            <HiPlus className="h-5 w-5" />
            Add Department
          </button>
        </div>

        {/* Search Filter Bar */}
        <div className="relative max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <HiSearch className="h-5 w-5" />
          </span>
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none"
          />
        </div>

        {/* Content Section */}
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Department Code
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Department Name
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-sm text-slate-400">
                        No departments found.
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map((dep) => (
                      <tr key={dep._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/35 transition-colors">
                        <td className="p-4 text-sm font-bold text-primary-600 dark:text-primary-400">
                          {dep.departmentCode}
                        </td>
                        <td className="p-4 text-sm font-semibold text-slate-800 dark:text-white">
                          {dep.departmentName}
                        </td>
                        <td className="p-4 text-sm text-right space-x-1.5">
                          <button
                            onClick={() => openEditModal(dep)}
                            className="inline-flex rounded-xl p-2 bg-slate-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-slate-600 dark:text-slate-350 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="Edit"
                          >
                            <HiPencilAlt className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(dep._id)}
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

        {/* Add/Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingDepartment ? 'Edit Department' : 'Add New Department'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                Department Name
              </label>
              <input
                type="text"
                placeholder="e.g. Mechanical Engineering"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('departmentName', { required: 'Department Name is required' })}
              />
              {errors.departmentName && <p className="text-red-500 text-xs mt-1">{errors.departmentName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                Department Code
              </label>
              <input
                type="text"
                placeholder="e.g. ME"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('departmentCode', { required: 'Department Code is required' })}
              />
              {errors.departmentCode && <p className="text-red-500 text-xs mt-1">{errors.departmentCode.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-250 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={btnLoading}
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-md shadow-primary-500/10 disabled:opacity-75"
              >
                {btnLoading ? 'Saving...' : 'Save Department'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Departments;
