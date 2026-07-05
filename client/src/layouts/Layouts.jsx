import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Shield, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Settings, 
  KeyRound, 
  Menu, 
  X,
  Lock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Public Layout (Landing Page navbar and footer)
 */
export const PublicLayout = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-md shadow-blue-500/10">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Gatekeeper
            </span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="inline-flex items-center space-x-1.5 px-4.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all duration-250 hover:shadow-lg hover:shadow-blue-500/15"
              >
                <span>Go to Dashboard</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2">
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all duration-250"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2.5">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-display font-semibold text-slate-800">Gatekeeper Auth</span>
          </div>
          <p className="text-sm text-slate-500 text-center">
            &copy; {new Date().getFullYear()} Gatekeeper Systems. Enterprise Identity and Access Management.
          </p>
        </div>
      </footer>
    </div>
  );
};

const ArrowRightIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

/**
 * Auth Layout (Centered form views with gradient backgrounds)
 */
export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-500/10">
              <Shield className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Gatekeeper
            </span>
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
};

/**
 * Dashboard Layout (Sidebar navigation frame)
 */
export const DashboardLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
      dispatch(logout());
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      // Direct logout fallback in case network errors occur
      dispatch(logout());
      navigate('/login');
    }
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile Details', path: '/profile', icon: User },
    { name: 'Active Sessions', path: '/sessions', icon: KeyRound },
    { name: 'SaaS Settings', path: '/settings', icon: Settings },
  ];

  if (user?.role === 'SUPER_ADMIN') {
    navLinks.push({ name: 'Super Admin', path: '/admin', icon: Shield });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-2.5">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl text-white">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Gatekeeper
          </span>
        </div>

        <nav className="flex-grow p-4 space-y-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active 
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 pl-3' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          {user && (
            <div className="mb-4 px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col items-start gap-1">
              <span className="text-sm font-semibold text-slate-800 truncate w-full">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-slate-500 truncate text-[11px] w-full mb-1">{user.email}</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                user.role === 'SUPER_ADMIN' 
                  ? 'bg-red-50 text-red-700 border border-red-100' 
                  : user.role === 'ADMIN'
                    ? 'bg-orange-50 text-orange-700 border border-orange-100'
                    : user.role === 'MANAGER'
                      ? 'bg-purple-50 text-purple-700 border border-purple-100'
                      : 'bg-blue-50 text-blue-700 border border-blue-100'
              }`}>
                {user.role}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-screen">
        {/* Mobile Header Banner */}
        <header className="flex md:hidden items-center justify-between bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl text-white">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <span className="font-display font-bold text-md tracking-tight">Gatekeeper</span>
          </div>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-1.5 border border-slate-200 rounded-xl text-slate-600"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-b border-slate-200 flex flex-col px-6 py-4 space-y-2 overflow-hidden"
            >
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-slate-600'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
              {user && (
                <div className="mx-4 my-2 px-4 py-3 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col items-start gap-1">
                  <span className="text-sm font-semibold text-slate-800 truncate w-full">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-slate-500 truncate text-[11px] w-full mb-1">{user.email}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    user.role === 'SUPER_ADMIN' 
                      ? 'bg-red-50 text-red-700 border border-red-100' 
                      : user.role === 'ADMIN'
                        ? 'bg-orange-50 text-orange-700 border border-orange-100'
                        : user.role === 'MANAGER'
                          ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {user.role}
                  </span>
                </div>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600"
              >
                <LogOut className="w-4.5 h-4.5" />
                <span>Logout Session</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workspace Body */}
        <main className="flex-grow p-6 md:p-10 max-w-5xl w-full mx-auto">
          {/* User email verification banner alert if unverified */}
          {user && !user.isEmailVerified && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Email Address Unverified</h4>
                  <p className="text-xs text-amber-700">Please verify your email address to secure your profile and unlock system settings.</p>
                </div>
              </div>
              <Link 
                to="/verify-email" 
                className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-750 text-white rounded-xl text-center flex-shrink-0"
              >
                Verify Profile
              </Link>
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
};
