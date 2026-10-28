import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
  ExternalLink,
  MapPin,
  Building,
} from 'lucide-react';
import { useAuth } from '../authentication/authContext.jsx';
import { updateMyProfile, changePassword } from './userService.js';

export function AccountSettingsModal({ isOpen, onClose }) {
  const { user, updateUserData } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'preferences'

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    campus: '',
    avatar: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Password Form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (user && isOpen) {
      setProfileForm({
        name: user.name || '',
        campus: user.campus || '',
        avatar: user.avatar || '',
      });
      setProfileMessage(null);
      setProfileError(null);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordMessage(null);
      setPasswordError(null);
    }
  }, [user, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    setIsSavingProfile(true);

    try {
      const updated = await updateMyProfile({
        name: profileForm.name.trim(),
        campus: profileForm.campus.trim(),
        avatar: profileForm.avatar ? profileForm.avatar.trim() : null,
      });
      if (updateUserData) {
        updateUserData(updated);
      }
      setProfileMessage('Your profile details have been successfully updated.');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(passwordForm.newPassword)) {
      setPasswordError('New password must contain at least one letter and one number.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res?.data?.token) {
        try {
          localStorage.setItem('thriftsync_token', res.data.token);
        } catch {}
      }
      setPasswordMessage('Your password has been securely updated. Other device sessions have been revoked.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleToggleTheme = (enableDark) => {
    setIsDarkTheme(enableDark);
    if (typeof document !== 'undefined') {
      if (enableDark) {
        document.documentElement.classList.add('dark');
        try { localStorage.setItem('thriftsync-theme', 'dark'); } catch (e) {}
      } else {
        document.documentElement.classList.remove('dark');
        try { localStorage.setItem('thriftsync-theme', 'light'); } catch (e) {}
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-settings-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl my-8 bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative text-text animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
          aria-label="Close settings"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sustainability/10 border border-sustainability/20 text-sustainability dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-2">
            <User className="size-3.5" />
            <span>Account Center</span>
          </div>
          <h2 id="account-settings-title" className="text-2xl font-black text-text tracking-tight">
            Account & Profile Settings
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Manage your campus profile, password credentials, and platform preferences.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'profile'
                ? 'bg-sustainability text-white shadow-sm'
                : 'bg-background text-stone-600 dark:text-stone-400 hover:text-text'
            }`}
          >
            Profile Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'security'
                ? 'bg-sustainability text-white shadow-sm'
                : 'bg-background text-stone-600 dark:text-stone-400 hover:text-text'
            }`}
          >
            Security & Password
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'preferences'
                ? 'bg-sustainability text-white shadow-sm'
                : 'bg-background text-stone-600 dark:text-stone-400 hover:text-text'
            }`}
          >
            Preferences & Privacy
          </button>
        </div>

        {/* TAB 1: PROFILE INFORMATION */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileMessage && (
              <div className="p-3 rounded-2xl bg-sustainability/10 border border-sustainability/20 text-sustainability dark:text-green-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{profileMessage}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-900 focus:outline-none focus:border-sustainability text-text"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Campus / Hostel Residence
                </label>
                <input
                  type="text"
                  value={profileForm.campus}
                  onChange={(e) => setProfileForm({ ...profileForm, campus: e.target.value })}
                  placeholder="e.g. Satpura Hostel / North Campus"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-900 focus:outline-none focus:border-sustainability text-text"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Avatar Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={profileForm.avatar}
                  onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-900 focus:outline-none focus:border-sustainability text-text"
                />
                {profileForm.avatar && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={profileForm.avatar}
                      alt="Avatar preview"
                      className="size-8 rounded-full object-cover border border-stone-300 dark:border-stone-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span className="text-[10px] text-stone-500">Avatar preview</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Campus Email</span>
                  <span className="font-semibold text-text">{user?.email}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Role</span>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-sustainability text-white text-[10px] font-bold uppercase">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full py-2.5 rounded-xl bg-sustainability hover:bg-[#15361e] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              {isSavingProfile && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        )}

        {/* TAB 2: SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordMessage && (
              <div className="p-3 rounded-2xl bg-sustainability/10 border border-sustainability/20 text-sustainability dark:text-green-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{passwordMessage}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    placeholder="Enter existing password"
                    className="w-full px-3 py-2 pr-10 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-900 focus:outline-none focus:border-sustainability text-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  >
                    {showCurrentPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    placeholder="Min 8 characters (at least 1 letter and 1 number)"
                    className="w-full px-3 py-2 pr-10 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-900 focus:outline-none focus:border-sustainability text-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  placeholder="Re-type new password"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-900 focus:outline-none focus:border-sustainability text-text"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingPassword}
              className="w-full py-2.5 rounded-xl bg-sustainability hover:bg-[#15361e] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              {isSavingPassword && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isSavingPassword ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        )}

        {/* TAB 3: PREFERENCES & PRIVACY */}
        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 space-y-3">
              <span className="text-xs font-bold text-text block">Visual Appearance</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleTheme(false)}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    !isDarkTheme
                      ? 'border-sustainability bg-sustainability/10 text-sustainability dark:text-green-400'
                      : 'border-stone-200 dark:border-stone-700 text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Sun className="size-4" />
                  <span>Light Theme</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleTheme(true)}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    isDarkTheme
                      ? 'border-sustainability bg-sustainability/10 text-sustainability dark:text-green-400'
                      : 'border-stone-200 dark:border-stone-700 text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Moon className="size-4" />
                  <span>Dark Theme</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 space-y-2">
              <span className="text-xs font-bold text-text block">Data Privacy & Rights</span>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                ThriftSync complies with the Digital Personal Data Protection Act (DPDP Act 2023). We never sell your personal information or transaction history to third parties.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a
                  href="#privacy"
                  onClick={onClose}
                  className="text-xs text-sustainability font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Privacy Policy</span>
                  <ExternalLink className="size-3" />
                </a>
                <a
                  href="#terms"
                  onClick={onClose}
                  className="text-xs text-sustainability font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Terms of Service</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountSettingsModal;
