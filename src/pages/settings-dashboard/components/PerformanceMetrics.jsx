import Icon from '../../../components/AppIcon';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PerformanceMetrics = ({ metrics, chartData }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
          <Icon name="Activity" size={20} color="var(--color-primary)" />
        </div>
        <h3 className="text-lg md:text-xl font-semibold text-foreground">Performance Metrics</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics?.map((metric, index) => (
          <div key={index} className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase">{metric?.label}</span>
              <Icon name={metric?.icon} size={16} className="text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground data-text">{metric?.value}</span>
              <span className="text-xs text-muted-foreground">{metric?.unit}</span>
            </div>
            {metric?.change && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${
                metric?.change > 0 ? 'text-success' : 'text-error'
              }`}>
                <Icon name={metric?.change > 0 ? 'TrendingUp' : 'TrendingDown'} size={12} />
                <span>{Math.abs(metric?.change)}% vs yesterday</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-foreground mb-4">API Response Times (24h)</h4>
          <div className="w-full h-64" aria-label="API Response Times Chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData?.responseTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="time" 
                  stroke="var(--color-muted-foreground)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="var(--color-muted-foreground)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="google_sheets" 
                  stroke="var(--color-primary)" 
                  strokeWidth={2}
                  name="Google Sheets"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="n8n_webhook" 
                  stroke="var(--color-secondary)" 
                  strokeWidth={2}
                  name="Webhook"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="email_service" 
                  stroke="var(--color-accent)" 
                  strokeWidth={2}
                  name="Email Service"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-foreground mb-4">Error Rate (24h)</h4>
          <div className="w-full h-64" aria-label="Error Rate Chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData?.errorRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="time" 
                  stroke="var(--color-muted-foreground)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="var(--color-muted-foreground)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="errors" 
                  stroke="var(--color-error)" 
                  fill="var(--color-error)"
                  fillOpacity={0.2}
                  name="Error Count"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;