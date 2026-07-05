import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Activity, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock, 
  LogOut, 
  KeyRound, 
  UserCheck, 
  Mail,
  UserX,
  FileText
} from 'lucide-react';

export const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Stats State
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    activeSessions: 0,
    totalLoginsToday: 0
  });

  // Users Table State
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Audits Table State
  const [audits, setAudits] = useState([]);
  const [auditsPage, setAuditsPage] = useState(1);
  const [auditsTotalPages, setAuditsTotalPages] = useState(1);
  const [auditsSearch, setAuditsSearch] = useState('');
  const [auditsLoading, setAuditsLoading] = useState(false);

  // Modals / Action States
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);

  // Form States for Modals
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'USER',
    isEmailVerified: false,
    isActive: true
  });
  const [resetPwdForm, setResetPwdForm] = useState({
    password: '',
    confirmPassword: ''
  });

  // Loading indicator for global actions
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/stats');
      setStats(response.data.data);
    } catch (err) {
      toast.error('Failed to retrieve system statistics.');
    }
  };

  // Fetch Paginated Users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await api.get('/api/admin/users', {
        params: {
          page: usersPage,
          limit: 8,
          search: usersSearch
        }
      });
      setUsers(response.data.data.users || []);
      setUsersTotalPages(response.data.data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load user directory.');
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Paginated Audits
  const fetchAudits = async () => {
    setAuditsLoading(true);
    try {
      const response = await api.get('/api/admin/audit-logs', {
        params: {
          page: auditsPage,
          limit: 10,
          search: auditsSearch
        }
      });
      setAudits(response.data.data.logs || []);
      setAuditsTotalPages(response.data.data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load system audit trails.');
    } finally {
      setAuditsLoading(false);
    }
  };

  // Trigger loading based on active tab
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'audits') {
      fetchAudits();
    }
  }, [activeTab, usersPage, auditsPage]);

  // Handle User Search Input
  const handleUsersSearchSubmit = (e) => {
    e.preventDefault();
    setUsersPage(1);
    fetchUsers();
  };

  // Handle Audits Search Input
  const handleAuditsSearchSubmit = (e) => {
    e.preventDefault();
    setAuditsPage(1);
    fetchAudits();
  };

  // Disable / Enable User Toggle Action
  const handleToggleStatus = async (userRecord) => {
    setActionLoading(true);
    const targetStatus = !userRecord.isActive;
    try {
      await api.patch(`/api/admin/users/${userRecord._id}`, {
        isActive: targetStatus
      });
      toast.success(`User ${targetStatus ? 'enabled' : 'disabled'} successfully.`);
      fetchUsers();
      fetchStats(); // Update active session count if disabled
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle user status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Force Logout User Sessions Action
  const handleForceLogout = async (userId) => {
    if (!window.confirm('Force logout all active sessions for this user?')) return;
    setActionLoading(true);
    try {
      await api.delete('/api/admin/sessions', {
        data: { userId }
      });
      toast.success('Forced logout user sessions successfully.');
      fetchStats();
    } catch (err) {
      toast.error('Failed to force logout sessions.');
    } finally {
      setActionLoading(false);
    }
  };

  // Soft Delete User Action
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to soft-delete this user? All active sessions will be terminated.')) return;
    setActionLoading(true);
    try {
      await api.delete(`/api/admin/users/${userId}`);
      toast.success('User soft-deleted successfully.');
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open View Modal
  const openViewModal = (userRecord) => {
    setSelectedUser(userRecord);
    setIsViewModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (userRecord) => {
    setSelectedUser(userRecord);
    setEditForm({
      firstName: userRecord.firstName,
      lastName: userRecord.lastName,
      email: userRecord.email,
      role: userRecord.role,
      isEmailVerified: userRecord.isEmailVerified,
      isActive: userRecord.isActive
    });
    setIsEditModalOpen(true);
  };

  // Submit User Edit Form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.patch(`/api/admin/users/${selectedUser._id}`, editForm);
      toast.success('User updated successfully.');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reset Password Modal
  const openResetPwdModal = (userRecord) => {
    setSelectedUser(userRecord);
    setResetPwdForm({ password: '', confirmPassword: '' });
    setIsResetPwdModalOpen(true);
  };

  // Submit Password Reset Form
  const handleResetPwdSubmit = async (e) => {
    e.preventDefault();
    if (resetPwdForm.password !== resetPwdForm.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/api/admin/users/${selectedUser._id}`, {
        password: resetPwdForm.password
      });
      toast.success('User password reset successfully.');
      setIsResetPwdModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Super Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage system configurations, user directory, and audit logs.</p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Users Directory
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audits'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: DASHBOARD VIEW */}
      {/* ==================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Stats Widgets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* Total Users */}
            <div className="premium-card p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
              <div className="flex items-center justify-between mt-3">
                <h3 className="text-2xl font-black text-slate-800">{stats.totalUsers}</h3>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Verified Users */}
            <div className="premium-card p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Users</span>
              <div className="flex items-center justify-between mt-3">
                <h3 className="text-2xl font-black text-slate-800">{stats.verifiedUsers}</h3>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Unverified Users */}
            <div className="premium-card p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unverified</span>
              <div className="flex items-center justify-between mt-3">
                <h3 className="text-2xl font-black text-slate-800">{stats.unverifiedUsers}</h3>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="premium-card p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sessions</span>
              <div className="flex items-center justify-between mt-3">
                <h3 className="text-2xl font-black text-slate-800">{stats.activeSessions}</h3>
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Total Logins Today */}
            <div className="premium-card p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Logins Today</span>
              <div className="flex items-center justify-between mt-3">
                <h3 className="text-2xl font-black text-slate-800">{stats.totalLoginsToday}</h3>
                <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="premium-card rounded-3xl p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/10">
            <h2 className="text-xl font-display font-bold">Workspace Health Indicator</h2>
            <p className="text-sm text-blue-100 mt-2 leading-relaxed max-w-xl">
              All core database nodes are online. Encryption routines and Google verification handshakes are configured for secure logins.
            </p>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: USERS DIRECTORY VIEW */}
      {/* ==================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Controls Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <form onSubmit={handleUsersSearchSubmit} className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Search user..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            </form>
          </div>

          {/* Table Container */}
          <div className="premium-card rounded-2xl overflow-hidden bg-white">
            {usersLoading ? (
              <div className="p-12 text-center text-slate-400 animate-pulse">
                Fetching users database records...
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                No users found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider text-left">
                    <tr>
                      <th className="px-6 py-4">Avatar</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Verified</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Created Date</th>
                      <th className="px-6 py-4">Last Login</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {users.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                            {item.avatar ? (
                              <img src={item.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-slate-400 uppercase">
                                {item.firstName?.[0]}
                                {item.lastName?.[0]}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {item.firstName} {item.lastName}
                        </td>
                        <td className="px-6 py-4 text-slate-500">{item.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-700' : item.role === 'ADMIN' ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-700'
                          }`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.isEmailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {item.isEmailVerified ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.isActive ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {item.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {item.lastLogin ? new Date(item.lastLogin).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right space-x-1.5 flex justify-end items-center h-full">
                          <button
                            disabled={actionLoading}
                            onClick={() => openViewModal(item)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-lg hover:bg-slate-50"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-lg hover:bg-slate-50"
                            title="Edit user details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => handleToggleStatus(item)}
                            className={`p-1.5 border rounded-lg ${
                              item.isActive 
                                ? 'text-amber-500 hover:text-amber-700 border-slate-200 hover:bg-amber-50' 
                                : 'text-emerald-500 hover:text-emerald-700 border-slate-200 hover:bg-emerald-50'
                            }`}
                            title={item.isActive ? 'Disable User' : 'Enable User'}
                          >
                            {item.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => openResetPwdModal(item)}
                            className="p-1.5 text-indigo-500 hover:text-indigo-700 border border-slate-200 hover:bg-indigo-50 rounded-lg"
                            title="Reset password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => handleForceLogout(item._id)}
                            className="p-1.5 text-purple-500 hover:text-purple-700 border border-slate-200 hover:bg-purple-50 rounded-lg"
                            title="Force Logout Sessions"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => handleDeleteUser(item._id)}
                            className="p-1.5 text-red-500 hover:text-red-700 border border-slate-200 hover:bg-red-50 rounded-lg"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {usersTotalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Page {usersPage} of {usersTotalPages}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setUsersPage(prev => Math.max(prev - 1, 1))}
                    disabled={usersPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setUsersPage(prev => Math.min(prev + 1, usersTotalPages))}
                    disabled={usersPage === usersTotalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: AUDIT LOGS VIEW */}
      {/* ==================================================== */}
      {activeTab === 'audits' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <form onSubmit={handleAuditsSearchSubmit} className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditsSearch}
                onChange={(e) => setAuditsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            </form>
          </div>

          {/* Table Container */}
          <div className="premium-card rounded-2xl overflow-hidden bg-white">
            {auditsLoading ? (
              <div className="p-12 text-center text-slate-400 animate-pulse">
                Fetching system audit trails...
              </div>
            ) : audits.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                No logs found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider text-left">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">User Email</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">IP Address</th>
                      <th className="px-6 py-4">Browser</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {audits.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/50 transition-colors text-slate-600">
                        <td className="px-6 py-4 text-xs font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">{log.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            log.action?.includes('SUCCESS') ? 'bg-green-50 text-green-700' : log.action?.includes('FAILED') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{log.ip}</td>
                        <td className="px-6 py-4 text-xs max-w-xxs truncate">{log.browser}</td>
                        <td className="px-6 py-4 text-xs">
                          <span className={`font-semibold ${
                            log.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                          {log.details || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {auditsTotalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Page {auditsPage} of {auditsTotalPages}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setAuditsPage(prev => Math.max(prev - 1, 1))}
                    disabled={auditsPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setAuditsPage(prev => Math.min(prev + 1, auditsTotalPages))}
                    disabled={auditsPage === auditsTotalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODALS */}
      {/* ==================================================== */}
      
      {/* 1. VIEW MODAL */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6">
            <h3 className="font-display font-bold text-xl text-slate-900">User Identification Sheet</h3>
            
            <div className="flex items-center space-x-4 border-b border-slate-100 pb-5">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border flex items-center justify-center font-bold text-slate-500">
                {selectedUser.avatar ? <img src={selectedUser.avatar} className="object-cover w-full h-full" /> : selectedUser.firstName?.[0]}
              </div>
              <div>
                <h4 className="font-display font-semibold text-lg text-slate-800">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h4>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full mt-1 inline-block">
                  {selectedUser.role}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 text-sm text-slate-700">
              <div className="flex justify-between"><span className="text-slate-400">Database ID:</span><span className="font-mono text-xs">{selectedUser._id}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Email Address:</span><span>{selectedUser.email}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Verification Status:</span><span>{selectedUser.isEmailVerified ? 'Verified' : 'Pending'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">System Activity:</span><span>{selectedUser.isActive ? 'Enabled' : 'Disabled'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Account Setup:</span><span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Last System Entry:</span><span>{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'N/A'}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleEditSubmit} className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <h3 className="font-display font-bold text-xl text-slate-900">Modify User Parameters</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">First Name</label>
                <input
                  type="text"
                  required
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="mt-1.5 block w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Last Name</label>
                <input
                  type="text"
                  required
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="mt-1.5 block w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Email Address</label>
              <input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1.5 block w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">System Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                className="mt-1.5 block w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="USER">USER</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </div>

            <div className="flex items-center space-x-6 py-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={editForm.isEmailVerified}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isEmailVerified: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>Email Verified</span>
              </label>

              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>Account Active</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-750"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-750"
              >
                {actionLoading ? 'Saving...' : 'Save Parameters'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. RESET PASSWORD MODAL */}
      {isResetPwdModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleResetPwdSubmit} className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <h3 className="font-display font-bold text-xl text-slate-900">Reset User Password</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Resetting password for <strong>{selectedUser.email}</strong> will force terminate all other active web sessions.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">New Password</label>
              <input
                type="password"
                required
                value={resetPwdForm.password}
                onChange={(e) => setResetPwdForm(prev => ({ ...prev, password: e.target.value }))}
                className="mt-1.5 block w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Confirm New Password</label>
              <input
                type="password"
                required
                value={resetPwdForm.confirmPassword}
                onChange={(e) => setResetPwdForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="mt-1.5 block w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetPwdModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-75"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-750"
              >
                {actionLoading ? 'Updating password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default Admin;
