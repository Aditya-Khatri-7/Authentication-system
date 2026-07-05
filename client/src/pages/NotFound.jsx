import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-6 text-center">
      <div className="p-4 bg-red-50 text-red-600 rounded-3xl mb-6 shadow-md shadow-red-100">
        <ShieldAlert className="w-10 h-10 animate-bounce" />
      </div>
      
      <h1 className="font-display font-black text-5xl text-slate-900 tracking-tight">404</h1>
      <h2 className="font-display font-bold text-xl text-slate-800 mt-3">Route Not Found</h2>
      
      <p className="text-sm text-slate-500 max-w-md mt-3 leading-relaxed">
        The system path you requested does not exist or has been restricted under dynamic role permission policies.
      </p>

      <Link
        to="/"
        className="mt-8 inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-blue-500/15"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Safety</span>
      </Link>
    </div>
  );
};
