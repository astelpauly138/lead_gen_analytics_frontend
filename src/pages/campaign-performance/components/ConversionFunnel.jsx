import Icon from '../../../components/AppIcon';

const ConversionFunnel = ({ stages, overallRate, totalLeads, converted }) => {
  const maxValue = stages?.length > 0 ? Math.max(...stages.map(s => s?.count || 0)) : 1;

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-1">Conversion Funnel</h2>
          <p className="caption text-muted-foreground text-sm">Lead progression through email stages</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <span className="caption text-muted-foreground text-xs">Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-error rounded-full" />
            <span className="caption text-muted-foreground text-xs">Drop-off</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {stages?.map((stage) => {
          const widthPercentage = maxValue > 0 ? (stage?.count / maxValue) * 100 : 0;

          return (
            <div key={stage?.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    stage?.status === 'success' ? 'bg-success/20' :
                    stage?.status === 'warning' ? 'bg-warning/20' : 'bg-primary/20'
                  }`}>
                    <Icon
                      name={stage?.icon}
                      size={16}
                      color={
                        stage?.status === 'success' ? 'var(--color-success)' :
                        stage?.status === 'warning' ? 'var(--color-warning)' :
                        'var(--color-primary)'
                      }
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{stage?.name}</h3>
                    <p className="caption text-muted-foreground text-xs">{stage?.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{stage?.count?.toLocaleString()}</p>
                  <p className="caption text-success text-xs font-medium">{stage?.conversionRate}%</p>
                </div>
              </div>

              <div className="relative">
                <div className="w-full bg-border rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                    style={{ width: `${widthPercentage}%` }}
                  >
                    <span className="text-xs font-semibold text-primary-foreground whitespace-nowrap">
                      {stage?.count?.toLocaleString()} leads
                    </span>
                  </div>
                </div>
              </div>

              {/* Only show drop-off indicator when the stage explicitly requests it */}
              {stage?.hasDropOffBelow && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Icon name="ArrowDown" size={16} color="var(--color-muted-foreground)" />
                  <div className="flex items-center gap-2 px-3 py-1 bg-error/10 rounded-full">
                    <Icon name="TrendingDown" size={12} color="var(--color-error)" />
                    <span className="caption text-error text-xs font-medium">
                      {stage?.dropOffRate}% drop-off
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary footer — 3 columns, no Avg. Time */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="caption text-muted-foreground text-xs mb-1">Overall Conversion</p>
            <p className="text-xl font-bold text-success">{overallRate ?? 0}%</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="caption text-muted-foreground text-xs mb-1">Total Leads</p>
            <p className="text-xl font-bold text-foreground">{(totalLeads ?? 0).toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="caption text-muted-foreground text-xs mb-1">Converted</p>
            <p className="text-xl font-bold text-primary">{(converted ?? 0).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionFunnel;
