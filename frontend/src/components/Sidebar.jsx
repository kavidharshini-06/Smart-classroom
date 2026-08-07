import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineHome,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineBell,
  HiOutlineUser,
} from 'react-icons/hi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();

  const getAdminLinks = () => [
    { name: 'Dashboard', path: '/admin/dashboard', icon: HiOutlineViewGrid },
    { name: 'Departments', path: '/admin/departments', icon: HiOutlineAcademicCap },
    { name: 'Faculty', path: '/admin/faculty', icon: HiOutlineUserGroup },
    { name: 'Students', path: '/admin/students', icon: HiOutlineUserGroup },
    { name: 'Subjects', path: '/admin/subjects', icon: HiOutlineBookOpen },
    { name: 'Classrooms', path: '/admin/classrooms', icon: HiOutlineHome },
    { name: 'Timetables', path: '/admin/timetables', icon: HiOutlineCalendar },
    { name: 'Reports & Stats', path: '/admin/reports', icon: HiOutlineChartBar },
    { name: 'Notifications', path: '/admin/notifications', icon: HiOutlineBell },
  ];

  const getFacultyLinks = () => [
    { name: 'Dashboard', path: '/faculty/dashboard', icon: HiOutlineViewGrid },
    { name: 'Profile Settings', path: '/faculty/profile', icon: HiOutlineUser },
  ];

  const getStudentLinks = () => [
    { name: 'Dashboard', path: '/student/dashboard', icon: HiOutlineViewGrid },
  ];

  const links =
    user?.role === 'Admin'
      ? getAdminLinks()
      : user?.role === 'Faculty'
      ? getFacultyLinks()
      : getStudentLinks();

  const activeStyle = 'bg-primary-600 text-white shadow-md shadow-primary-500/20';
  const inactiveStyle = 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/50 dark:border-slate-850 bg-white dark:bg-slate-900 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-lg shadow-md shadow-primary-500/10">
              C
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-slate-800 dark:text-white tracking-tight">
                UniSchedule
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider -mt-0.5">
                {user?.role} Portal
              </p>
            </div>
          </div>

          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar Content Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive ? activeStyle : inactiveStyle
                  }`
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {link.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
