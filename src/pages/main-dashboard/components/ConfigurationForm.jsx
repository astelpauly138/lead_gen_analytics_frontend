import { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { apiPost, apiGet } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';

const ConfigurationForm = ({ onSubmit, dashboardData = {} }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    area: '',
    city: '',
    location: '',
    jobTitles: '',
    no_of_targets: '100'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blacklistedDomains, setBlacklistedDomains] = useState([]);
  const [domainInput, setDomainInput] = useState('');
  const [domainInputError, setDomainInputError] = useState('');
  const [pendingLeads, setPendingLeads] = useState([]);
  const [sentLeads, setSentLeads] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isApprovingSubmission, setIsApprovingSubmission] = useState(false);
  const [activeView, setActiveView] = useState('pending');
  const [currentCampaignId, setCurrentCampaignId] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [showList, setShowList] = useState(false);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ subject: '', content: '' });
  const [emailErrors, setEmailErrors] = useState({});
  const [modifyWithAI, setModifyWithAI] = useState(false);
  const [canModifyWithAI, setCanModifyWithAI] = useState(null); // null=loading, 0=no, 1=yes
  const [savedEmailContents, setSavedEmailContents] = useState([]);
  const [selectedSavedContentId, setSelectedSavedContentId] = useState(null);
  const [isContentEdited, setIsContentEdited] = useState(false);
  const originalSavedContent = useRef(null); // { subject, content }
  const [previewSignature, setPreviewSignature] = useState('');
  const contentEditorRef = useRef(null);
  const contentImageInputRef = useRef(null);
  const contentPdfInputRef = useRef(null);
  const [showContentLinkInput, setShowContentLinkInput] = useState(false);
  const [contentLinkUrl, setContentLinkUrl] = useState('https://');
  const [contentSavedRange, setContentSavedRange] = useState(null);
  const [contentLinkPopoverPos, setContentLinkPopoverPos] = useState({ top: 0, left: 0 });

  // Error popup state
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  // Load persisted leads on mount — populate counts on toggle buttons,
  // but keep the form visible until the user clicks a toggle
  useEffect(() => {
    if (!user?.user_id) return;
    apiGet(`/leads/${user.user_id}`)
      .then(data => {
        const pending = data?.pending_leads || [];
        const approved = data?.approved_leads || [];
        setPendingLeads(pending);
        setSentLeads(approved);
        // Use the most recent lead's campaign_id as the active campaign
        const recentLead = pending[0] || approved[0];
        if (recentLead?.campaign_id) setCurrentCampaignId(recentLead.campaign_id);
      })
      .catch(err => console.error('Failed to load leads:', err));

    apiGet(`/signature/${user.user_id}`)
      .then(data => setPreviewSignature(data?.signature_html || ''))
      .catch(() => {});

    apiGet(`/modify-content-check/${user.user_id}`)
      .then(data => setCanModifyWithAI(data?.result ?? 0))
      .catch(() => setCanModifyWithAI(0));
  }, [user?.user_id]);

  const industryOptions = [
    { value: 'technology', label: 'Technology & Software' },
    { value: 'healthcare', label: 'Healthcare & Medical' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'manufacturing', label: 'Manufacturing & Industrial' },
    { value: 'education', label: 'Education & Training' },
    { value: 'realestate', label: 'Real Estate & Construction' },
    { value: 'marketing', label: 'Marketing & Advertising' }
  ];

  const locationOptions = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'canada', label: 'Canada' },
    { value: 'australia', label: 'Australia' },
    { value: 'germany', label: 'Germany' },
    { value: 'india', label: 'India' },
    { value: 'singapore', label: 'Singapore' },
    { value: 'uae', label: 'United Arab Emirates' }
  ];

  

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.name?.trim()) {
      newErrors.name = 'Please enter a campaign name';
    }

    if (!formData?.industry) {
      newErrors.industry = 'Please select an industry';
    }

    if (!formData?.location) {
      newErrors.location = 'Please select a location';
    }

    if (!formData?.jobTitles?.trim()) {
      newErrors.jobTitles = 'Please enter at least one job title';
    }

    const noOfTargets = parseInt(formData?.no_of_targets);
    if (!noOfTargets || noOfTargets < 1 || noOfTargets > 1000) {
      newErrors.no_of_targets = 'Number of targets must be between 1 and 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      // 1. Resolve labels for the backend
      const industryLabel = industryOptions.find(o => o.value === formData.industry)?.label || formData.industry;
      const countryLabel = locationOptions.find(o => o.value === formData.location)?.label || formData.location;
      const jobTitlesArray = formData.jobTitles.split(',').map(t => t.trim()).filter(Boolean);

      // Split job titles into Apollo seniority keys vs. actual titles
      const APOLLO_SENIORITY_KEYS = new Set([
        'owner', 'founder', 'c_suite', 'vp', 'director',
        'manager', 'head', 'senior', 'entry', 'intern'
      ]);
      const personSeniorities = jobTitlesArray.filter(t => APOLLO_SENIORITY_KEYS.has(t.toLowerCase()));
      const personTitles = jobTitlesArray.filter(t => !APOLLO_SENIORITY_KEYS.has(t.toLowerCase()));

      // 2. Create campaign in database
      const campaignPayload = {
        name: formData.name,
        campaign_type: 'lead_generation',
        industry: industryLabel,
        area: formData.area || '',
        city: formData.city || '',
        state: '',
        country: countryLabel,
        job_titles: jobTitlesArray,
        requested_leads: parseInt(formData.no_of_targets) || 100,
        status: 'pending',
        black_listed_domains: blacklistedDomains,
      };

      const campaignResult = await apiPost(`/campaigns/${user.user_id}`, campaignPayload);
      console.log('Campaign created:', campaignResult);

      setShowForm(false);

      const campaignId = campaignResult?.campaign?.id;
      setCurrentCampaignId(campaignId);

      if (typeof onSubmit === 'function') {
        onSubmit(formData, campaignResult);
      }

      // 3. Start n8n scraping
      const n8nPayload = {
        ...formData,
        campaign_id: campaignId,
        user_id: user.user_id,
        blacklisted_domains: blacklistedDomains,
        person_seniorities: personSeniorities,
        person_titles: personTitles,
      };

      const resp = await fetch('https://n8n.analytica-data.com/webhook-test/form-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload)
      });

      let result = null;
      try { result = await resp.json(); } catch (_) { result = null; }

      if (!resp.ok) {
        console.error('Webhook responded with error', resp.status, result);
        setShowForm(true);
        setShowErrorPopup(true);
      } else {
        // 4. Map n8n employees to Lead format for /lead-scraping
        const employees = Array.isArray(result) ? result : (result?.employees || []);
        if (employees.length === 0) {
          setShowForm(true);
          setShowErrorPopup(true);
        } else if (employees.length > 0) {
          // n8n wraps each item under a `json` key
          const leads = employees.map(item => {
            const emp = item.json || item;
            return {
              Employee_Name: emp['Employee Name'] || emp.Employee_Name || emp.employee_name || '',
              Work_Email: emp['Work Email'] || emp.Work_Email || emp.work_email || null,
              Company: emp.Company || emp.company_name || emp.company || '',
              Work_Mobile_No: emp['Work Mobile No.'] || emp.Work_Mobile_No || emp.work_mobile_no || emp.phone || null,
              Category: emp.Category || emp.category || null,
              Position: emp.Position || emp.position || null,
              Email_Status: emp['Email Status'] || emp.Email_Status || emp.email_status || null,
              Website: emp.Website || emp.website || null,
              Domain: emp.Domain || emp.domain || null,
              Location: emp.Location || emp.location || null,
              Address: emp.Address || emp.address || null,
              Promotion_Status: emp['Promotion Status'] || emp.Promotion_Status || emp.promotion_status || null,
            };
          });

          // 5. Insert leads via /lead-scraping endpoint
          const leadResult = await apiPost('/lead-scraping', {
            user_id: user.user_id,
            campaign_id: campaignId,
            leads
          });
          console.log('Leads inserted:', leadResult);

          // 6. Show inserted leads in pending list
          setPendingLeads(leadResult?.inserted_leads || []);
          setSelectedEmployees([]);
          setActiveView('pending');
          setShowForm(false);
          setShowList(true);
        }
      }
    } catch (err) {
      console.error('Failed during campaign creation or scraping', err);
      setShowForm(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateEmailModal = () => {
    const errs = {};
    if (!emailData.subject.trim()) errs.subject = 'Please enter an email subject';
    const plainText = contentEditorRef.current?.innerText?.trim() || '';
    if (!plainText) errs.content = 'Please enter the email content';
    setEmailErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Called after the user fills email details and confirms — saves email content then approves leads
  const handleEmailModalConfirm = async () => {
    if (!selectedSavedContentId && !validateEmailModal()) return;
    setShowEmailModal(false);
    setIsApprovingSubmission(true);

    try {
      const selectedLeadObjects = selectedEmployees
        .map(idx => pendingLeads[idx])
        .filter(Boolean);

      const campaignId = currentCampaignId || selectedLeadObjects[0]?.campaign_id;

      // 1. Reuse saved id only if user selected one AND did not edit it
      let emailContentId = (selectedSavedContentId && !isContentEdited) ? selectedSavedContentId : null;
      if (!emailContentId) {
        const emailContentResult = await apiPost(`/email_contents/${user.user_id}?campaign_id=${campaignId}`, {
          subject: emailData.subject,
          body: emailData.content,
          modify_with_ai: modifyWithAI,
        });
        emailContentId = emailContentResult?.email_content?.id;
      }

      // 2. Approve selected leads
      const approvalPayload = {
        user_id: user.user_id,
        campaign_id: campaignId,
        type: 'sent',
        email_content_id: emailContentId,
        leads: selectedLeadObjects.map(lead => ({
          lead_id: lead.id,
          approved: true
        }))
      };

      const approveResult = await apiPost('/leads-approved', approvalPayload);
      console.log('Leads approved:', approveResult);

      const approvedIds = new Set(
        (approveResult?.updated_leads || []).map(l => l.lead_id)
      );

      const remainingPending = pendingLeads.filter(l => !approvedIds.has(l.id));
      const approvedLeadObjects = pendingLeads.filter(l => approvedIds.has(l.id));
      const newSent = [...sentLeads, ...approvedLeadObjects];

      setPendingLeads(remainingPending);
      setSentLeads(newSent);
      setSelectedEmployees([]);
      setActiveView('sent');
      setShowList(true);

      // 7. Refresh dashboard
      if (typeof onSubmit === 'function') {
        onSubmit(formData, approveResult);
      }
    } catch (err) {
      console.error('Failed to approve submission', err);
    } finally {
      setIsApprovingSubmission(false);
    }
  };

  const handleEmployeeSelect = (employeeIndex) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeIndex)) {
        return prev.filter(idx => idx !== employeeIndex);
      } else {
        return [...prev, employeeIndex];
      }
    });
  };

  const handleApproveSubmission = async () => {
    if (selectedEmployees.length === 0) return;
    const selectedLeadObjects = selectedEmployees.map(idx => pendingLeads[idx]).filter(Boolean);
    const campaignId = currentCampaignId || selectedLeadObjects[0]?.campaign_id;
    setEmailData({ subject: '', content: '' });
    setEmailErrors({});
    setSelectedSavedContentId(null);
    setIsContentEdited(false);
    setSavedEmailContents([]);
    setModifyWithAI(false);

    // Re-check if user can modify with AI (they may have updated About info)
    if (user?.user_id) {
      try {
        const checkRes = await apiGet(`/modify-content-check/${user.user_id}`);
        setCanModifyWithAI(checkRes?.result ?? 0);
      } catch (_) {
        setCanModifyWithAI(0);
      }
    }

    setShowEmailModal(true);
    if (campaignId && user?.user_id) {
      try {
        const res = await apiGet(`/saved_email_contents/${user.user_id}?campaign_id=${campaignId}`);
        setSavedEmailContents(res?.email_contents || []);
      } catch (_) {}
    }
  };

  // Sync HTML from editor div into state
  const syncContent = () => {
    const html = contentEditorRef.current?.innerHTML || '';
    setEmailData(prev => {
      if (selectedSavedContentId && originalSavedContent.current) {
        setIsContentEdited(html !== originalSavedContent.current.content || prev.subject !== originalSavedContent.current.subject);
      }
      return { ...prev, content: html };
    });
    if (emailErrors.content) setEmailErrors(prev => ({ ...prev, content: '' }));
  };

  const execContentCmd = (cmd) => {
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(cmd, false, null);
    contentEditorRef.current?.focus();
    syncContent();
  };

  const applyContentFontSize = (px) => {
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
    syncContent();
  };

  const handleContentPaste = (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    document.execCommand('insertHTML', false, html || e.clipboardData.getData('text/plain'));
    syncContent();
  };

  const insertContentImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      contentEditorRef.current?.focus();
      document.execCommand('insertHTML', false, `<img src="${reader.result}" alt="image" style="max-width:100%;height:auto;" />`);
      syncContent();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const insertContentPdf = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      contentEditorRef.current?.focus();
      document.execCommand('insertHTML', false, `<a href="${reader.result}" download="${file.name}" style="color:#1155CC;text-decoration:underline;">📄 ${file.name}</a>`);
      syncContent();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openContentLinkInput = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      setContentSavedRange(sel.getRangeAt(0).cloneRange());
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setContentLinkPopoverPos({ top: rect.bottom + 6, left: rect.left });
    }
    setContentLinkUrl('https://');
    setShowContentLinkInput(true);
  };

  const confirmContentLink = () => {
    if (!contentLinkUrl) return;
    contentEditorRef.current?.focus();
    if (contentSavedRange) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(contentSavedRange);
    }
    document.execCommand('createLink', false, contentLinkUrl);
    contentEditorRef.current?.querySelectorAll(`a[href="${contentLinkUrl}"]`).forEach(a => {
      a.target = '_blank'; a.rel = 'noopener noreferrer';
    });
    syncContent();
    setShowContentLinkInput(false);
    setContentLinkUrl('https://');
    setContentSavedRange(null);
  };

  const insertParameter = (param) => {
    const el = contentEditorRef.current;
    if (!el) return;
    el.focus();
    // Trailing span with color:inherit breaks out of the blue span's inherited styling
    document.execCommand('insertHTML', false,
      `<span style="background:#f0f4ff;color:#1155CC;border-radius:3px;padding:0 3px;">${param}</span><span style="color:inherit;background:none;">\u200B</span>`
    );
    syncContent();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const hasLeads = pendingLeads.length > 0 || sentLeads.length > 0;

  // Handle toggle button clicks - always show list when clicked
  const handleToggleClick = (view) => {
    setActiveView(view);
    if (hasLeads) {
      setShowList(true);
      setShowForm(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm flex flex-col">
      {/* Header row: state-dependent title + toggle buttons */}
      <div className="flex items-start justify-between mb-6">
        {/* Left: dynamic header based on state */}
        {showForm && !isSubmitting && (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg">
              <Icon name="Settings" size={20} color="var(--color-primary)" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg md:text-xl font-semibold text-foreground">Lead Scraping Configuration</h2>
              <p className="caption text-muted-foreground text-xs md:text-sm">Configure your lead generation parameters</p>
            </div>
          </div>
        )}
        {hasLeads && showList && !isSubmitting && (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-success/20 rounded-lg">
              <Icon name="CheckCircle2" size={20} color="var(--color-success)" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-foreground">
                {activeView === 'pending' ? 'Email Pending for Approval' : 'Emails Sent'}
              </h2>
              <p className="caption text-muted-foreground text-xs md:text-sm">
                {activeView === 'pending'
                  ? 'Select leads to approve for email sending'
                  : 'View all emails that have been sent'}
              </p>
            </div>
          </div>
        )}
        {isSubmitting && <div />}

        {/* Right: Toggle Buttons - always visible */}
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg shrink-0">
          <button
            onClick={() => handleToggleClick('pending')}
            disabled={!hasLeads}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'pending' && showList
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            } ${!hasLeads ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Pending ({pendingLeads.length})
          </button>
          <button
            onClick={() => handleToggleClick('sent')}
            disabled={!hasLeads}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'sent' && showList
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            } ${!hasLeads ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Sent ({sentLeads.length})
          </button>
        </div>
      </div>

      {/* Processing State */}
      {isSubmitting && (
        <div className="flex flex-col items-center justify-center py-12 flex-1">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-primary/10 rounded-full animate-spin" style={{
              borderTop: '3px solid var(--color-primary)',
              borderRight: 'transparent',
              borderBottom: 'transparent',
              borderLeft: 'transparent'
            }}></div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Scraping Leads...</h3>
          <p className="text-sm text-muted-foreground mb-2">This may take a few moments</p>
          <p className="caption text-xs text-muted-foreground">Processing: {formData?.no_of_targets} target leads</p>
        </div>
      )}

      {/* Results State - Only show when list is requested */}
      {hasLeads && showList && !isSubmitting && (
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="caption text-muted-foreground text-xs mb-2">Pending for Approval</p>
              <p className="text-3xl font-bold text-primary">
                {pendingLeads.length}
              </p>
            </div>
            <div className="col-span-1 bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 rounded-lg p-4">
              <p className="caption text-muted-foreground text-xs mb-2">Selected for Approval</p>
              <p className="text-3xl font-bold text-warning">
                {selectedEmployees.length}
              </p>
            </div>
          </div>

          {/* Lead List - Toggle between Pending and Sent */}
          <div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="overflow-y-auto" style={{ maxHeight: '380px', scrollbarWidth: 'thin', scrollbarColor: 'var(--color-border) transparent' }}>
                <table className="w-full">
                  <thead className="bg-muted border-b border-border sticky top-0 z-10">
                    <tr>
                      {activeView === 'pending' && (
                        <th className="px-3 py-2 text-left">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.length === pendingLeads.length && pendingLeads.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmployees(pendingLeads.map((_, idx) => idx));
                              } else {
                                setSelectedEmployees([]);
                              }
                            }}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                            aria-label="Select all"
                          />
                        </th>
                      )}
                      <th className="px-3 py-2 text-left text-xs text-muted-foreground">Name</th>
                      <th className="px-3 py-2 text-left text-xs text-muted-foreground">Position</th>
                      <th className="px-3 py-2 text-left text-xs text-muted-foreground">Email</th>
                      <th className="px-3 py-2 text-left text-xs text-muted-foreground">Company</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeView === 'pending' ? (
                      <>
                        {pendingLeads.map((lead, idx) => (
                          <tr key={lead.id || idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={selectedEmployees.includes(idx)}
                                onChange={() => handleEmployeeSelect(idx)}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                                aria-label={`Select ${lead?.name}`}
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-foreground truncate">{lead?.name || '-'}</td>
                            <td className="px-3 py-2 text-sm text-muted-foreground truncate">{lead?.position || '-'}</td>
                            <td className="px-3 py-2 text-sm text-foreground truncate">{lead?.email || '-'}</td>
                            <td className="px-3 py-2 text-sm text-foreground truncate">{lead?.company || '-'}</td>
                          </tr>
                        ))}
                        {pendingLeads.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-sm text-muted-foreground text-center">No pending leads</td>
                          </tr>
                        )}
                      </>
                    ) : (
                      <>
                        {sentLeads.map((lead, idx) => (
                          <tr key={lead.id || idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                            <td className="px-3 py-2 text-sm text-foreground truncate">{lead?.name || '-'}</td>
                            <td className="px-3 py-2 text-sm text-muted-foreground truncate">{lead?.position || '-'}</td>
                            <td className="px-3 py-2 text-sm text-foreground truncate">{lead?.email || '-'}</td>
                            <td className="px-3 py-2 text-sm text-foreground truncate">{lead?.company || '-'}</td>
                          </tr>
                        ))}
                        {sentLeads.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-4 text-sm text-muted-foreground text-center">No emails sent yet</td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {activeView === 'pending' && (
              <Button
                type="button"
                variant="default"
                loading={isApprovingSubmission}
                iconName="CheckCircle2"
                iconPosition="left"
                onClick={handleApproveSubmission}
                disabled={selectedEmployees.length === 0}
                fullWidth
              >
                {isApprovingSubmission ? 'Approving...' : `Approve Selected (${selectedEmployees.length})`}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              iconName="RotateCcw"
              iconPosition="left"
              onClick={() => {
                setShowForm(true);
                setShowList(false);
                setSelectedEmployees([]);
                setActiveView('pending');
              }}
              className="sm:w-auto"
            >
              New Scraping
            </Button>
          </div>
        </div>
      )}

      {/* Form State - Show when showForm is true and not submitting */}
      {showForm && !isSubmitting && (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Campaign Name"
              type="text"
              placeholder="e.g., Education Outreach"
              value={formData?.name}
              onChange={(e) => handleInputChange('name', e?.target?.value)}
              error={errors?.name}
              required
            />

            <Select
              label="Target Industry"
              options={industryOptions}
              value={formData?.industry}
              onChange={(value) => handleInputChange('industry', value)}
              error={errors?.industry}
              required
              searchable
              placeholder="Choose an industry"
            />

            <Input
              label="Area"
              type="text"
              placeholder="Area (e.g., California, West Midlands)"
              value={formData?.area}
              onChange={(e) => handleInputChange('area', e?.target?.value)}
              error={errors?.area}
            />

            <Input
              label="City"
              type="text"
              placeholder="City (e.g., San Francisco)"
              value={formData?.city}
              onChange={(e) => handleInputChange('city', e?.target?.value)}
              error={errors?.city}
            />

            <Select
              label="Country"
              options={locationOptions}
              value={formData?.location}
              onChange={(value) => handleInputChange('location', value)}
              error={errors?.location}
              required
              searchable
              placeholder="Choose a location"
            />

            <Input
              label="Target Job Titles"
              type="text"
              placeholder="CEO, CTO, VP Sales, Marketing Director"
              value={formData?.jobTitles}
              onChange={(e) => handleInputChange('jobTitles', e?.target?.value)}
              error={errors?.jobTitles}
              required
            />

            <Input
              label="Number of Leads to Scrape"
              type="number"
              placeholder="100"
              value={formData?.no_of_targets}
              onChange={(e) => handleInputChange('no_of_targets', e?.target?.value)}
              error={errors?.no_of_targets}
              required
              min="1"
              max="1000"
            />

            {/* Domain Blacklist */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Blacklisted Domains</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. example.com"
                  value={domainInput}
                  onChange={(e) => { setDomainInput(e.target.value); if (domainInputError) setDomainInputError(''); }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && domainInput.trim()) {
                      e.preventDefault();
                      const domain = domainInput.trim().replace(/,+$/, '').toLowerCase();
                      const isValid = /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domain);
                      if (!isValid) {
                        setDomainInputError('Invalid format. Use something like: example.com');
                      } else if (blacklistedDomains.includes(domain)) {
                        setDomainInputError('Domain already added.');
                      } else {
                        setBlacklistedDomains(prev => [...prev, domain]);
                        setDomainInput('');
                        setDomainInputError('');
                      }
                    }
                  }}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${domainInputError ? 'border-red-500' : 'border-border'}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const domain = domainInput.trim().replace(/,+$/, '').toLowerCase();
                    const isValid = /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domain);
                    if (!domain) return;
                    if (!isValid) {
                      setDomainInputError('Invalid format. Use something like: example.com');
                    } else if (blacklistedDomains.includes(domain)) {
                      setDomainInputError('Domain already added.');
                    } else {
                      setBlacklistedDomains(prev => [...prev, domain]);
                      setDomainInput('');
                      setDomainInputError('');
                    }
                  }}
                  className="px-3 py-2 text-sm font-medium rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
                >
                  Add
                </button>
              </div>
              {domainInputError
                ? <p className="text-xs text-red-500">{domainInputError}</p>
                : <p className="text-xs text-muted-foreground">Press Enter or comma to add a domain</p>
              }
              {blacklistedDomains.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {blacklistedDomains.map((domain) => (
                    <span
                      key={domain}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/30"
                    >
                      {domain}
                      <button
                        type="button"
                        onClick={() => setBlacklistedDomains(prev => prev.filter(d => d !== domain))}
                        className="ml-0.5 hover:text-red-400 transition-colors"
                        aria-label={`Remove ${domain}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              variant="default"
              loading={isSubmitting}
              iconName="Play"
              iconPosition="left"
              className="w-full sm:flex-1"
            >
              {isSubmitting ? 'Starting Scraping...' : 'Start Lead Scraping'}
            </Button>

            <Button
              type="button"
              variant="outline"
              iconName="RotateCcw"
              iconPosition="left"
              onClick={() => {
                setFormData({
                  name: '',
                  industry: '',
                  area: '',
                  city: '',
                  location: '',
                  jobTitles: '',
                  no_of_targets: '100'
                });
                setErrors({});
                setBlacklistedDomains([]);
                setDomainInput('');
                setDomainInputError('');
              }}
              className="w-full sm:w-auto"
            >
              Reset
            </Button>
          </div>
        </form>
</>
      )}

      {/* No Leads Error Popup */}
      {showErrorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="flex items-center justify-center w-14 h-14 bg-error/10 rounded-full mx-auto mb-4">
              <Icon name="AlertCircle" size={28} color="var(--color-error)" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Leads Found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              No leads were returned for your search criteria. Please try again with different parameters.
            </p>
            <button
              type="button"
              onClick={() => setShowErrorPopup(false)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Email Details Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 pb-4 border-b border-border shrink-0">
              <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg shrink-0">
                <Icon name="Mail" size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Email Details</h3>
                <p className="text-xs text-muted-foreground">Fill in the details and preview before approving</p>
              </div>
            </div>

            {/* Two-column body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left — form */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 border-r border-border">

                {/* Previously saved email contents */}
                {savedEmailContents.length > 0 && (
                  <div className="p-3 bg-muted/40 border border-border rounded-lg space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Icon name="History" size={13} />
                      Previously saved for this campaign
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {savedEmailContents.map(ec => (
                        <button
                          key={ec.id}
                          type="button"
                          onClick={() => {
                            const isDeselecting = selectedSavedContentId === ec.id;
                            setSelectedSavedContentId(isDeselecting ? null : ec.id);
                            setIsContentEdited(false);
                            if (isDeselecting) {
                              originalSavedContent.current = null;
                              setEmailData({ subject: '', content: '' });
                              if (contentEditorRef.current) contentEditorRef.current.innerHTML = '';
                            } else {
                              originalSavedContent.current = { subject: ec.subject, content: ec.content };
                              setEmailData({ subject: ec.subject, content: ec.content });
                              if (contentEditorRef.current) contentEditorRef.current.innerHTML = ec.content;
                            }
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                            selectedSavedContentId === ec.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-background text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <p className="font-medium truncate">{ec.subject}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(ec.created_at).toLocaleString()}
                          </p>
                        </button>
                      ))}
                    </div>
                    {selectedSavedContentId && (
                      <p className={`text-xs flex items-center gap-1 ${isContentEdited ? 'text-warning' : 'text-primary'}`}>
                        <Icon name={isContentEdited ? 'PenLine' : 'CheckCircle2'} size={12} />
                        {isContentEdited ? 'Content edited — will be saved as new' : 'Using saved content — no changes detected'}
                      </p>
                    )}
                  </div>
                )}

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Email Subject <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Exclusive Offer for You"
                    value={emailData.subject}
                    onChange={(e) => {
                      setEmailData(prev => ({ ...prev, subject: e.target.value }));
                      if (emailErrors.subject) setEmailErrors(prev => ({ ...prev, subject: '' }));
                      if (selectedSavedContentId && originalSavedContent.current) {
                        const currentContent = contentEditorRef.current?.innerHTML || '';
                        setIsContentEdited(e.target.value !== originalSavedContent.current.subject || currentContent !== originalSavedContent.current.content);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  {emailErrors.subject && (
                    <p className="mt-1 text-xs text-error">{emailErrors.subject}</p>
                  )}
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-foreground">
                      Email Content <span className="text-error">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => insertParameter('{{ $json.name }}')}
                      className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/10 transition-colors"
                    >
                      <Icon name="Braces" size={12} />
                      Parameter name
                    </button>
                  </div>

                  {/* Rich editor */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 flex-wrap px-2 py-1.5 bg-muted border-b border-border">
                      <select
                        defaultValue=""
                        onChange={e => { if (e.target.value) { applyContentFontSize(e.target.value); e.target.value = ''; } }}
                        className="text-xs border border-border rounded px-1 py-0.5 bg-background text-foreground cursor-pointer"
                      >
                        <option value="" disabled>Size</option>
                        {['10px','11px','12px','13px','14px','16px','18px','20px','24px','28px','32px'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <div className="w-px h-4 bg-border mx-0.5" />
                      <button type="button" onMouseDown={e => { e.preventDefault(); execContentCmd('bold'); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-background font-bold text-sm text-foreground" title="Bold">B</button>
                      <button type="button" onMouseDown={e => { e.preventDefault(); execContentCmd('italic'); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-background italic text-sm text-foreground" title="Italic">I</button>
                      <button type="button" onMouseDown={e => { e.preventDefault(); execContentCmd('underline'); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-background underline text-sm text-foreground" title="Underline">U</button>
                      <div className="w-px h-4 bg-border mx-0.5" />
                      <button type="button" onMouseDown={e => { e.preventDefault(); openContentLinkInput(); }} className={`w-7 h-7 flex items-center justify-center rounded hover:bg-background text-foreground ${showContentLinkInput ? 'bg-background ring-1 ring-primary' : ''}`} title="Insert Link">
                        <Icon name="Link" size={14} />
                      </button>
                      <button type="button" onMouseDown={e => { e.preventDefault(); contentImageInputRef.current?.click(); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-background text-foreground" title="Upload Image">
                        <Icon name="Image" size={14} />
                      </button>
                      <button type="button" onMouseDown={e => { e.preventDefault(); contentPdfInputRef.current?.click(); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-background text-foreground" title="Upload PDF">
                        <Icon name="FileText" size={14} />
                      </button>
                      <input ref={contentImageInputRef} type="file" accept="image/*" className="hidden" onChange={insertContentImage} />
                      <input ref={contentPdfInputRef} type="file" accept=".pdf" className="hidden" onChange={insertContentPdf} />
                    </div>

                    {/* Floating link popover */}
                    {showContentLinkInput && (
                      <div
                        style={{ position: 'fixed', top: contentLinkPopoverPos.top, left: contentLinkPopoverPos.left, zIndex: 1100 }}
                        className="flex items-center gap-1.5 p-2 bg-background border border-border rounded-lg shadow-lg"
                      >
                        <Icon name="Link" size={13} className="text-muted-foreground shrink-0" />
                        <input
                          autoFocus
                          type="url"
                          value={contentLinkUrl}
                          onChange={e => setContentLinkUrl(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') confirmContentLink();
                            if (e.key === 'Escape') { setShowContentLinkInput(false); setContentLinkUrl('https://'); }
                          }}
                          placeholder="Paste or type a link"
                          className="w-52 text-xs px-2 py-1 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button type="button" onClick={confirmContentLink} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded font-medium hover:opacity-90">Apply</button>
                        <button type="button" onClick={() => { setShowContentLinkInput(false); setContentLinkUrl('https://'); }} className="text-muted-foreground hover:text-foreground">
                          <Icon name="X" size={13} />
                        </button>
                      </div>
                    )}

                    {/* Editable area */}
                    <style>{`
                      .content-editor a { color: #1155CC; text-decoration: underline; cursor: pointer; }
                      .email-preview a { color: #1155CC; text-decoration: underline; }
                    `}</style>
                    <div
                      ref={contentEditorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={syncContent}
                      onPaste={handleContentPaste}
                      className="content-editor min-h-[140px] p-3 bg-background text-foreground focus:outline-none overflow-auto text-sm"
                      style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.5' }}
                    />
                  </div>
                  {emailErrors.content && (
                    <p className="mt-1 text-xs text-error">{emailErrors.content}</p>
                  )}
                </div>

              </div>

              {/* Right — live preview */}
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Preview</p>
                <div className="border border-border rounded-lg bg-white overflow-hidden text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {/* Email header strip */}
                  <div className="bg-muted/40 border-b border-border px-4 py-3 space-y-1">
                    <div className="flex gap-2">
                      <span className="text-xs text-muted-foreground w-14 shrink-0">Subject:</span>
                      <span className="text-xs font-semibold text-foreground break-all">
                        {emailData.subject || <span className="italic text-muted-foreground font-normal">No subject</span>}
                      </span>
                    </div>
                  </div>
                  {/* Body */}
                  <div className="px-4 py-4 space-y-4">
                    {/* Content */}
                    <div className="text-sm text-gray-800 leading-relaxed min-h-[48px]">
                      {emailData.content
                        ? <div className="email-preview" style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: emailData.content }} />
                        : <span className="italic text-muted-foreground text-xs">Email content will appear here...</span>
                      }
                    </div>
                    {/* Signature */}
                    {previewSignature && (
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div
                          style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', lineHeight: '1.4', color: '#444' }}
                          dangerouslySetInnerHTML={{ __html: previewSignature }}
                        />
                      </div>
                    )}
                    {!previewSignature && (
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <p className="text-xs italic text-muted-foreground">No signature configured</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI toggle */}
            <div className="px-6 py-3 border-t border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Icon name="Sparkles" size={15} color={modifyWithAI ? 'var(--color-primary)' : 'var(--color-muted-foreground)'} />
                <span className={`text-sm font-medium ${modifyWithAI ? 'text-primary' : 'text-muted-foreground'}`}>
                  Modify content with AI
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (canModifyWithAI === 1) {
                      setModifyWithAI(v => !v);
                    }
                  }}
                  disabled={canModifyWithAI !== 1}
                  className={`relative inline-flex items-center h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${canModifyWithAI === 1 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${modifyWithAI ? 'bg-primary' : 'bg-border'}`}
                  aria-checked={modifyWithAI}
                  role="switch"
                >
                  <span
                    className={`pointer-events-none h-4 w-4 rounded-full shadow-md transition-transform duration-200 ${modifyWithAI ? 'translate-x-4' : 'translate-x-0'}`}
                    style={{ background: modifyWithAI ? '#fff' : 'var(--color-background)' }}
                  />
                </button>
              </div>
              {canModifyWithAI === 1 && modifyWithAI && (
                <p className="text-xs text-primary mt-1.5">
                  Content will be modified with the information provided in the About section of Settings page.
                </p>
              )}
              {canModifyWithAI === 0 && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  First provide information in the About section of Settings page to enable this feature.
                </p>
              )}
            </div>

            <div className="flex gap-3 p-6 pt-4 border-t border-border shrink-0">
              <button
                type="button"
                onClick={() => { setShowEmailModal(false); setEmailErrors({}); }}
                className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmailModalConfirm}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationForm;