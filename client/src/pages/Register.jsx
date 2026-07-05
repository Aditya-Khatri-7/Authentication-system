import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  email: z.string().min(1, 'Email is required').email('Invalid email format').trim().toLowerCase(),
  phone: z.string().optional().refine(val => !val || /^\+?[0-9\s\-()]{7,15}$/.test(val), {
    message: 'Invalid phone format (+1234567890)',
  }),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(64, 'Password must be under 64 characters')
    .refine(val => /[A-Z]/.test(val), { message: 'Must contain an uppercase letter' })
    .refine(val => /[a-z]/.test(val), { message: 'Must contain a lowercase letter' })
    .refine(val => /\d/.test(val), { message: 'Must contain a digit' })
    .refine(val => /[!@#$%^&*(),.?":{}|<>]/.test(val), { message: 'Must contain a special character' }),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const passwordVal = watch('password', '');

  // Dynamic Password Strength Meter
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (!passwordVal) return score;
    if (passwordVal.length >= 8) score++;
    if (/[A-Z]/.test(passwordVal)) score++;
    if (/[a-z]/.test(passwordVal)) score++;
    if (/\d/.test(passwordVal)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(passwordVal)) score++;
    return score;
  }, [passwordVal]);

  const strengthColor = (score) => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const strengthLabel = (score) => {
    if (!passwordVal) return '';
    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Fair';
    return 'Strong';
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone || '',
      });

      toast.success(response.data.message || 'Registration successful!');
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed, please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold text-slate-900">Create your account</h2>
        <p className="mt-2 text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">First Name</label>
            <input
              type="text"
              {...register('firstName')}
              className={`mt-1.5 block w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.firstName ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Name</label>
            <input
              type="text"
              {...register('lastName')}
              className={`mt-1.5 block w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.lastName ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
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
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone (Optional)</label>
          <input
            type="text"
            placeholder="+1234567890"
            {...register('phone')}
            className={`mt-1.5 block w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
              errors.phone ? 'border-red-300' : 'border-slate-200'
            }`}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        <div className="relative">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Password</label>
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

          {/* Strength Meter Grid */}
          {passwordVal && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-500">Security strength:</span>
                <span className={`font-semibold ${
                  passwordStrength <= 2 ? 'text-red-600' : passwordStrength <= 4 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {strengthLabel(passwordStrength)}
                </span>
              </div>
              <div className="mt-1.5 flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-100">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-full flex-grow rounded-full transition-all duration-300 ${
                      level <= passwordStrength ? strengthColor(passwordStrength) : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Confirm Password</label>
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
          className="mt-4 w-full inline-flex items-center justify-center px-4 py-3.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};
export default Register;
