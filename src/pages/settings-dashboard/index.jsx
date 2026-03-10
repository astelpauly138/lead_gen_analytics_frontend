import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/navigation/Sidebar';
import Header from '../../components/navigation/Header';
import { apiGet, apiPut, apiDelete } from '../../utils/api';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://lead-gen-analytics-backend.onrender.com';

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

  // Subscription
  const [subscription, setSubscription] = useState(null);

  // About
  const [about, setAbout] = useState(null);
  const [aboutEditing, setAboutEditing] = useState(false);
  const [aboutForm, setAboutForm] = useState({
    job_title: '',
    company_website: '',
    services_offering: [],
  });
  const [aboutSaving, setAboutSaving] = useState(false);
  const [aboutStatus, setAboutStatus] = useState('');
  const [newService, setNewService] = useState({ name: '', description: '' });

  // Documents
  const [documents, setDocuments] = useState([]);
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState('');
  const [docSuccess, setDocSuccess] = useState('');
  const [docDeleting, setDocDeleting] = useState(null);
  const fileInputRef = useRef(null);

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

    apiGet(`/user-subscription/${user.user_id}`)
      .then(data => setSubscription(data))
      .catch(() => {});

    apiGet(`/user-about/${user.user_id}`)
      .then(data => {
        if (data) {
          setAbout(data);
          setAboutForm({
            job_title: data.job_title || '',
            company_website: data.company_website || '',
            services_offering: data.services_offering || [],
          });
        }
      })
      .catch(() => {});

    apiGet(`/user-documents/${user.user_id}`)
      .then(data => setDocuments(data || []))
      .catch(() => {});
  }, [user?.user_id]);

  const handleAboutSave = async () => {
    setAboutSaving(true);
    setAboutStatus('');
    try {
      const saved = await apiPut(`/user-about/${user.user_id}`, aboutForm);
      setAbout(saved);
      setAboutEditing(false);
      setAboutStatus('saved');
      setTimeout(() => setAboutStatus(''), 2000);
    } catch {
      setAboutStatus('error');
    } finally {
      setAboutSaving(false);
    }
  };

  const handleAddService = () => {
    if (!newService.name.trim()) return;
    setAboutForm(prev => ({
      ...prev,
      services_offering: [...prev.services_offering, { name: newService.name.trim(), description: newService.description.trim() }],
    }));
    setNewService({ name: '', description: '' });
  };

  const handleRemoveService = (index) => {
    setAboutForm(prev => ({
      ...prev,
      services_offering: prev.services_offering.filter((_, i) => i !== index),
    }));
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocError('');
    setDocSuccess('');
    setDocUploading(true);
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/user-documents/${user.user_id}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Upload failed');
      }
      // Refresh list
      const updated = await apiGet(`/user-documents/${user.user_id}`);
      setDocuments(updated || []);
      setDocSuccess('Document uploaded successfully.');
      setTimeout(() => setDocSuccess(''), 3000);
    } catch (err) {
      setDocError(err.message || 'Upload failed. Please try again.');
    } finally {
      setDocUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDocumentDelete = async (filePath) => {
    setDocDeleting(filePath);
    setDocError('');
    try {
      await apiDelete(`/user-documents/${user.user_id}?file_path=${encodeURIComponent(filePath)}`);
      setDocuments(prev => prev.filter(d => d.path !== filePath));
    } catch (err) {
      setDocError('Failed to delete document. Please try again.');
    } finally {
      setDocDeleting(null);
    }
  };

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

          {/* Current Plan */}
          {subscription && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4 mb-6">
              <h2 className="text-lg font-semibold text-foreground">Current Plan</h2>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Plan</p>
                  <p className="text-base font-medium text-foreground">{subscription.plan_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  {subscription.status ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        subscription.status.toLowerCase() === 'active'
                          ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {subscription.status.toLowerCase() === 'active' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      )}
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                  ) : (
                    <p className="text-base font-medium text-foreground">—</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Expires On</p>
                  <p className="text-base font-medium text-foreground">
                    {subscription.expiration_date
                      ? new Date(subscription.expiration_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* About */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">About</h2>
              {!aboutEditing ? (
                <button
                  type="button"
                  onClick={() => setAboutEditing(true)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setAboutEditing(false); setAboutStatus(''); }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAboutSave}
                    disabled={aboutSaving}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {aboutSaving ? 'Saving...' : aboutStatus === 'saved' ? 'Saved!' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {aboutStatus === 'error' && (
              <p className="text-xs text-red-500 mb-3">Failed to save. Please try again.</p>
            )}

            {!aboutEditing ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Job Title</p>
                  <p className="text-sm text-foreground">{aboutForm.job_title || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Company Website</p>
                  <p className="text-sm text-foreground">{aboutForm.company_website || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Services Offering</p>
                  {aboutForm.services_offering.length === 0 ? (
                    <p className="text-sm text-foreground">—</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {aboutForm.services_offering.map((s, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/40 border border-border">
                          <p className="text-sm font-medium text-foreground">{s.name}</p>
                          {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Documents — view mode */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Company Documents</p>
                  {docError && <p className="text-xs text-red-500 mb-2">{docError}</p>}
                  {docSuccess && <p className="text-xs text-green-600 mb-2">{docSuccess}</p>}
                  {documents.length === 0 ? (
                    <p className="text-sm text-foreground">—</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {documents.map((doc) => (
                        <div key={doc.path} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/40 border border-border">
                          <div className="flex items-center gap-2 min-w-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                              {doc.size && <p className="text-xs text-muted-foreground">{formatBytes(doc.size)}</p>}
                            </div>
                          </div>
                          {doc.url && (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">
                              View
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Job Title</label>
                  <input
                    type="text"
                    value={aboutForm.job_title}
                    onChange={e => setAboutForm(prev => ({ ...prev, job_title: e.target.value }))}
                    placeholder="e.g. Sales Director"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Company Website</label>
                  <input
                    type="text"
                    value={aboutForm.company_website}
                    onChange={e => setAboutForm(prev => ({ ...prev, company_website: e.target.value }))}
                    placeholder="e.g. https://yourcompany.com"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {/* Services */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-2">Services Offering</label>
                  {aboutForm.services_offering.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2 p-3 rounded-lg bg-muted/40 border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(i)}
                        className="text-muted-foreground hover:text-red-500 transition-colors text-xs mt-0.5 shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <div className="mt-2 p-3 rounded-lg border border-dashed border-border space-y-2">
                    <input
                      type="text"
                      value={newService.name}
                      onChange={e => setNewService(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Service name"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <textarea
                      value={newService.description}
                      onChange={e => setNewService(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Short description (optional)"
                      rows={2}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddService}
                      disabled={!newService.name.trim()}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      + Add Service
                    </button>
                  </div>
                </div>
                {/* Documents — edit mode */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-2">Company Documents</label>
                  {docError && <p className="text-xs text-red-500 mb-2">{docError}</p>}
                  {docSuccess && <p className="text-xs text-green-600 mb-2">{docSuccess}</p>}
                  {documents.length > 0 && (
                    <div className="flex flex-col gap-2 mb-2">
                      {documents.map((doc) => (
                        <div key={doc.path} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/40 border border-border">
                          <div className="flex items-center gap-2 min-w-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                              {doc.size && <p className="text-xs text-muted-foreground">{formatBytes(doc.size)}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View</a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDocumentDelete(doc.path)}
                              disabled={docDeleting === doc.path}
                              className="text-muted-foreground hover:text-red-500 transition-colors text-xs disabled:opacity-40"
                            >
                              {docDeleting === doc.path ? '...' : '✕'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={docUploading}
                    className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {docUploading ? 'Uploading...' : '+ Upload Document'}
                  </button>
                  <p className="text-xs text-muted-foreground mt-1">PDF, Word, PowerPoint, TXT — max 10 MB</p>
                </div>
              </div>
            )}
          </div>

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
