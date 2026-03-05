import {
  ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
const timeRanges = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '1Y', value: '1y' }
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="caption text-muted-foreground text-xs">{entry.name}:</span>
            <span className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CampaignChart = ({ data, chartTimeRange, onChartTimeRangeChange, filtersActive }) => {
  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-1">Campaign Performance Trends</h2>
          <p className="caption text-muted-foreground text-sm">Email volume and engagement analysis</p>
        </div>

        {/* Time range buttons only meaningful when no panel filter active */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => onChartTimeRangeChange(range.value)}
              disabled={filtersActive}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-250 touch-target ${
                !filtersActive && chartTimeRange === range.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              } ${filtersActive ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-64 md:h-80 lg:h-96" aria-label="Campaign Performance Chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="period"
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />

            <Bar
              dataKey="emailsSent"
              fill="var(--color-primary)"
              name="Emails Sent"
              radius={[8, 8, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="emailsOpened"
              stroke="var(--color-success)"
              strokeWidth={2}
              name="Emails Opened"
              dot={{ fill: 'var(--color-success)', r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="emailsClicked"
              stroke="var(--color-warning)"
              strokeWidth={2}
              name="Emails Clicked"
              dot={{ fill: 'var(--color-warning)', r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="converted"
              stroke="var(--color-accent)"
              strokeWidth={2}
              name="Converted"
              dot={{ fill: 'var(--color-accent)', r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CampaignChart;
