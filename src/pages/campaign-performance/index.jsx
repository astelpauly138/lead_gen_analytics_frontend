import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import Sidebar from '../../components/navigation/Sidebar';
import Header from '../../components/navigation/Header';
import Icon from '../../components/AppIcon';
import KPICard from './components/KPICard';
import CampaignChart from './components/CampaignChart';
import CampaignLeaderboard from './components/CampaignLeaderboard';
import ConversionFunnel from './components/ConversionFunnel';
import FilterPanel from './components/FilterPanel';
import { apiGet } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// age-bucket ordering: index 0 = newest (≤7d), index 3 = oldest (≤1y)
const BUCKET_ORDER = ['7d', '30d', '90d', '1y'];

const round2 = (val) => Math.round(val * 100) / 100;

const computeMetrics = (campaigns) => {
  const totalLeads    = campaigns.reduce((s, c) => s + (c.total_leads       || 0), 0);
  const totalSent     = campaigns.reduce((s, c) => s + (c.total_emails_sent || 0), 0);
  const totalOpened   = campaigns.reduce((s, c) => s + (c.open_count        || 0), 0);
  const totalClicked  = campaigns.reduce((s, c) => s + (c.clickthrough_count|| 0), 0);
  const totalConverted= campaigns.reduce((s, c) => s + (c.converted_count   || 0), 0);

  const avgOpenRate        = totalLeads > 0 ? round2((totalOpened    / totalLeads) * 100) : 0;
  const openDropOff        = totalLeads > 0 ? round2(((totalLeads - totalOpened)    / totalLeads) * 100) : 0;
  const avgClickRate       = totalLeads > 0 ? round2((totalClicked   / totalLeads) * 100) : 0;
  const clickDropOff       = totalLeads > 0 ? round2(((totalLeads - totalClicked)   / totalLeads) * 100) : 0;
  const conversionRate     = totalLeads > 0 ? round2((totalConverted / totalLeads) * 100) : 0;
  const conversionDropOff  = totalLeads > 0 ? round2(((totalLeads - totalConverted) / totalLeads) * 100) : 0;

  return {
    totalLeads, totalSent, totalOpened, totalClicked, totalConverted,
    avgOpenRate, openDropOff, avgClickRate, clickDropOff, conversionRate, conversionDropOff
  };
};

const applyPanelFilters = (campaigns, filters) => {
  return campaigns.filter(c => {
    if (filters.category && c.industry !== filters.category) return false;
    if (filters.city     && c.city     !== filters.city)     return false;
    if (filters.country  && c.country  !== filters.country)  return false;
    if (filters.dateRange) {
      const selIdx = BUCKET_ORDER.indexOf(filters.dateRange);
      const camIdx = BUCKET_ORDER.indexOf(c.campaign_age_bucket);
      if (camIdx === -1 || camIdx > selIdx) return false;
    }
    return true;
  });
};

const applyBucketFilter = (campaigns, bucketRange) => {
  const selIdx = BUCKET_ORDER.indexOf(bucketRange);
  if (selIdx === -1) return campaigns;
  return campaigns.filter(c => {
    const camIdx = BUCKET_ORDER.indexOf(c.campaign_age_bucket);
    return camIdx !== -1 && camIdx <= selIdx;
  });
};

const CampaignPerformance = () => {
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Raw data from API
  const [rawCampaigns, setRawCampaigns] = useState([]);
  const [campaignsAllData, setCampaignsAllData] = useState(null); // campaigns_kpi_all[0]

  // Filter state (lifted from FilterPanel)
  const [filters, setFilters] = useState({ category: '', city: '', country: '', dateRange: '' });

  // Chart's own time-range (only active when all panel filters = '')
  const [chartTimeRange, setChartTimeRange] = useState('7d');

  // Derived UI state
  const [kpiData, setKpiData] = useState([
    { title: 'Total Campaigns', value: '0', change: '', changeType: 'neutral', icon: 'Mail',         iconColor: 'var(--color-primary)' },
    { title: 'Average Open Rate',  value: '0%', change: '', changeType: 'neutral', icon: 'Eye',          iconColor: 'var(--color-success)' },
    { title: 'Click-Through Rate', value: '0%', change: '', changeType: 'neutral', icon: 'MousePointer', iconColor: 'var(--color-warning)' },
    { title: 'Conversion Rate',    value: '0%', change: '', changeType: 'neutral', icon: 'Target',       iconColor: 'var(--color-accent)'  }
  ]);
  const [chartData,     setChartData]     = useState([]);
  const [topCampaigns,  setTopCampaigns]  = useState([]);
  const [allCampaigns,  setAllCampaigns]  = useState([]);
  const [funnelStages,  setFunnelStages]  = useState([]);
  const [funnelSummary, setFunnelSummary] = useState({ overallRate: 0, totalLeads: 0, converted: 0 });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCampaignData = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      setLoading(true);
      const data = await apiGet(`/campaign-kpis/${user.user_id}`);
      const campaigns = data?.campaign_kpis     || [];
      const allRow    = data?.campaign_kpis_all?.[0] || null;

      setRawCampaigns(campaigns);
      setCampaignsAllData(allRow);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching campaign KPIs:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => { fetchCampaignData(); }, [fetchCampaignData]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const id = setInterval(fetchCampaignData, 900000);
    return () => clearInterval(id);
  }, [fetchCampaignData]);

  // ── Derive UI state whenever data / filters / chartTimeRange change ────────
  useEffect(() => {
    if (rawCampaigns.length === 0 && !campaignsAllData) return;

    const allFiltersAreAll =
      !filters.category && !filters.city && !filters.country && !filters.dateRange;

    const filteredCampaigns = allFiltersAreAll
      ? rawCampaigns
      : applyPanelFilters(rawCampaigns, filters);

    // ── KPI cards ─────────────────────────────────────────────────────────────
    if (allFiltersAreAll && campaignsAllData) {
      const d = campaignsAllData;
      setKpiData([
        { title: 'Total Campaigns',    value: String(d.total_campaigns_all || 0),       change: '', changeType: 'neutral', icon: 'Mail',         iconColor: 'var(--color-primary)' },
        { title: 'Average Open Rate',  value: `${d.avg_open_rate_all       || 0}%`,     change: '', changeType: (d.avg_open_rate_all        || 0) > 0 ? 'positive' : 'neutral', icon: 'Eye',          iconColor: 'var(--color-success)' },
        { title: 'Click-Through Rate', value: `${d.avg_clickthrough_rate_all|| 0}%`,    change: '', changeType: (d.avg_clickthrough_rate_all || 0) > 0 ? 'positive' : 'neutral', icon: 'MousePointer', iconColor: 'var(--color-warning)' },
        { title: 'Conversion Rate',    value: `${d.conversion_rate_all     || 0}%`,     change: '', changeType: (d.conversion_rate_all      || 0) > 0 ? 'positive' : 'neutral', icon: 'Target',       iconColor: 'var(--color-accent)'  }
      ]);
    } else if (filteredCampaigns.length > 0) {
      const m = computeMetrics(filteredCampaigns);
      setKpiData([
        { title: 'Total Leads',        value: String(m.totalLeads),         change: '', changeType: 'neutral',                                    icon: 'Mail',         iconColor: 'var(--color-primary)' },
        { title: 'Average Open Rate',  value: `${m.avgOpenRate}%`,          change: '', changeType: m.avgOpenRate  > 0 ? 'positive' : 'neutral',  icon: 'Eye',          iconColor: 'var(--color-success)' },
        { title: 'Click-Through Rate', value: `${m.avgClickRate}%`,         change: '', changeType: m.avgClickRate > 0 ? 'positive' : 'neutral',  icon: 'MousePointer', iconColor: 'var(--color-warning)' },
        { title: 'Conversion Rate',    value: `${m.conversionRate}%`,       change: '', changeType: m.conversionRate > 0 ? 'positive' : 'neutral',icon: 'Target',       iconColor: 'var(--color-accent)'  }
      ]);
    }

    // ── Funnel ────────────────────────────────────────────────────────────────
    if (allFiltersAreAll && campaignsAllData) {
      const d = campaignsAllData;
      setFunnelStages([
        {
          id: 1, name: 'Emails Sent', description: 'Initial outreach delivered',
          count: d.total_emails_sent_all || 0, conversionRate: 100,
          dropOffRate: 0, icon: 'Send', status: 'default', hasDropOffBelow: false
        },
        {
          id: 2, name: 'Emails Opened', description: 'Recipients viewed email',
          count: d.open_count_all || 0, conversionRate: d.avg_open_rate_all || 0,
          dropOffRate: d.open_dropoff_rate_all || 0, icon: 'Eye', status: 'default', hasDropOffBelow: true
        },
        {
          id: 3, name: 'Links Clicked', description: 'Engaged with content',
          count: d.clickthrough_count_all || 0, conversionRate: d.avg_clickthrough_rate_all || 0,
          dropOffRate: d.clickthrough_dropoff_rate_all || 0, icon: 'MousePointer', status: 'warning', hasDropOffBelow: true
        },
        {
          id: 4, name: 'Converted', description: 'Successfully converted leads',
          count: d.converted_count_all || 0, conversionRate: d.conversion_rate_all || 0,
          dropOffRate: d.conversion_dropoff_rate_all || 0, icon: 'CheckCircle', status: 'success', hasDropOffBelow: true
        }
      ]);
      setFunnelSummary({
        overallRate: d.conversion_rate_all  || 0,
        totalLeads:  d.total_emails_sent_all || 0,
        converted:   d.converted_count_all  || 0
      });
    } else if (filteredCampaigns.length > 0) {
      const m = computeMetrics(filteredCampaigns);
      setFunnelStages([
        {
          id: 1, name: 'Emails Sent', description: 'Initial outreach delivered',
          count: m.totalSent, conversionRate: 100,
          dropOffRate: 0, icon: 'Send', status: 'default', hasDropOffBelow: false
        },
        {
          id: 2, name: 'Emails Opened', description: 'Recipients viewed email',
          count: m.totalOpened, conversionRate: m.avgOpenRate,
          dropOffRate: m.openDropOff, icon: 'Eye', status: 'default', hasDropOffBelow: true
        },
        {
          id: 3, name: 'Links Clicked', description: 'Engaged with content',
          count: m.totalClicked, conversionRate: m.avgClickRate,
          dropOffRate: m.clickDropOff, icon: 'MousePointer', status: 'warning', hasDropOffBelow: true
        },
        {
          id: 4, name: 'Converted', description: 'Successfully converted leads',
          count: m.totalConverted, conversionRate: m.conversionRate,
          dropOffRate: m.conversionDropOff, icon: 'CheckCircle', status: 'success', hasDropOffBelow: true
        }
      ]);
      setFunnelSummary({
        overallRate: m.conversionRate,
        totalLeads:  m.totalSent,
        converted:   m.totalConverted
      });
    }

    // ── Chart ─────────────────────────────────────────────────────────────────
    // When all panel filters = '', chart uses its own time range to slice by age bucket.
    // When panel filters active, chart shows filteredCampaigns as-is.
    const chartSource = allFiltersAreAll
      ? applyBucketFilter(rawCampaigns, chartTimeRange)
      : filteredCampaigns;

    setChartData(chartSource.map(c => ({
      period:        c.campaign_name,
      emailsSent:    c.total_emails_sent  || 0,
      emailsOpened:  c.open_count         || 0,
      emailsClicked: c.clickthrough_count || 0,
      converted:     c.converted_count    || 0
    })));

    // ── Leaderboard ───────────────────────────────────────────────────────────
    const leaderboardSource = allFiltersAreAll ? rawCampaigns : filteredCampaigns;
    const sorted = [...leaderboardSource].sort((a, b) => {
      const score = (c) => {
        const total = c.total_leads || 0;
        if (total === 0) return 0;
        return ((c.open_count || 0) + (c.clickthrough_count || 0) + (c.converted_count || 0)) / total * 100;
      };
      return score(b) - score(a);
    });

    const mapCampaign = (c, idx) => {
      const total = c.total_leads || 0;
      const safe  = Math.max(total, 1);
      return {
        id:            c.campaign_id || idx + 1,
        name:          c.campaign_name,
        type:          c.industry || 'Campaign',
        convertedRate: parseFloat(((c.converted_count    || 0) / safe * 100).toFixed(1)),
        emailsSent:    c.total_emails_sent || 0,
        openRate:      parseFloat(((c.open_count         || 0) / safe * 100).toFixed(1)),
        clickRate:     parseFloat(((c.clickthrough_count || 0) / safe * 100).toFixed(1)),
        converted:     c.converted_count || 0
      };
    };
    setTopCampaigns(sorted.slice(0, 5).map(mapCampaign));
    setAllCampaigns(sorted.map(mapCampaign));

  }, [rawCampaigns, campaignsAllData, filters, chartTimeRange]);

  const allFiltersAreAll = !filters.category && !filters.city && !filters.country && !filters.dateRange;

  const chartColRef = useRef(null);
  const [chartHeight, setChartHeight] = useState(null);

  useEffect(() => {
    const el = chartColRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setChartHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <Helmet>
        <title>Campaign Performance - ANALYTICA</title>
        <meta name="description" content="Comprehensive email outreach analytics and campaign performance monitoring" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header />

          <main className="p-4 md:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">
              {/* Page header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    Campaign Performance
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Email outreach analytics and success rate monitoring
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="caption text-muted-foreground text-xs">
                      Updated {lastUpdated?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button
                    onClick={fetchCampaignData}
                    className="flex items-center justify-center w-10 h-10 bg-card border border-border rounded-lg hover:bg-muted transition-all duration-250 touch-target"
                    title="Refresh data"
                  >
                    <Icon name="RefreshCw" size={18} />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <Icon name="Loader2" size={32} className="animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading campaign data...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* KPI cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {kpiData.map((kpi, index) => (
                      <div key={index} className="animate-stagger">
                        <KPICard {...kpi} />
                      </div>
                    ))}
                  </div>

                  {/* Advanced Filters — passes raw campaigns for dynamic options */}
                  <FilterPanel
                    campaigns={rawCampaigns}
                    filters={filters}
                    onFilterChange={setFilters}
                  />

                  {/* Chart + Leaderboard */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
                    <div ref={chartColRef} className="lg:col-span-8 animate-fade-in">
                      <CampaignChart
                        data={chartData}
                        chartTimeRange={chartTimeRange}
                        onChartTimeRangeChange={setChartTimeRange}
                        filtersActive={!allFiltersAreAll}
                      />
                    </div>
                    <div
                      className="lg:col-span-4 animate-fade-in flex flex-col"
                      style={chartHeight ? { height: `${chartHeight}px` } : {}}
                    >
                      <CampaignLeaderboard campaigns={topCampaigns} allCampaigns={allCampaigns} />
                    </div>
                  </div>

                  {/* Conversion Funnel */}
                  <div className="animate-fade-in">
                    <ConversionFunnel
                      stages={funnelStages}
                      overallRate={funnelSummary.overallRate}
                      totalLeads={funnelSummary.totalLeads}
                      converted={funnelSummary.converted}
                    />
                  </div>

                  {/* Performance Insights */}
                  {topCampaigns.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-4 md:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-1">Performance Insights</h2>
                          <p className="caption text-muted-foreground text-sm">Data-driven recommendations</p>
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                          <Icon name="Lightbulb" size={20} color="var(--color-primary)" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-success/20 rounded-lg flex-shrink-0">
                              <Icon name="TrendingUp" size={16} color="var(--color-success)" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-foreground mb-1">Top Performer</h3>
                              <p className="caption text-muted-foreground text-xs">
                                Your &quot;{topCampaigns[0]?.name}&quot; campaign leads with a {topCampaigns[0]?.openRate}% open rate and {topCampaigns[0]?.convertedRate}% conversion rate.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-lg flex-shrink-0">
                              <Icon name="BarChart3" size={16} color="var(--color-primary)" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-foreground mb-1">Overall Summary</h3>
                              <p className="caption text-muted-foreground text-xs">
                                Across {kpiData[0]?.value} {allFiltersAreAll ? 'campaigns' : 'leads'}, your average open rate is {kpiData[1]?.value} and click-through rate is {kpiData[2]?.value}.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default CampaignPerformance;
