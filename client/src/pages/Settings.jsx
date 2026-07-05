import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, Bell, User } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .refine(val => /[A-Z]/.test(val), { message: 'Must contain an uppercase letter' })
    .refine(val => /[a-z]/.test(val), { message: 'Must contain a lowercase letter' })
    .refine(val => /\d/.test(val), { message: 'Must contain a digit' })
    .refine(val => /[!@#$%^&*(),.?":{}|<>]/.test(val), { message: 'Must contain a special character' }),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast.success(response.data.message || 'Password changed successfully! Logging out other sessions.');
      
      // Since password changes invalidate all tokens, log out immediately
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to change password. Double check current password.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">SaaS Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage system configurations and change account credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left pane: description */}
        <div>
          <h3 className="font-display font-bold text-slate-800 text-lg">System Security</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Changing your password will immediately invalidate all other active refresh sessions for your account, forcing reconnect handshakes on other devices.
          </p>
        </div>

        {/* Right pane: change credentials */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card rounded-3xl p-6 sm:p-8 bg-white">
            <h2 className="text-xl font-display font-bold text-slate-850 flex items-center space-x-2">
              <Lock className="w-5 h-5 text-blue-600" />
              <span>Modify Password</span>
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Current Password</label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword1 ? 'text' : 'password'}
                    {...register('currentPassword')}
                    className={`block w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.currentPassword ? 'border-red-300' : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword1(!showPassword1)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">New Password</label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword2 ? 'text' : 'password'}
                    {...register('newPassword')}
                    className={`block w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      errors.newPassword ? 'border-red-300' : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword2(!showPassword2)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className={`mt-1.5 block w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.confirmPassword ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:bg-blue-400"
                >
                  {loading ? 'Changing password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
