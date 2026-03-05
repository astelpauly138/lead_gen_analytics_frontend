import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/navigation/Sidebar';
import Header from '../../components/navigation/Header';
import { apiGet } from '../../utils/api';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const SettingsDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Appearance — local selection before saving
  const [localTheme, setLocalTheme] = useState(theme);
  const [themeSaved, setThemeSaved] = useState(false);

  const handleThemeSelect = (t) => {
    setLocalTheme(t);
    // Apply immediately for instant preview
    document.documentElement.classList.toggle('dark', t === 'dark');
  };

  const handleThemeSave = async () => {
    await setTheme(localTheme);
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2000);
  };

  // Profile
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Password form
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [pwErrors, setPwErrors] = useState({});
  const [pwStatus, setPwStatus] = useState({ type: '', text: '' });
  const [pwSubmitting, setPwSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.user_id) return;
    apiGet(`/profile/${user.user_id}`)
      .then(data => setProfile(data))
      .catch(err => console.error('Error fetching profile', err))
      .finally(() => setProfileLoading(false));
  }, [user?.user_id]);

  const validatePasswords = () => {
    const errors = {};
    if (!passwords.current) errors.current = 'Current password is required';
    if (!passwords.next) {
      errors.next = 'New password is required';
    } else if (!strongPassword.test(passwords.next)) {
      errors.next =
        'Must be 8+ chars with uppercase, lowercase, number and special character';
    }
    if (!passwords.confirm) {
      errors.confirm = 'Please confirm your new password';
    } else if (passwords.next !== passwords.confirm) {
      errors.confirm = 'Passwords do not match';
    }
    setPwErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwStatus({ type: '', text: '' });
    if (!validatePasswords()) return;

    setPwSubmitting(true);
    try {
      // 1. Reauthenticate with current password
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwords.current,
      });
      if (loginError) {
        setPwErrors({ current: 'Current password is incorrect' });
        return;
      }

      // 2. Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.next,
      });
      if (updateError) throw updateError;

      // 3. Force logout
      await supabase.auth.signOut();
      logout();
      navigate('/authentication-login');
    } catch (err) {
      setPwStatus({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setPwSubmitting(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
    if (pwErrors[field]) setPwErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggleShow = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header />

        <main className="p-4 md:p-6 lg:p-8 max-w-lg">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Settings
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Your account information
            </p>
          </div>

          {/* Profile */}
          {profileLoading ? (
            <div className="text-muted-foreground text-sm mb-6">Loading...</div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4 mb-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">First Name</p>
                <p className="text-base font-medium text-foreground">{profile?.first_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Name</p>
                <p className="text-base font-medium text-foreground">{profile?.last_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Company Name</p>
                <p className="text-base font-medium text-foreground">{profile?.company_name || '—'}</p>
              </div>
            </div>
          )}

          {/* Appearance */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">Appearance</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Choose how the interface looks for you.
            </p>

            <p className="text-sm font-medium text-foreground mb-3">Theme Mode</p>
            <div className="flex gap-3 mb-5">
              <button
                type="button"
                onClick={() => handleThemeSelect('light')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                  localTheme === 'light'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                Light
              </button>
              <button
                type="button"
                onClick={() => handleThemeSelect('dark')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                  localTheme === 'dark'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                Dark
              </button>
            </div>

            <button
              type="button"
              onClick={handleThemeSave}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {themeSaved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>

          {/* Security */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">Security</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Change your password. You will be signed out after updating.
            </p>

            {pwStatus.text && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  pwStatus.type === 'error'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-green-100 text-green-800 border border-green-300'
                }`}
              >
                {pwStatus.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={e => handleFieldChange('current', e.target.value)}
                    placeholder="Enter current password"
                    className={`w-full px-3 py-2 pr-10 bg-background border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                      pwErrors.current ? 'border-red-500' : 'border-border'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow('current')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.current ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {pwErrors.current && (
                  <p className="mt-1 text-xs text-red-500">{pwErrors.current}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.next ? 'text' : 'password'}
                    value={passwords.next}
                    onChange={e => handleFieldChange('next', e.target.value)}
                    placeholder="Enter new password"
                    className={`w-full px-3 py-2 pr-10 bg-background border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                      pwErrors.next ? 'border-red-500' : 'border-border'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow('next')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.next ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {pwErrors.next && (
                  <p className="mt-1 text-xs text-red-500">{pwErrors.next}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={e => handleFieldChange('confirm', e.target.value)}
                    placeholder="Confirm new password"
                    className={`w-full px-3 py-2 pr-10 bg-background border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                      pwErrors.confirm ? 'border-red-500' : 'border-border'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow('confirm')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.confirm ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {pwErrors.confirm && (
                  <p className="mt-1 text-xs text-red-500">{pwErrors.confirm}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={pwSubmitting}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pwSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsDashboard;
