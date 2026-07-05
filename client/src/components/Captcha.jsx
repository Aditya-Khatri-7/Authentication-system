import React, { useEffect, useRef, useState } from 'react';

/**
 * Cloudflare Turnstile Captcha Widget component.
 * Dynamically loads the Turnstile script and explicitly renders the widget.
 * Exposes a ref to parents to trigger programmatic resets on errors.
 */
export const Captcha = React.forwardRef(({ onChange, onExpired }, ref) => {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    let checkInterval = null;

    const renderWidget = () => {
      if (!active) return;
      if (containerRef.current && window.turnstile && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => {
              if (active) onChange(token);
            },
            'expired-callback': () => {
              if (active && onExpired) onExpired();
            },
            'error-callback': () => {
              if (active && onExpired) onExpired();
            },
          });
        } catch (err) {
          console.error('[Gatekeeper] Turnstile render error:', err);
        }
      }
    };

    const initTurnstile = () => {
      if (window.turnstile) {
        renderWidget();
      } else {
        // Poll for Turnstile loaded state
        checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            renderWidget();
          }
        }, 100);
      }
    };

    // Inject Turnstile script dynamically if not present
    if (!document.getElementById('cloudflare-turnstile-script')) {
      const script = document.createElement('script');
      script.id = 'cloudflare-turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => {
        initTurnstile();
      };
      script.onerror = () => {
        console.error('[Gatekeeper] Failed to load Cloudflare Turnstile script.');
        if (active) {
          setError('Failed to load CAPTCHA. Check your adblocker or tracking prevention settings.');
        }
      };
    } else {
      initTurnstile();
    }

    return () => {
      active = false;
      if (checkInterval) clearInterval(checkInterval);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (e) {
          // Ignore clean up errors
        }
      }
    };
  }, [siteKey, onChange, onExpired]);

  // Expose the reset() action to parents via ref
  React.useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch (e) {
          console.error('[Gatekeeper] Turnstile reset failed:', e);
        }
      }
    }
  }));

  if (!siteKey) {
    return (
      <div className="p-3 text-xs text-red-650 bg-red-50 border border-red-200 rounded-xl text-center">
        Turnstile Site Key (VITE_TURNSTILE_SITE_KEY) is missing.
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 text-xs text-amber-850 bg-amber-50 border border-amber-200 rounded-xl text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full py-1 min-h-[65px] overflow-hidden">
      <div ref={containerRef}></div>
    </div>
  );
});

Captcha.displayName = 'Captcha';
export default Captcha;
