import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import toast from 'react-hot-toast';
import { KeyRound, ShieldAlert, Trash2, ShieldCheck, Laptop, Globe } from 'lucide-react';

export const Sessions = () => {
  const { user } = useSelector((state) => state.auth);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const fetchSessions = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/api/admin/sessions');
      setSessions(response.data.data.sessions || []);
    } catch (err) {
      toast.error('Failed to load active system sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [isAdmin]);

  const handleTerminateSession = async (sessionId) => {
    setActionLoading(true);
    try {
      const response = await api.delete(`/api/admin/sessions/${sessionId}`);
      toast.success(response.data.message || 'Session terminated successfully.');
      // Refresh list
      await fetchSessions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to terminate session.';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminateAllForUser = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to terminate all sessions for this user? This will log them out immediately.')) return;
    setActionLoading(true);
    try {
      const response = await api.delete('/api/admin/sessions', {
        data: { userId: targetUserId }
      });
      toast.success(response.data.message || 'All sessions for user terminated.');
      await fetchSessions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to terminate user sessions.';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg"></div>
        <div className="space-y-3">
          <div className="h-16 bg-slate-200 animate-pulse rounded-2xl"></div>
          <div className="h-16 bg-slate-200 animate-pulse rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Active Sessions</h1>
        <p className="text-sm text-slate-500 mt-1">Manage active logins and revoke access credentials.</p>
      </div>

      {isAdmin ? (
        <div className="space-y-6">
          <div className="premium-card rounded-3xl overflow-hidden bg-white">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-display font-bold text-slate-800 text-lg flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <span>Live Administrator Session Dashboard</span>
              </h2>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                {sessions.length} active sessions
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No active refresh tokens found in the database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider text-left">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">IP Address</th>
                      <th className="px-6 py-4">Client App</th>
                      <th className="px-6 py-4">Session Expiration</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {sessions.map((sess) => (
                      <tr key={sess.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4.5">
                          <div className="font-semibold text-slate-900">{sess.name || 'Unknown'}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{sess.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4.5 font-mono text-xs text-slate-500">
                          {sess.ipAddress || '127.0.0.1'}
                        </td>
                        <td className="px-6 py-4.5 text-xs text-slate-500 max-w-xs truncate">
                          {sess.userAgent || 'Web Client'}
                        </td>
                        <td className="px-6 py-4.5 text-xs text-slate-500">
                          {new Date(sess.expiresAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4.5 text-right space-x-2">
                          <button
                            disabled={actionLoading}
                            onClick={() => handleTerminateSession(sess.id)}
                            className="p-2 border border-slate-200 rounded-xl text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors inline-flex items-center"
                            title="Revoke session token"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => handleTerminateAllForUser(sess.userId)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors inline-flex items-center"
                            title="Revoke all user sessions"
                          >
                            Revoke All
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="premium-card rounded-3xl p-8 max-w-2xl">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Administrator Access Required</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Active session auditing is restricted to workspace administrators. Standard profiles inherit self-revocation options automatically.
              </p>
              
              <div className="mt-6 p-4.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Your Current Session</h4>
                <div className="flex items-center space-x-3 text-sm">
                  <Laptop className="w-4.5 h-4.5 text-slate-400" />
                  <span className="text-slate-700">Browser: Chrome / Safari Client</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Globe className="w-4.5 h-4.5 text-slate-400" />
                  <span className="text-slate-750 font-mono text-xs">IP Address: 127.0.0.1 (localhost)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
