import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../redux/authSlice';
import api from '../services/api';
import { 
  User, 
  ShieldAlert, 
  MailCheck, 
  Clock, 
  Activity, 
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/profile');
        const userDetails = response.data.data.user;
        dispatch(setCredentials({ user: userDetails }));
      } catch (err) {
        toast.error('Failed to load user profile metadata.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 animate-pulse rounded-2xl"></div>
          <div className="h-32 bg-slate-200 animate-pulse rounded-2xl"></div>
          <div className="h-32 bg-slate-200 animate-pulse rounded-2xl"></div>
        </div>
        <div className="h-64 bg-slate-200 animate-pulse rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header banner */}
      <div>
        <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-sm text-slate-500 mt-1">Here is a summary of your security credential metrics.</p>
      </div>

      {/* Metrics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Verification Widget */}
        <div className="premium-card p-6 rounded-3xl flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Verification</span>
            <h3 className="text-lg font-bold text-slate-800 mt-2.5">
              {user?.isEmailVerified ? 'Verified' : 'Action Required'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {user?.isEmailVerified ? 'Your account is secured.' : 'Confirm email ownership.'}
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${user?.isEmailVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {user?.isEmailVerified ? <MailCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
        </div>

        {/* Access Role Widget */}
        <div className="premium-card p-6 rounded-3xl flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security Access Role</span>
            <h3 className="text-lg font-bold text-slate-800 mt-2.5">{user?.role}</h3>
            <p className="text-xs text-slate-500 mt-1">Permissions map dynamically.</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Connection Widget */}
        <div className="premium-card p-6 rounded-3xl flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Uptime Status</span>
            <h3 className="text-lg font-bold text-slate-800 mt-2.5">
              {user?.isActive ? 'Active Session' : 'Locked'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">All features operating.</p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Account Info Details */}
      <div className="premium-card rounded-3xl p-6 sm:p-8">
        <h2 className="text-xl font-display font-bold text-slate-850">Identity Details</h2>
        <div className="mt-6 border-t border-slate-100 divide-y divide-slate-100">
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">Unique Identity ID</span>
            <span className="font-mono text-xs text-slate-800 mt-1 sm:mt-0">{user?.id}</span>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">Primary Email Address</span>
            <span className="text-slate-800 mt-1 sm:mt-0">{user?.email}</span>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">Contact Number</span>
            <span className="text-slate-800 mt-1 sm:mt-0">{user?.phone || 'Not Configured'}</span>
          </div>
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">Last System Authentication</span>
            <span className="text-slate-800 mt-1 sm:mt-0">
              {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First Session Login'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/profile" className="premium-card p-6 rounded-3xl premium-card-hover transition-all flex items-center justify-between group">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-850">Customize Profile</h3>
              <p className="text-xs text-slate-500 mt-1">Configure your contact details and avatars</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        </Link>

        <Link to="/sessions" className="premium-card p-6 rounded-3xl premium-card-hover transition-all flex items-center justify-between group">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-850">Manage Sessions</h3>
              <p className="text-xs text-slate-500 mt-1">Inspect active devices and log out sessions</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        </Link>
      </div>
    </div>
  );
};
