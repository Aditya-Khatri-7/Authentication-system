import axios from 'axios';
import AppError from './appError.js';

/**
 * Verifies the Cloudflare Turnstile CAPTCHA token with Cloudflare's validation endpoint.
 * Accepts a development mode bypass for local testing if needed.
 */
export const verifyRecaptcha = async (token) => {
  // If in development mode and token is bypassed, pass verification
  if (process.env.NODE_ENV === 'development' && 
      (token === 'mock-turnstile-token' || token === 'mock-turnstile-token-bypass-adblockers')) {
    console.log('[Gatekeeper] Development Mode: Bypassing Turnstile captcha verification.');
    return true;
  }

  if (!token) {
    throw new AppError('CAPTCHA verification token is missing.', 400);
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.warn('[Gatekeeper Warning] TURNSTILE_SECRET_KEY is missing in env configuration.');
    // Resilient fallback in dev mode if secret is unconfigured
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    throw new AppError('CAPTCHA service is unconfigured.', 500);
  }

  try {
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 5000,
      }
    );

    const { success, 'error-codes': errorCodes } = response.data;

    if (!success) {
      console.error('[Gatekeeper] Turnstile token verification failed:', errorCodes);
      throw new AppError('CAPTCHA verification failed. Please try again.', 400);
    }

    return true;
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    console.error('[Gatekeeper Error] Turnstile verification exception:', error.message);
    
    // In dev mode, remain resilient if challenges.cloudflare.com is unreachable
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Gatekeeper] Offline Dev Mode: Bypassing Turnstile network error.');
      return true;
    }

    throw new AppError('CAPTCHA verification service is currently unavailable.', 503);
  }
};

export default verifyRecaptcha;
