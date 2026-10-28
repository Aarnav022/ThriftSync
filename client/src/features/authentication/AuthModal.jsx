import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Mail, User as UserIcon, Building, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from './authContext.jsx';

export function AuthModal({ isOpen, onClose, initialMode = 'login', initialMessage = '' }) {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    campus: 'North Quad',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  const { login, register } = useAuth();

  useEffect(() => {
    setMode(initialMode);
    setServerError(null);
    setFieldErrors({});
  }, [initialMode, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const errors = {};
    if (mode === 'register' && (!formData.name || formData.name.trim().length < 2)) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please provide a valid email address';
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errors.password = 'Password must include both letters and numbers';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          onClose();
        } else {
          setServerError(result.message);
        }
      } else {
        const result = await register(formData);
        if (result.success) {
          onClose();
        } else {
          setServerError(result.message);
          if (result.errors) {
            const mapped = {};
            result.errors.forEach((err) => {
              mapped[err.field] = err.message;
            });
            setFieldErrors(mapped);
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl p-6 sm:p-8 overflow-hidden text-text"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
          aria-label="Close dialog"
        >
          <X className="size-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sustainability text-white font-bold text-lg mb-3 shadow-sm">
            TS
          </div>
          <h2 id="auth-modal-title" className="text-2xl font-black tracking-tight text-text">
            {mode === 'login' ? 'Sign In to ThriftSync' : 'Create Student Account'}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {initialMessage || (mode === 'login' ? 'Access your campus listings, rentals and swaps.' : 'Join your residence hall and trade pre-owned gear.')}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setServerError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
              mode === 'login'
                ? 'border-sustainability text-sustainability dark:text-green-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setServerError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
              mode === 'register'
                ? 'border-sustainability text-sustainability dark:text-green-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            Register
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold mb-1 text-stone-700 dark:text-stone-300" htmlFor="auth-name">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 size-4 text-stone-400" />
                <input
                  id="auth-name"
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-sustainability"
                />
              </div>
              {fieldErrors.name && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.name}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold mb-1 text-stone-700 dark:text-stone-300" htmlFor="auth-email">
              Campus Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-stone-400" />
              <input
                id="auth-email"
                type="email"
                required
                placeholder="name@campus.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-sustainability"
              />
            </div>
            {fieldErrors.email && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 text-stone-700 dark:text-stone-300" htmlFor="auth-password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 size-4 text-stone-400" />
              <input
                id="auth-password"
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-sustainability"
              />
            </div>
            {fieldErrors.password && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.password}</p>}
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold mb-1 text-stone-700 dark:text-stone-300" htmlFor="auth-campus">
                Residence / Campus Quad
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 size-4 text-stone-400" />
                <input
                  id="auth-campus"
                  type="text"
                  placeholder="e.g. North Quad Dorms"
                  value={formData.campus}
                  onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-sustainability"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-sustainability hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In to Account' : 'Complete Registration'}</span>
              )}
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <p className="text-[11px] text-center text-stone-500 dark:text-stone-400 mt-6">
          🔒 Encrypted password verification. Server assigns verified student role automatically.
        </p>
      </div>
    </div>
  );
}

export default AuthModal;
