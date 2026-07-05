import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  loginType: z.enum(['USER', 'ADMIN']),
});

export const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginType: 'USER'
    }
  });

  const onSubmit = async (data) => {
    if (turnstileToken === null) {
      toast.error('Please complete the security check');
      return;
    }

    setLoading(true);
    setServerError('');
    try {
      const response = await api.post('/api/auth/login', {
        email: data.email,
        password: data.password,
        loginType: data.loginType,
        cf_turnstile_response: turnstileToken,
      });

      const { accessToken, user } = response.data.data;

      // Dispatch Redux credentials
      dispatch(setCredentials({ accessToken, user }));
      
      toast.success(response.data.message || 'Login successful!');
      if (user.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed, please check credentials.';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setTurnstileToken(null);
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold text-slate-900">Sign in to Gatekeeper</h2>
        <p className="mt-2 text-sm text-slate-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Create an account
          </Link>
        </p>
      </div>

      {serverError && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2.5 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Access Level</label>
          <select
            {...register('loginType')}
            className="mt-1.5 block w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          >
            <option value="USER">User Account</option>
            <option value="ADMIN">Super Admin Portal</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            {...register('email')}
            className={`mt-1.5 block w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
              errors.email ? 'border-red-300' : 'border-slate-200'
            }`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Password</label>
            <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Forgot password?
            </Link>
          </div>
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

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 focus:outline-none"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 font-medium select-none">
              Remember me
            </label>
          </div>
        </div>

        {/* Captcha checkbox widget */}
        <div className="flex justify-center w-full py-1 min-h-[65px] overflow-hidden">
          <Turnstile
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
            onSuccess={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
            options={{ theme: 'light' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !turnstileToken}
          className="w-full inline-flex items-center justify-center px-4 py-3.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};
export default Login;

