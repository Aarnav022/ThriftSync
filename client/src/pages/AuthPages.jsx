import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Leaf, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STORE_BG_IMAGE = 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=2000&q=80';
const ADMIN_BG_IMAGE = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2000&q=80';

export function LoginPage({ initialMode = 'user' }) {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin/login' || initialMode === 'admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setError('');
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your campus email and password.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (!res?.success) {
        setError(res?.message || 'Authentication failed. Please check credentials.');
        return;
      }
      const loggedInUser = res?.user;

      if (isAdminRoute) {
        if (loggedInUser?.role !== 'admin') {
          logout();
          setError('Access Denied: Administrator privileges required.');
          return;
        }
        navigate('/admin');
      } else {
        if (loggedInUser?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentBgImage = isAdminRoute ? ADMIN_BG_IMAGE : STORE_BG_IMAGE;

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col items-center justify-center p-4 sm:p-6 text-[#122620] select-none transition-all duration-700"
      style={{ backgroundImage: `url('${currentBgImage}')` }}
    >
      {/* Rich Dark-Forest Gradient Overlay with Subtle Blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#122620]/90 via-[#1D3B32]/80 to-black/85 backdrop-blur-[2px]" />

      {/* Main Relative Content Container */}
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center py-6">
        
        {/* Brand Logo Header */}
        <Link to="/" className="mb-6 flex flex-col items-center group">
          <div className="flex items-baseline gap-1.5">
            <Leaf className="w-7 h-7 text-[#E07A5F] drop-shadow-md group-hover:rotate-12 transition-transform" />
            <span className="text-3xl font-black text-white tracking-tight drop-shadow-md">
              Thrift<span className="text-[#E07A5F]">Sync</span>
            </span>
            <span className="text-xs font-bold text-[#A3B899] drop-shadow-xs">.campus</span>
          </div>
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#E07A5F] to-transparent rounded-full -mt-0.5 opacity-90" />
        </Link>

        {/* Error Alert */}
        {error && (
          <div className="w-full mb-4 p-3 border border-red-300 bg-red-50/95 backdrop-blur-xs rounded-lg text-xs text-red-700 flex items-start gap-2 shadow-md">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Elevated Frosted Glass Card */}
        <div className="w-full bg-white/95 backdrop-blur-md shadow-2xl border border-white/30 rounded-xl p-6 sm:p-7 space-y-4">
          
          {/* Card Header & Badge */}
          <div>
            {isAdminRoute ? (
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#122620] text-[#E07A5F] rounded-md text-[11px] font-bold border border-[#1D3B32]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E07A5F]" />
                  <span>ThriftSync Campus Administration</span>
                </div>
                <h1 className="text-xl font-bold text-[#122620]">Administrator Sign In</h1>
                <p className="text-xs text-gray-500">
                  Restricted portal for campus moderators & administration
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-bold text-[#122620]">Student Sign In</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Access student bargains, textbooks, seller studio, and track deliveries
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#122620] mb-1">
                {isAdminRoute ? 'Administrator Email' : 'Campus Email Address'}
              </label>
              <input
                type="email"
                required
                placeholder={isAdminRoute ? 'admin@college.edu' : 'name@college.edu'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E6E4DD] rounded text-xs outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] transition-all font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-[#122620]">Password</label>
                <a href="#" className="text-xs text-[#2A6F4E] hover:underline font-semibold">
                  Forgot Password
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E6E4DD] rounded text-xs outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] pr-8 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 rounded-full text-xs font-bold text-white shadow-md cursor-pointer mt-2 transition-all ${
                isAdminRoute
                  ? 'bg-[#122620] hover:bg-[#1D3B32]'
                  : 'bg-[#E07A5F] hover:bg-[#C86449] active:bg-[#B5553C]'
              }`}
            >
              {isSubmitting
                ? 'Verifying...'
                : isAdminRoute
                ? 'Sign In to Admin Portal'
                : 'Sign In to ThriftSync'}
            </button>
          </form>

          {/* Quick Switch Link */}
          <div className="pt-2 text-center text-xs border-t border-gray-100">
            {isAdminRoute ? (
              <Link
                to="/login"
                className="text-[#2A6F4E] hover:underline font-bold inline-flex items-center gap-1"
              >
                ← Back to Student Sign In
              </Link>
            ) : (
              <Link
                to="/admin/login"
                className="text-[#E07A5F] hover:text-[#C86449] font-bold inline-flex items-center justify-center gap-1 hover:underline"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Portal Login →</span>
              </Link>
            )}
          </div>

          <p className="text-[11px] text-[#5C635E] leading-tight pt-1 text-center">
            By signing in, you agree to ThriftSync's{' '}
            <a href="#" className="text-[#2A6F4E] hover:underline">Campus Code of Conduct</a> and{' '}
            <a href="#" className="text-[#2A6F4E] hover:underline">Handover Guidelines</a>.
          </p>
        </div>

        {/* New Student Register Button */}
        {!isAdminRoute && (
          <div className="w-full mt-5 text-center space-y-3">
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="flex-shrink mx-3 text-xs text-white/80 font-semibold drop-shadow-xs">New to ThriftSync?</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>

            <Link
              to="/register"
              className="w-full block py-2.5 bg-white/90 hover:bg-white border border-white/30 rounded-full text-xs font-bold text-[#122620] shadow-md transition-all text-center"
            >
              Create your Student Account
            </Link>
          </div>
        )}

        {/* Legal Footer Links */}
        <footer className="w-full mt-8 pt-4 border-t border-white/20 text-center text-[11px] text-white/75 space-y-1.5 pb-2">
          <div className="flex justify-center gap-4">
            <a href="#" className="hover:text-white hover:underline transition-colors">Conditions of Use</a>
            <a href="#" className="hover:text-white hover:underline transition-colors">Privacy Notice</a>
            <Link to="/admin/login" className="hover:text-white hover:underline text-[#E07A5F] font-semibold transition-colors">
              Admin Access
            </Link>
          </div>
          <p>© 2026 ThriftSync. All rights reserved.</p>
        </footer>

      </div>
    </div>
  );
}

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [campus, setCampus] = useState('North Campus Hub');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required registration fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const res = await register(name.trim(), email.trim(), password, campus);
      if (!res?.success) {
        setError(res?.message || 'Registration failed. Email may already be in use.');
        return;
      }
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Registration failed. Email may already be in use.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col items-center justify-center p-4 sm:p-6 text-[#122620] select-none"
      style={{ backgroundImage: `url('${STORE_BG_IMAGE}')` }}
    >
      {/* Rich Dark-Forest Gradient Overlay with Subtle Blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#122620]/90 via-[#1D3B32]/80 to-black/85 backdrop-blur-[2px]" />

      {/* Main Relative Content Container */}
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center py-6">
        
        {/* Brand Logo Header */}
        <Link to="/" className="mb-6 flex flex-col items-center group">
          <div className="flex items-baseline gap-1.5">
            <Leaf className="w-7 h-7 text-[#E07A5F] drop-shadow-md group-hover:rotate-12 transition-transform" />
            <span className="text-3xl font-black text-white tracking-tight drop-shadow-md">
              Thrift<span className="text-[#E07A5F]">Sync</span>
            </span>
            <span className="text-xs font-bold text-[#A3B899] drop-shadow-xs">.campus</span>
          </div>
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#E07A5F] to-transparent rounded-full -mt-0.5 opacity-90" />
        </Link>

        {/* Error Alert */}
        {error && (
          <div className="w-full mb-4 p-3 border border-red-300 bg-red-50/95 backdrop-blur-xs rounded-lg text-xs text-red-700 flex items-start gap-2 shadow-md">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Elevated Frosted Glass Card */}
        <div className="w-full bg-white/95 backdrop-blur-md shadow-2xl border border-white/30 rounded-xl p-6 sm:p-7 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-[#122620]">Create Student Account</h1>
            <p className="text-xs text-gray-500 mt-0.5">One account to buy, sell, and rent on your campus</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#122620] mb-1">Your Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Student Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E6E4DD] rounded text-xs outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#122620] mb-1">Campus Email Address</label>
              <input
                type="email"
                required
                placeholder="name@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E6E4DD] rounded text-xs outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#122620] mb-1">Campus Hub / Faculty</label>
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E6E4DD] rounded text-xs outline-none font-medium"
              >
                <option value="North Campus Hub">North Campus Hub</option>
                <option value="South Campus Hostel 4">South Campus Hostel 4</option>
                <option value="Engineering Quad">Engineering Quad</option>
                <option value="Student Activity Center">Student Activity Center</option>
                <option value="Central Administration">Central Administration</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#122620] mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E6E4DD] rounded text-xs outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] pr-8 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Passwords must be at least 8 characters.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-full text-xs font-bold text-white shadow-md cursor-pointer mt-2 transition-all bg-[#E07A5F] hover:bg-[#C86449] active:bg-[#B5553C]"
            >
              {isSubmitting ? 'Creating Campus Account...' : 'Create your Student Account'}
            </button>
          </form>

          <p className="text-[11px] text-[#5C635E] leading-tight pt-1 text-center">
            By creating an account, you agree to ThriftSync's{' '}
            <a href="#" className="text-[#2A6F4E] hover:underline">Terms of Exchange</a> and{' '}
            <a href="#" className="text-[#2A6F4E] hover:underline">Privacy Notice</a>.
          </p>

          <div className="pt-3 border-t border-gray-100 text-xs text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2A6F4E] hover:underline font-bold">
              Sign in
            </Link>
          </div>
        </div>

        {/* Legal Footer Links */}
        <footer className="w-full mt-8 pt-4 border-t border-white/20 text-center text-[11px] text-white/75 space-y-1.5 pb-2">
          <div className="flex justify-center gap-4">
            <a href="#" className="hover:text-white hover:underline transition-colors">Conditions of Use</a>
            <a href="#" className="hover:text-white hover:underline transition-colors">Privacy Notice</a>
            <Link to="/admin/login" className="hover:text-white hover:underline text-[#E07A5F] font-semibold transition-colors">
              Admin Access
            </Link>
          </div>
          <p>© 2026 ThriftSync. All rights reserved.</p>
        </footer>

      </div>
    </div>
  );
}
