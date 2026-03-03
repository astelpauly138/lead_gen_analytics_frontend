import { useState, useEffect } from 'react';
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
  const [emailData, setEmailData] = useState({ subject: '', content: '', redirectUrl: '' });
  const [emailErrors, setEmailErrors] = useState({});

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
    // Show email modal before proceeding
    setShowEmailModal(true);
  };

  const validateEmailModal = () => {
    const errs = {};
    if (!emailData.subject.trim()) errs.subject = 'Please enter an email subject';
    if (!emailData.content.trim()) errs.content = 'Please enter the email content';
    if (!emailData.redirectUrl.trim()) errs.redirectUrl = 'Please enter a redirecting URL';
    setEmailErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEmailModalConfirm = async () => {
    if (!validateEmailModal()) return;
    setShowEmailModal(false);
    setIsSubmitting(true);

    try {
      // 1. Resolve labels for the backend
      const industryLabel = industryOptions.find(o => o.value === formData.industry)?.label || formData.industry;
      const countryLabel = locationOptions.find(o => o.value === formData.location)?.label || formData.location;
      const jobTitlesArray = formData.jobTitles.split(',').map(t => t.trim()).filter(Boolean);

      // 2. Create campaign in database
      const campaignPayload = {
        campaign: {
          name: formData.name,
          campaign_type: 'lead_generation',
          industry: industryLabel,
          area: formData.area || '',
          city: formData.city || '',
          state: '',
          country: countryLabel,
          job_titles: jobTitlesArray,
          requested_leads: parseInt(formData.no_of_targets) || 100,
          status: 'pending'
        },
        email: {
          subject: emailData.subject,
          body: emailData.content,
          redirect_url: emailData.redirectUrl
        }
      };

      const campaignResult = await apiPost(`/campaigns/${user.user_id}`, campaignPayload);
      console.log('Campaign created:', campaignResult);

      setShowForm(false);

      const campaignId = campaignResult?.campaign?.id;
      setCurrentCampaignId(campaignId);

      // 3. Refresh dashboard to show "Started lead scraping" activity log
      if (typeof onSubmit === 'function') {
        onSubmit(formData, campaignResult);
      }

      // 4. Start n8n scraping (include email fields)
      const n8nPayload = {
        ...formData,
        campaign_id: campaignId,
        user_id: user.user_id,
        email_subject: emailData.subject,
        email_content: emailData.content,
        redirect_url: emailData.redirectUrl
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
        // 5. Map n8n employees to Lead format for /lead-scraping
        const employees = Array.isArray(result) ? result : (result?.employees || []);

        if (employees.length === 0) {
          setShowForm(true);
          setShowErrorPopup(true);
        } else if (employees.length > 0) {
          const leads = employees.map(emp => ({
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
            Promotion_Status: emp['Promotion Status'] || emp.Promotion_Status || emp.promotion_status || null
          }));

          // 6. Insert leads via /lead-scraping endpoint
          const leadResult = await apiPost('/lead-scraping', {
            user_id: user.user_id,
            campaign_id: campaignId,
            leads
          });
          console.log('Leads inserted:', leadResult);

          // 7. Show inserted leads in pending list
          setPendingLeads(leadResult?.inserted_leads || []);
          setSelectedEmployees([]);
          setActiveView('pending');
          setShowForm(false);
          setShowList(true);

          // 8. Refresh dashboard to show "Leads scraped" activity log + updated KPIs
          if (typeof onSubmit === 'function') {
            onSubmit(formData, leadResult);
          }
        }
      }
    } catch (err) {
      console.error('Failed during campaign creation or scraping', err);
      setShowForm(true);
    } finally {
      setIsSubmitting(false);
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
    if (selectedEmployees.length === 0) {
      return;
    }

    setIsApprovingSubmission(true);

    try {
      // Collect selected leads from pending list
      const selectedLeadObjects = selectedEmployees
        .map(idx => pendingLeads[idx])
        .filter(Boolean);

      // Use currentCampaignId from state, or fall back to the lead's own campaign_id (after refresh)
      const campaignId = currentCampaignId || selectedLeadObjects[0]?.campaign_id;

      const approvalPayload = {
        user_id: user.user_id,
        campaign_id: campaignId,
        type: 'sent',
        leads: selectedLeadObjects.map(lead => ({
          lead_id: lead.id,
          approved: true
        }))
      };

      const approveResult = await apiPost('/leads-approved', approvalPayload);
      console.log('Leads approved:', approveResult);

      // Use response's updated_leads to determine which leads were actually approved
      const approvedIds = new Set(
        (approveResult?.updated_leads || []).map(l => l.lead_id)
      );

      // Move only backend-confirmed approved leads from pending to sent
      const remainingPending = pendingLeads.filter(l => !approvedIds.has(l.id));
      const approvedLeadObjects = pendingLeads.filter(l => approvedIds.has(l.id));
      const newSent = [...sentLeads, ...approvedLeadObjects];

      setPendingLeads(remainingPending);
      setSentLeads(newSent);
      setSelectedEmployees([]);
      setActiveView('sent');
      setShowList(true);

      // Refresh dashboard to display activity log + updated KPIs
      if (typeof onSubmit === 'function') {
        onSubmit(formData, approveResult);
      }
    } catch (err) {
      console.error('Failed to approve submission', err);
    } finally {
      setIsApprovingSubmission(false);
    }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg shrink-0">
                <Icon name="Mail" size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Email Details</h3>
                <p className="text-xs text-muted-foreground">Fill in the details before starting scraping</p>
              </div>
            </div>

            <div className="space-y-4">
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
                  }}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                {emailErrors.subject && (
                  <p className="mt-1 text-xs text-error">{emailErrors.subject}</p>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email Content <span className="text-error">*</span>
                </label>
                <textarea
                  placeholder="Write your email body here..."
                  value={emailData.content}
                  rows={4}
                  onChange={(e) => {
                    setEmailData(prev => ({ ...prev, content: e.target.value }));
                    if (emailErrors.content) setEmailErrors(prev => ({ ...prev, content: '' }));
                  }}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                />
                {emailErrors.content && (
                  <p className="mt-1 text-xs text-error">{emailErrors.content}</p>
                )}
              </div>

              {/* Redirect URL */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Redirecting URL <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="https://yoursite.com/landing"
                  value={emailData.redirectUrl}
                  onChange={(e) => {
                    setEmailData(prev => ({ ...prev, redirectUrl: e.target.value }));
                    if (emailErrors.redirectUrl) setEmailErrors(prev => ({ ...prev, redirectUrl: '' }));
                  }}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                {emailErrors.redirectUrl && (
                  <p className="mt-1 text-xs text-error">{emailErrors.redirectUrl}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
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