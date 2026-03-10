import { useState } from 'react';
import Sidebar from '../../components/navigation/Sidebar';
import Header from '../../components/navigation/Header';
import Icon from '../../components/AppIcon';

const plans = [
  {
    name: 'Free',
    price: 0,
    duration_days: 30,
    max_campaigns: 1,
    max_leads: 100,
    description: 'Get started with basic lead generation',
    icon: 'Zap',
    features: [
      '1 campaign',
      '100 leads per month',
      'Basic analytics',
      'Email support',
    ],
    highlight: false,
  },
  {
    name: 'Pro',
    price: 29,
    duration_days: 30,
    max_campaigns: 10,
    max_leads: 5000,
    description: 'Scale your outreach with powerful tools',
    icon: 'Rocket',
    features: [
      '10 campaigns',
      '5,000 leads per month',
      'Advanced analytics',
      'Priority email support',
      'Domain blacklisting',
      'AI email modification',
    ],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    duration_days: 30,
    max_campaigns: 100,
    max_leads: 50000,
    description: 'Full power for large-scale operations',
    icon: 'Building2',
    features: [
      '100 campaigns',
      '50,000 leads per month',
      'Full analytics suite',
      'Dedicated support',
      'Domain blacklisting',
      'AI email modification',
      'Custom integrations',
    ],
    highlight: false,
  },
];

const BillingPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header />

        <main className="p-4 md:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Billing & Plans</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Choose the plan that fits your lead generation needs. All plans renew every 30 days.
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md ${
                  plan.highlight
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow">
                      <Icon name="Star" size={11} />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan icon + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${plan.highlight ? 'bg-primary/20' : 'bg-muted'}`}>
                    <Icon name={plan.icon} size={20} color={plan.highlight ? 'var(--color-primary)' : 'var(--color-muted-foreground)'} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {plan.price === 0 ? (
                    <p className="text-4xl font-bold text-foreground">Free</p>
                  ) : (
                    <p className="text-4xl font-bold text-foreground">
                      {plan.price}
                      <span className="text-base font-normal text-muted-foreground"> AED / mo</span>
                    </p>
                  )}
                </div>

                {/* Limits */}
                <div className="flex flex-col gap-2 mb-6 p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Icon name="Mail" size={13} />
                      Campaigns
                    </span>
                    <span className="font-semibold text-foreground">{plan.max_campaigns.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Icon name="Users" size={13} />
                      Leads / mo
                    </span>
                    <span className="font-semibold text-foreground">{plan.max_leads.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Icon name="CalendarDays" size={13} />
                      Duration
                    </span>
                    <span className="font-semibold text-foreground">{plan.duration_days} days</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="flex flex-col gap-2 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Icon name="Check" size={14} color="var(--color-success)" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  type="button"
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-foreground border border-border hover:bg-muted/80'
                  }`}
                >
                  {plan.price === 0 ? 'Get Started Free' : `Choose ${plan.name}`}
                </button>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="mt-8 text-xs text-muted-foreground">
            All prices are in AED (UAE Dirham) and billed monthly. Plans auto-renew every 30 days.
          </p>
        </main>
      </div>
    </div>
  );
};

export default BillingPage;
