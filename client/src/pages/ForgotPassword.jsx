import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format').trim().toLowerCase(),
});

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data) => {
    if (turnstileToken === null) {
      toast.error('Please complete the security check');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/forgot-password', {
        email: data.email,
        cf_turnstile_response: turnstileToken,
      });

      toast.success(response.data.message || 'If the email exists, we will send an OTP.');
      navigate(`/verify-reset-otp?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      const msg = error.response?.data?.message || 'Something went wrong, please try again.';
      toast.error(msg);
    } finally {
      setTurnstileToken(null);
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 mb-4">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900">Forgot Password?</h2>
        <p className="mt-2 text-sm text-slate-500">
          Enter your email address and we'll send you a 6-digit OTP code to verify and reset your credentials.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
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
          {loading ? 'Sending code...' : 'Send Reset Code'}
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
export default ForgotPassword;
