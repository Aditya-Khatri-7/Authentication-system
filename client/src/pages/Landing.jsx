import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Key, 
  Lock, 
  RefreshCw, 
  Layers, 
  Terminal, 
  Mail,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Landing = () => {
  const features = [
    {
      title: 'Decoupled Layered Architecture',
      description: 'Built following strict routing, service integration, data access layer schemas, and independent object models for security isolation.',
      icon: Layers,
      color: 'from-blue-500 to-cyan-400'
    },
    {
      title: 'Refresh Token Rotation',
      description: 'Secured via unique JTI transaction footprints and rotating HttpOnly tokens to mitigate replay attacks.',
      icon: RefreshCw,
      color: 'from-indigo-500 to-purple-500'
    },
    {
      title: 'Brute-Force Account Protection',
      description: 'Monitors consecutive failures, applying automatic 15-minute lockouts. Custom rate-limit caps applied per IP.',
      icon: Lock,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Secure OTP Handshakes',
      description: 'Generates secure 6-digit cryptographic integers expiring automatically in 10 minutes. Capped at 5 wrong inputs.',
      icon: Mail,
      color: 'from-cyan-500 to-emerald-500'
    }
  ];

  return (
    <div className="bg-slate-50 relative overflow-hidden pb-16">
      {/* Background patterns */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-8"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Gatekeeper v1.0 Production-Ready Release</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight"
        >
          Secure Identity & Access Management for{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Enterprise Apps
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed"
        >
          A production-grade authentication engine designed with layered clean architecture, cryptographic verification handshakes, and strict access control boundaries.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/10 transition-all hover:shadow-blue-500/20"
          >
            <span>Deploy Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-all"
          >
            Sign In Portal
          </Link>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl font-bold text-slate-900">Security-First Integration Stack</h2>
          <p className="text-slate-600 mt-4">Every component is audited to fulfill compliance benchmarks and provide standard authentication layers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className="premium-card p-6 rounded-3xl"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white mb-6`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-slate-800 text-lg">{feat.title}</h3>
                <p className="text-sm text-slate-500 mt-3 leading-relaxed">{feat.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Architecture Visual */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="premium-card rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-800">Strict Layered Flow Control</h2>
              <p className="text-slate-500 text-sm mt-4 leading-relaxed">
                Gatekeeper prevents routing modules from directly accessing database schemas. All mutations or auditing log additions occur in the Service layer, preventing routing leaks.
              </p>
              
              <ul className="mt-8 space-y-3.5">
                {[
                  'Encapsulated data store abstraction layer',
                  'JSON Structured Logs wrapping credentials masks',
                  'IP-based route rate limiting handlers',
                  'Dynamic verification templates with IP indicators'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center space-x-3 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 font-mono text-xs text-blue-400 overflow-x-auto shadow-inner border border-slate-800">
              <div className="text-slate-500 mb-2">// Server Request Pipeline Architecture</div>
              <div><span className="text-purple-400">GET</span> /api/admin/users</div>
              <div className="text-slate-600">  └─► Validate Token Claims</div>
              <div className="text-slate-600">  └─► Authorize Permissions ("users.read")</div>
              <div className="text-slate-600">  └─► Delegate to User Admin Handler</div>
              <div className="text-slate-600">  │     └─► Query Active Identity Records</div>
              <div className="text-emerald-400">  └─► Return JSON Success Envelope</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
