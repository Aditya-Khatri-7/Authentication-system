import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';

export const VerifyResetOtp = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error('No email address provided for password recovery.');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length !== 6 || isNaN(pasteData)) return;

    const newOtp = pasteData.split('');
    setOtp(newOtp);
    inputRefs.current[5].focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/verify-reset-otp', {
        email,
        otp: code,
      });

      toast.success(response.data.message || 'OTP validated successfully.');
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(code)}`);
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid code, please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    try {
      const response = await axios.post('/api/auth/resend-otp', {
        email,
        purpose: 'PASSWORD_RESET',
      });
      toast.success(response.data.message || 'New OTP sent successfully.');
      setTimer(60);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to resend code, try again later.';
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900">Verify recovery OTP</h2>
        <p className="mt-2 text-sm text-slate-500">
          Enter the 6-digit password reset OTP sent to <br />
          <strong className="text-slate-800 font-semibold">{email}</strong>
        </p>
      </div>

      <form onSubmit={handleVerify} className="mt-8 space-y-6">
        <div className="flex justify-between gap-2.5">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              ref={(el) => (inputRefs.current[idx] = el)}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className="w-12 h-14 block text-center rounded-xl bg-slate-50 border border-slate-200 text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otp.some(v => v === '')}
          className="w-full inline-flex items-center justify-center px-4 py-3.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify OTP Code'}
        </button>

        <div className="text-center">
          <button
            type="button"
            disabled={timer > 0 || resending}
            onClick={handleResend}
            className="inline-flex items-center space-x-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            <span>
              {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
            </span>
          </button>
        </div>

        <div className="text-center border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Request Reset</span>
          </button>
        </div>
      </form>
    </div>
  );
};
