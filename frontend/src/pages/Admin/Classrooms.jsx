import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Modal from '../../components/Modal';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import api from '../../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiPlus, HiSearch, HiPencilAlt, HiTrash } from 'react-icons/hi';

const Classrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [btnLoading, setBtnLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm();

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/classrooms');
      setClassrooms(res.data.data);
    } catch (error) {
      toast.error('Failed to load classrooms');
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const openAddModal = () => {
    setEditingClassroom(null);
    reset();
    setModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingClassroom(room);
    setValue('roomNumber', room.roomNumber);
    setValue('building', room.building);
    setValue('capacity', room.capacity);
    setValue('type', room.type);
    setValue('status', room.status);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this classroom?')) {
      try {
        await api.delete(`/classrooms/${id}`);
        toast.success('Classroom deleted successfully');
        fetchClassrooms();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Delete operation failed');
      }
    }
  };

  const onSubmit = async (data) => {
    setBtnLoading(true);
    try {
      if (editingClassroom) {
        await api.put(`/classrooms/${editingClassroom._id}`, data);
        toast.success('Classroom updated successfully');
      } else {
        await api.post('/classrooms', data);
        toast.success('Classroom added successfully');
      }
      setModalOpen(false);
      fetchClassrooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setBtnLoading(false);
    }
  };

  // Filter list by search query, room type and status
  const filteredClassrooms = classrooms.filter((room) => {
    const matchesSearch =
      room.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      room.building.toLowerCase().includes(search.toLowerCase());

    const matchesType = selectedTypeFilter === '' || room.type === selectedTypeFilter;
    const matchesStatus = selectedStatusFilter === '' || room.status === selectedStatusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              Manage Classrooms & Labs
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Add rooms, set seating capacities, configure labs, or set maintenance schedules.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-md transition-transform hover:-translate-y-0.5"
          >
            <HiPlus className="h-5 w-5" />
            Add Room
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
              placeholder="Search by room or building..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div className="w-full md:w-48 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-transparent text-slate-700 dark:text-slate-350 text-sm focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="Classroom">Classroom</option>
              <option value="Lab">Laboratory</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-transparent text-slate-700 dark:text-slate-350 text-sm focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Room Registry Table */}
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
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
                      Type
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {filteredClassrooms.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-sm text-slate-400">
                        No classrooms found.
                      </td>
                    </tr>
                  ) : (
                    filteredClassrooms.map((room) => (
                      <tr key={room._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/35 transition-colors">
                        <td className="p-4 text-sm font-bold text-primary-600 dark:text-primary-400">
                          {room.roomNumber}
                        </td>
                        <td className="p-4 text-sm font-bold text-slate-800 dark:text-white">
                          {room.building}
                        </td>
                        <td className="p-4 text-sm text-slate-700 dark:text-slate-350 font-semibold">
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
                        <td className="p-4 text-xs">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              room.status === 'Active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                                : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {room.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-right space-x-1.5">
                          <button
                            onClick={() => openEditModal(room)}
                            className="inline-flex rounded-xl p-2 bg-slate-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-slate-600 dark:text-slate-350 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="Edit"
                          >
                            <HiPencilAlt className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(room._id)}
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
          title={editingClassroom ? 'Edit Classroom Details' : 'Add New Classroom / Lab'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Room Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 302"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('roomNumber', { required: 'Room Number is required' })}
                />
                {errors.roomNumber && <p className="text-red-500 text-xs mt-1">{errors.roomNumber.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Building
                </label>
                <input
                  type="text"
                  placeholder="e.g. Technology Tower"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('building', { required: 'Building is required' })}
                />
                {errors.building && <p className="text-red-500 text-xs mt-1">{errors.building.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  placeholder="e.g. 60"
                  min="1"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('capacity', { required: 'Capacity is required', min: 1 })}
                />
                {errors.capacity && <p className="text-red-500 text-xs mt-1">Capacity required</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Room Type
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('type', { required: 'Type is required' })}
                >
                  <option value="Classroom">Classroom</option>
                  <option value="Lab">Lab</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1">
                  Status
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  {...register('status', { required: 'Status is required' })}
                >
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
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
                {btnLoading ? 'Saving...' : 'Save Room'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Classrooms;
