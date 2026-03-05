import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import Sidebar from '../../components/navigation/Sidebar';
import Header from '../../components/navigation/Header';
import KPICard from './components/KPICard';
import ConfigurationForm from './components/ConfigurationForm';
import ActivityFeed from './components/ActivityFeed';
import QuickActions from './components/QuickActions';
import Icon from '../../components/AppIcon';
import { apiGet } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const getChangeType = (pct) => {
  if (pct === null || pct === undefined) return 'neutral';
  if (pct > 0) return 'positive';
  if (pct < 0) return 'negative';
  return 'neutral';
};

const buildKpiFromAll = (kpisAll) => {
  if (!kpisAll || kpisAll.length === 0) return null;
  const d = kpisAll[0];
  return {
    totalScraped: {
      value: d.total_leads_all || 0,
      change: d.total_leads_last_week_comparison_percent_all,
      changeType: getChangeType(d.total_leads_last_week_comparison_percent_all)
    },
    readyToEmail: {
      value: d.ready_to_email_count_all || 0,
      change: d.ready_to_email_last_week_comparison_percent_all,
      changeType: getChangeType(d.ready_to_email_last_week_comparison_percent_all)
    },
    emailsSent: {
      value: d.emails_sent_all || 0,
      change: d.email_sent_last_week_comparison_percent_all,
      changeType: getChangeType(d.email_sent_last_week_comparison_percent_all)
    },
    successRate: {
      value: d.success_rate_all || 0,
      change: d.success_rate_last_week_comparison_percent_all,
      changeType: getChangeType(d.success_rate_last_week_comparison_percent_all)
    }
  };
};

const buildKpiFromCampaign = (kpis, campaignName) => {
  const d = kpis.find(c => c.campaign_name === campaignName);
  if (!d) return null;
  return {
    totalScraped: {
      value: d.total_leads || 0,
      change: d.total_leads_last_week_comparison_percent,
      changeType: getChangeType(d.total_leads_last_week_comparison_percent)
    },
    readyToEmail: {
      value: d.ready_to_email_count || 0,
      change: d.ready_to_email_last_week_comparison_percent,
      changeType: getChangeType(d.ready_to_email_last_week_comparison_percent)
    },
    emailsSent: {
      value: d.emails_sent || 0,
      change: d.email_sent_last_week_comparison_percent,
      changeType: getChangeType(d.email_sent_last_week_comparison_percent)
    },
    successRate: {
      value: d.success_rate || 0,
      change: d.success_rate_last_week_comparison_percent,
      changeType: getChangeType(d.success_rate_last_week_comparison_percent)
    }
  };
};

const MainDashboard = () => {
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activities, setActivities] = useState([]);
  const [kpiData, setKpiData] = useState({
    totalScraped: { value: 0, change: null, changeType: 'neutral' },
    readyToEmail: { value: 0, change: null, changeType: 'neutral' },
    emailsSent: { value: 0, change: null, changeType: 'neutral' },
    successRate: { value: 0, change: null, changeType: 'neutral' }
  });

  const [dashboardData, setDashboardData] = useState({});
  const [rawData, setRawData] = useState({ kpis: [], kpisAll: [], logs: [] });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedCampaign, setSelectedCampaign] = useState('ALL');
  const [campaignList, setCampaignList] = useState([]);

  // Fetch dashboard data from backend
  const fetchDashboard = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      const data = await apiGet(`/dashboard/dashboard/${user.user_id}`);

      setDashboardData(data || {});

      const kpis = data?.dashboard_kpis || [];
      const kpisAll = data?.dashboard_kpis_all || [];
      const logs = data?.activity_logs || [];

      // Extract campaign list
      const campaigns = kpis.map(c => ({ id: c.campaign_id, name: c.campaign_name }));
      setCampaignList(campaigns);

      // Map and sort activity logs (latest first)
      const mappedLogs = logs
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((log, index) => ({
          id: `${log.campaign_id}-${log.created_at}-${index}`,
          icon: log.action?.toLowerCase().includes('approved') ? 'ThumbsUp'
            : log.action?.toLowerCase().includes('scrap') ? 'CheckCircle2'
            : 'Play',
          color: log.action?.toLowerCase().includes('approved') ? 'var(--color-success)'
            : log.action?.toLowerCase().includes('scrap') ? 'var(--color-primary)'
            : 'var(--color-warning)',
          title: log.action,
          description: log.campaign_name || '',
          campaign_name: log.campaign_name || '',
          timestamp: log.created_at,
          status: 'success'
        }));

      setRawData({ kpis, kpisAll, logs: mappedLogs });
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching dashboard', err);
    }
  }, [user?.user_id]);

  // Fetch on mount and when user_id becomes available
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Derive KPIs and activities whenever raw data or selected campaign changes
  useEffect(() => {
    const { kpis, kpisAll, logs } = rawData;

    if (selectedCampaign === 'ALL') {
      const allKpi = buildKpiFromAll(kpisAll);
      if (allKpi) setKpiData(allKpi);
      setActivities(logs);
    } else {
      const campaignKpi = buildKpiFromCampaign(kpis, selectedCampaign);
      if (campaignKpi) setKpiData(campaignKpi);
      setActivities(logs.filter(a => a.campaign_name === selectedCampaign));
    }
  }, [rawData, selectedCampaign]);

  const handleCampaignChange = (campaign) => {
    setSelectedCampaign(campaign);
    setLastUpdate(new Date());
  };

  const handleConfigSubmit = () => {
    fetchDashboard();
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const formColRef = useRef(null);
  const [configHeight, setConfigHeight] = useState(null);

  useEffect(() => {
    const el = formColRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setConfigHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleQuickAction = async (actionId) => {
    if (actionId === 'refresh') {
      setIsRefreshing(true);
      await fetchDashboard();
      setIsRefreshing(false);
    } else if (actionId === 'export') {
      setIsExporting(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`https://lead-gen-analytics-backend.onrender.com/export_approved/${user.user_id}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Export failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads_data.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Export failed:', err);
      } finally {
        setIsExporting(false);
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Lead Generation</title>
        <meta name="description" content="Real-time lead generation performance monitoring and campaign configuration dashboard" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header />

          <main className="p-4 md:p-6 lg:p-8">
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    Lead Generation Dashboard
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Real-time performance monitoring and campaign configuration
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Campaign Filter */}
                  <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                    <Icon name="Filter" size={16} color="var(--color-muted-foreground)" />
                    <div>
                      <p className="caption text-muted-foreground text-xs">Campaign</p>
                      <select
                        value={selectedCampaign}
                        onChange={e => handleCampaignChange(e.target.value)}
                        className="text-sm font-medium text-foreground bg-transparent border-none outline-none cursor-pointer"
                      >
                        <option value="ALL">All Campaigns</option>
                        {campaignList.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                    <Icon name="Clock" size={16} color="var(--color-muted-foreground)" />
                    <div>
                      <p className="caption text-muted-foreground text-xs">Last Updated</p>
                      <p className="text-sm font-medium text-foreground">
                        {lastUpdate?.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <KPICard
                title="Total Scraped"
                value={kpiData?.totalScraped?.value}
                change={kpiData?.totalScraped?.change}
                changeType={kpiData?.totalScraped?.changeType}
                icon="Database"
                color="var(--color-primary)"
              />

              <KPICard
                title="Ready to Email"
                value={kpiData?.readyToEmail?.value}
                change={kpiData?.readyToEmail?.change}
                changeType={kpiData?.readyToEmail?.changeType}
                icon="CheckCircle"
                color="var(--color-success)"
              />

              <KPICard
                title="Emails Sent"
                value={kpiData?.emailsSent?.value}
                change={kpiData?.emailsSent?.change}
                changeType={kpiData?.emailsSent?.changeType}
                icon="Mail"
                color="var(--color-warning)"
              />

              <KPICard
                title="Success Rate"
                value={kpiData?.successRate?.value}
                change={kpiData?.successRate?.change}
                changeType={kpiData?.successRate?.changeType}
                icon="TrendingUp"
                color="var(--color-accent)"
                suffix="%"
              />
            </div>

            <div className="mb-6 md:mb-8">
              <QuickActions onActionClick={handleQuickAction} isRefreshing={isRefreshing} isExporting={isExporting} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
              <div ref={formColRef} className="lg:col-span-8 flex flex-col">
                <ConfigurationForm onSubmit={handleConfigSubmit} dashboardData={dashboardData} />
              </div>

              <div
                className="lg:col-span-4 flex flex-col"
                style={configHeight ? { height: `${configHeight}px` } : {}}
              >
                <ActivityFeed activities={activities} />
              </div>
            </div>

            <div className="mt-6 md:mt-8 p-4 md:p-6 bg-card border border-border rounded-xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Icon name="Info" size={20} color="var(--color-primary)" className="mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">
                      Scraping Process
                    </h3>
                    <p className="caption text-muted-foreground text-sm">
                      Lead scraping typically takes 5-15 minutes depending on target count. You'll receive real-time updates in the activity feed.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-lg flex-shrink-0">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-success whitespace-nowrap">Live Data</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default MainDashboard;
