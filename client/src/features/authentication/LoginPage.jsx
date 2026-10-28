import React, { useState } from 'react';
import {
  ShieldCheck,
  Leaf,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  BookOpen,
  Repeat,
  Truck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from './authContext.jsx';
import { mergeGuestCart } from '../cart/cartService.js';

export function LoginPage({ onLoginSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    campus: 'North Campus',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      let res;
      if (mode === 'login') {
        res = await login(formData.email, formData.password);
      } else {
        res = await register(formData);
      }

      if (res.success) {
        // Automatically merge any guest shopping bag items upon sign in
        await mergeGuestCart().catch(() => {});
        if (onLoginSuccess) onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-between selection:bg-sustainability/20">
      {/* Top Simple Brand Bar */}
      <header className="border-b border-stone-200 dark:border-stone-800 bg-surface/80 dark:bg-[#1E1D1B]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-sustainability flex items-center justify-center text-white shadow-xs">
              <Leaf className="size-4.5" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-text block">
                ThriftSync <span className="text-[10px] uppercase font-bold text-sustainability ml-1 px-1.5 py-0.2 rounded bg-sustainability/10 border border-sustainability/20">India</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-stone-600 dark:text-stone-400">
            <a href="#terms" className="hover:text-text transition">Terms of Service</a>
            <a href="#privacy" className="hover:text-text transition">Privacy Policy</a>
          </div>
        </div>
      </header>

      {/* Main Centered Authentication Shell */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sustainability/10 border border-sustainability/20 text-sustainability dark:text-green-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="size-3.5" />
              <span>Verified Campus Community</span>
            </div>
            <h1 className="text-2xl font-black text-text tracking-tight">
              {mode === 'login' ? 'Welcome Back to ThriftSync' : 'Join Your Campus Marketplace'}
            </h1>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
              {mode === 'login'
                ? 'Sign in to access your student bag, orders, rentals, and peer swaps.'
                : 'Create your free account to buy, rent, and swap pre-loved campus essentials.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-background border border-stone-200 dark:border-stone-800 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl transition ${
                mode === 'login'
                  ? 'bg-surface dark:bg-[#1E1D1B] text-text shadow-xs border border-stone-200/80 dark:border-stone-700'
                  : 'text-stone-500 hover:text-text'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl transition ${
                mode === 'signup'
                  ? 'bg-surface dark:bg-[#1E1D1B] text-text shadow-xs border border-stone-200/80 dark:border-stone-700'
                  : 'text-stone-500 hover:text-text'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-background focus:outline-none focus:border-sustainability text-text"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                    Campus / University *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. North Campus, Delhi University"
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-background focus:outline-none focus:border-sustainability text-text"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="student@campus.edu.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-background focus:outline-none focus:border-sustainability text-text"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-background focus:outline-none focus:border-sustainability text-text"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-sustainability hover:bg-[#15361e] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Connecting Securely...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Log In to Account' : 'Create Free Account'}</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Value Highlights */}
          <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800 grid grid-cols-3 gap-2 text-center text-[10px] text-stone-500">
            <div>
              <Truck className="size-4 mx-auto text-rental mb-1" />
              <span>Campus Delivery</span>
            </div>
            <div>
              <Repeat className="size-4 mx-auto text-sustainability mb-1" />
              <span>Circular Swaps</span>
            </div>
            <div>
              <ShieldCheck className="size-4 mx-auto text-sustainability mb-1" />
              <span>Verified Students</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-6 px-4 text-center text-xs text-stone-500">
        <p>© 2026 ThriftSync India. Sustainable student commerce & circular peer exchange.</p>
        <div className="mt-2 flex items-center justify-center gap-4 text-[11px]">
          <a href="#terms" className="hover:underline">Terms and Conditions</a>
          <span>•</span>
          <a href="#privacy" className="hover:underline">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}

export default LoginPage;
