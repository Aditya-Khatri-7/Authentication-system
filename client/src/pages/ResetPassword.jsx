import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine(val => /[A-Z]/.test(val), { message: 'Must contain an uppercase letter' })
    .refine(val => /[a-z]/.test(val), { message: 'Must contain a lowercase letter' })
    .refine(val => /\d/.test(val), { message: 'Must contain a digit' })
    .refine(val => /[!@#$%^&*(),.?":{}|<>]/.test(val), { message: 'Must contain a special character' }),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const email = searchParams.get('email') || '';
  const otp = searchParams.get('otp') || '';

  React.useEffect(() => {
    if (!email || !otp) {
      toast.error('Invalid recovery parameters.');
      navigate('/forgot-password');
    }
  }, [email, otp, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/reset-password', {
        email,
        otp,
        newPassword: data.password,
      });

      toast.success(response.data.message || 'Password reset successfully!');
      navigate('/login');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reset password, code may have expired.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900">Set New Password</h2>
        <p className="mt-2 text-sm text-slate-500">
          Set your new password and sign back in to access the system.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">New Password</label>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className={`block w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.password ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center px-4 py-3.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating password...' : 'Update Password'}
        </button>

        <div className="text-center border-t border-slate-100 pt-4">
          <Link
            to="/login"
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </form>
    </div>
  );
};
