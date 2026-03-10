import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/navigation/Sidebar';
import Header from '../../components/navigation/Header';
import Icon from '../../components/AppIcon';
import { useAuth } from '../../context/AuthContext';

// Direct fetch wrapper for email config — does NOT trigger app logout on 401.
// (A 401 here means SMTP credentials are wrong, not that the user session expired.)
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function emailFetch(path, options = {}) {
  const token = localStorage.getItem('access_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
  return data;
}

const PROVIDER_STYLES = {
  gmail:   { bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-600',   label: 'Gmail'   },
  outlook: { bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-600',   label: 'Outlook' },
  yahoo:   { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', label: 'Yahoo'   },
  custom:  { bg: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-600',  label: 'Custom'  },
};

const ProviderBadge = ({ provider }) => {
  const s = PROVIDER_STYLES[provider] || PROVIDER_STYLES.custom;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
};

const AlertBox = ({ alert }) => {
  if (!alert) return null;
  const isSuccess = alert.type === 'success';
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${
      isSuccess
        ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
        : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    }`}>
      <Icon name={isSuccess ? 'CheckCircle2' : 'XCircle'} size={16} />
      <span>{alert.msg}</span>
    </div>
  );
};

const EmailConfiguration = () => {
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mode, setMode] = useState('loading'); // 'loading' | 'form' | 'saved'
  const [isEditing, setIsEditing] = useState(false); // true when editing existing saved data

  // Form state
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCustom, setShowCustom]     = useState(false);
  const [smtpHost, setSmtpHost]         = useState('');
  const [smtpPort, setSmtpPort]         = useState('587');

  // Domain detection
  const [detected, setDetected]             = useState(null);
  const [checkingDomain, setCheckingDomain] = useState(false);

  // Saved data from DB
  const [savedData, setSavedData]                 = useState(null);
  const [showSavedPassword, setShowSavedPassword] = useState(false);

  // UI
  const [loading, setLoading]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alert, setAlert]       = useState(null);

  // Signature
  const [signature, setSignature]           = useState('');
  const [savedSignature, setSavedSignature] = useState('');
  const [sigMode, setSigMode]               = useState('form'); // 'form' | 'saved'
  const [sigIsEditing, setSigIsEditing]     = useState(false);
  const [sigSaving, setSigSaving]           = useState(false);
  const [sigDeleting, setSigDeleting]       = useState(false);
  const [sigAlert, setSigAlert]             = useState(null);
  const editorRef                           = useRef(null);

  // Sync signature HTML into contentEditable when entering edit mode
  useEffect(() => {
    if (sigMode === 'form' && editorRef.current) {
      editorRef.current.innerHTML = signature;
    }
  }, [sigMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditorInput = () => setSignature(editorRef.current?.innerHTML || '');

  const execCmd = (cmd) => {
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(cmd, false, null);
    editorRef.current?.focus();
    handleEditorInput();
  };

  const applyFontSize = (px) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const fragment = range.extractContents();
    const span = document.createElement('span');
    span.style.fontSize = px;
    span.appendChild(fragment);
    range.insertNode(span);
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.addRange(newRange);
    handleEditorInput();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    document.execCommand('insertHTML', false, html || e.clipboardData.getData('text/plain'));
    handleEditorInput();
  };

  const [showLinkInput, setShowLinkInput]   = useState(false);
  const [linkUrl, setLinkUrl]               = useState('https://');
  const [savedRange, setSavedRange]         = useState(null);
  const [linkPopoverPos, setLinkPopoverPos] = useState({ top: 0, left: 0 });

  const openLinkInput = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      setSavedRange(sel.getRangeAt(0).cloneRange());
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setLinkPopoverPos({ top: rect.bottom + 6, left: rect.left });
    }
    setLinkUrl('https://');
    setShowLinkInput(true);
  };

  const confirmLink = () => {
    if (!linkUrl) return;
    editorRef.current?.focus();
    if (savedRange) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }
    document.execCommand('createLink', false, linkUrl);
    editorRef.current?.querySelectorAll(`a[href="${linkUrl}"]`).forEach(a => {
      a.target = '_blank'; a.rel = 'noopener noreferrer';
    });
    handleEditorInput();
    setShowLinkInput(false);
    setLinkUrl('https://');
    setSavedRange(null);
  };

  const imageInputRef = useRef(null);

  const insertImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, `<img src="${reader.result}" alt="signature image" style="max-width:100%;height:auto;" />`);
      handleEditorInput();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // On mount — check DB for existing email config and signature
  useEffect(() => {
    if (!user?.user_id) return;
    emailFetch(`/clients/by-user/${user.user_id}`)
      .then(data => { setSavedData(data); setMode('saved'); })
      .catch(() => { setMode('form'); });

    emailFetch(`/signature/${user.user_id}`)
      .then(data => {
        setSignature(data.signature_html);
        setSavedSignature(data.signature_html);
        setSigMode('saved');
      })
      .catch(() => {}); // no signature yet — stay in form
  }, [user?.user_id]);

  const handleEmailBlur = async () => {
    if (!email || !email.includes('@')) return;
    setCheckingDomain(true);
    setDetected(null);
    try {
      const data = await emailFetch('/clients/check-domain', { method: 'POST', body: JSON.stringify({ email }) });
      setDetected(data);
    } catch {
      // silently ignore — user can proceed manually
    } finally {
      setCheckingDomain(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      setAlert({ type: 'error', msg: 'Email address and password are required.' });
      return;
    }
    setLoading(true);
    setAlert(null);
    try {
      const body = { user_id: user.user_id, email, password };
      if (showCustom && smtpHost) {
        body.smtp_host = smtpHost;
        body.smtp_port = parseInt(smtpPort, 10) || 587;
      }
      await emailFetch('/clients/add', { method: 'POST', body: JSON.stringify(body) });

      // Fetch the saved config from DB to display
      const saved = await emailFetch(`/clients/by-user/${user.user_id}`);
      setSavedData(saved);
      setIsEditing(false);
      setMode('saved');
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Pre-fill form with current saved values
    setEmail(savedData?.email || '');
    setPassword(savedData?.password || '');
    setShowPassword(false);
    setDetected(null);
    setAlert(null);
    setShowCustom(false);
    setSmtpHost('');
    setSmtpPort('587');
    setIsEditing(true);
    setMode('form');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAlert(null);
    setDetected(null);
    setMode('saved');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await emailFetch(`/clients/by-user/${user.user_id}`, { method: 'DELETE' });
      setSavedData(null);
      setEmail('');
      setPassword('');
      setMode('form');
    } catch (e) {
      setAlert({ type: 'error', msg: e.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveSignature = async () => {
    setSigSaving(true);
    setSigAlert(null);
    try {
      await emailFetch('/signature/save', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.user_id, signature_html: signature }),
      });
      setSavedSignature(signature);
      setSigIsEditing(false);
      setSigMode('saved');
    } catch (e) {
      setSigAlert({ type: 'error', msg: e.message });
    } finally {
      setSigSaving(false);
    }
  };

  const handleSigEdit = () => {
    setSigIsEditing(true);
    setSigMode('form');
    setSigAlert(null);
  };

  const handleSigCancel = () => {
    setSignature(savedSignature);
    setSigIsEditing(false);
    setSigMode('saved');
    setSigAlert(null);
  };

  const handleSigDelete = async () => {
    setSigDeleting(true);
    try {
      await emailFetch(`/signature/${user.user_id}`, { method: 'DELETE' });
      setSavedSignature('');
      setSignature('');
      setSigIsEditing(false);
      setSigMode('form');
    } catch (e) {
      setSigAlert({ type: 'error', msg: e.message });
    } finally {
      setSigDeleting(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────
  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header />
          <main className="p-4 md:p-6 lg:p-8 max-w-3xl">
            <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-72 bg-muted rounded animate-pulse mb-8" />
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              {[80, 60, 70, 50].map((w, i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header />

        <main className="p-4 md:p-6 lg:p-8 max-w-3xl">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Email Configuration
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Connect your email account for sending outbound emails.
            </p>
          </div>

          {/* ── SAVED VIEW ─────────────────────────────── */}
          {mode === 'saved' && savedData && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Icon name="CheckCircle2" size={16} className="text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-green-600">Verified & Saved</span>
                </div>
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
                >
                  <Icon name="Edit2" size={14} />
                  Edit
                </button>
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email Address</p>
                  <p className="text-sm font-medium text-foreground">{savedData.email}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">App Password / SMTP Password</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground tracking-widest">
                      {showSavedPassword ? savedData.password : '••••••••••••'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowSavedPassword(p => !p)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Icon name={showSavedPassword ? 'EyeOff' : 'Eye'} size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Provider</p>
                  <ProviderBadge provider={savedData.provider} />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">SMTP Host</p>
                  <p className="text-sm font-medium text-foreground">{savedData.smtp_host}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">SMTP Port</p>
                  <p className="text-sm font-medium text-foreground">{savedData.smtp_port}</p>
                </div>
              </div>

              <div className="border-t border-border mt-6 pt-4">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <Icon name="Loader2" size={14} className="animate-spin" />
                  ) : (
                    <Icon name="Trash2" size={14} />
                  )}
                  {deleting ? 'Deleting...' : 'Delete Configuration'}
                </button>
              </div>
            </div>
          )}

          {/* ── FORM VIEW ──────────────────────────────── */}
          {mode === 'form' && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                  <Icon name="Mail" size={20} color="var(--color-primary)" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Add Client Email</h2>
              </div>

              <AlertBox alert={alert} />

              {/* Detected provider banner */}
              {detected && (
                <div className="flex flex-col gap-1 bg-muted rounded-lg px-4 py-3 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">Detected provider:</span>
                    <ProviderBadge provider={detected.detected_provider} />
                  </div>
                  <span className="text-muted-foreground text-xs">
                    SMTP: <strong className="text-foreground">{detected.smtp_host}:{detected.smtp_port}</strong>
                  </span>
                  {detected.hint && (
                    <span className="text-xs text-muted-foreground">{detected.hint}</span>
                  )}
                </div>
              )}

              {/* Email Address */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setDetected(null); }}
                    onBlur={handleEmailBlur}
                    placeholder="you@company.com"
                    autoComplete="off"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {checkingDomain && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Icon name="Loader2" size={14} className="animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              {/* App Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  App Password / SMTP Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter app password"
                    autoComplete="new-password"
                    className="w-full px-3 py-2 pr-10 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
                  </button>
                </div>
              </div>

              {/* Custom SMTP toggle */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => setShowCustom(p => !p)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                >
                  <Icon name={showCustom ? 'ChevronUp' : 'ChevronDown'} size={14} />
                  Custom SMTP (only for private mail servers)
                </button>

                {showCustom && (
                  <div className="mt-4 flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={e => setSmtpHost(e.target.value)}
                        placeholder="mail.yourcompany.com"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        SMTP Port
                      </label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={e => setSmtpPort(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit row */}
              <div className={`flex gap-3 ${isEditing ? 'flex-row' : ''}`}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Icon name="Loader2" size={16} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Icon name="ShieldCheck" size={16} />
                      Add & Verify Credentials
                    </>
                  )}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="py-2.5 px-4 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
          {/* ── SIGNATURE SECTION ─────────────────────── */}
          {mode !== 'loading' && (
            <div className="bg-card border border-border rounded-lg p-6 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                  <Icon name="PenLine" size={20} color="var(--color-primary)" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Email Signature</h2>
                  <p className="text-xs text-muted-foreground">Appended automatically to every outgoing email.</p>
                </div>
              </div>

              {/* Signature alert */}
              {sigAlert && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${
                  sigAlert.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                    : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                }`}>
                  <Icon name={sigAlert.type === 'success' ? 'CheckCircle2' : 'XCircle'} size={16} />
                  <span>{sigAlert.msg}</span>
                </div>
              )}

              {/* ── Saved signature view ── */}
              {sigMode === 'saved' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Icon name="CheckCircle2" size={16} className="text-green-600" />
                      </div>
                      <span className="text-sm font-semibold text-green-600">Saved</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSigEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
                    >
                      <Icon name="Edit2" size={14} />
                      Edit
                    </button>
                  </div>

                  <div className="border border-border rounded-lg p-4 bg-white mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Signature Preview</p>
                    <div
                      style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', lineHeight: '1.4' }}
                      dangerouslySetInnerHTML={{ __html: savedSignature }}
                    />
                  </div>

                  <div className="border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={handleSigDelete}
                      disabled={sigDeleting}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sigDeleting ? (
                        <Icon name="Loader2" size={14} className="animate-spin" />
                      ) : (
                        <Icon name="Trash2" size={14} />
                      )}
                      {sigDeleting ? 'Deleting...' : 'Delete Signature'}
                    </button>
                  </div>
                </>
              )}

              {/* ── Editor form view ── */}
              {sigMode === 'form' && (
                <>
                  <div className="mb-4 rounded-lg border border-border overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 flex-wrap px-2 py-1.5 bg-muted border-b border-border">
                      <select
                        defaultValue=""
                        onChange={e => { if (e.target.value) { applyFontSize(e.target.value); e.target.value = ''; } }}
                        className="text-xs border border-border rounded px-1 py-0.5 bg-background text-foreground cursor-pointer"
                      >
                        <option value="" disabled>Size</option>
                        {['10px','11px','12px','13px','14px','16px','18px','20px','24px','28px','32px'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <div className="w-px h-4 bg-border mx-0.5" />
                      <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('bold'); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-background font-bold text-sm text-foreground" title="Bold">B</button>
                      <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('italic'); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-background italic text-sm text-foreground" title="Italic">I</button>
                      <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('underline'); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-background underline text-sm text-foreground" title="Underline">U</button>
                      <div className="w-px h-4 bg-border mx-0.5" />
                      <button type="button" onMouseDown={e => { e.preventDefault(); openLinkInput(); }} className={`w-7 h-7 flex items-center justify-center rounded hover:bg-background text-foreground ${showLinkInput ? 'bg-background ring-1 ring-primary' : ''}`} title="Insert Link">
                        <Icon name="Link" size={14} />
                      </button>
                      <button type="button" onMouseDown={e => { e.preventDefault(); imageInputRef.current?.click(); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-background text-foreground" title="Upload Image">
                        <Icon name="Image" size={14} />
                      </button>
                      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={insertImage} />
                    </div>
                    {/* Editable area */}
                    <style>{`
                      .sig-editor a { color: #1155CC; text-decoration: underline; cursor: pointer; }
                      .sig-editor a:hover { color: #0b3fa0; }
                    `}</style>
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={handleEditorInput}
                      onPaste={handlePaste}
                      className="sig-editor min-h-[160px] p-3 bg-background text-foreground focus:outline-none overflow-auto"
                      style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', lineHeight: '1.4' }}
                    />
                  </div>

                  {/* Floating link popover — positioned below the selected text */}
                  {showLinkInput && (
                    <div
                      style={{ position: 'fixed', top: linkPopoverPos.top, left: linkPopoverPos.left, zIndex: 1000 }}
                      className="flex items-center gap-1.5 p-2 bg-background border border-border rounded-lg shadow-lg"
                    >
                      <Icon name="Link" size={13} className="text-muted-foreground shrink-0" />
                      <input
                        autoFocus
                        type="url"
                        value={linkUrl}
                        onChange={e => setLinkUrl(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') confirmLink();
                          if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl('https://'); }
                        }}
                        placeholder="Paste or type a link"
                        className="w-52 text-xs px-2 py-1 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button type="button" onClick={confirmLink} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded font-medium hover:opacity-90">Apply</button>
                      <button type="button" onClick={() => { setShowLinkInput(false); setLinkUrl('https://'); }} className="text-muted-foreground hover:text-foreground">
                        <Icon name="X" size={13} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSaveSignature}
                      disabled={sigSaving}
                      className="flex items-center gap-2 py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sigSaving ? (
                        <Icon name="Loader2" size={15} className="animate-spin" />
                      ) : (
                        <Icon name="Save" size={15} />
                      )}
                      {sigSaving ? 'Saving...' : 'Save Signature'}
                    </button>

                    {sigIsEditing && (
                      <button
                        type="button"
                        onClick={handleSigCancel}
                        disabled={sigSaving}
                        className="py-2 px-4 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EmailConfiguration;
