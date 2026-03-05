import Icon from '../../../components/AppIcon';

const KPICard = ({ title, value, change, changeType, icon, iconColor }) => {
  const isPositive = changeType === 'positive';
  const isNeutral = changeType === 'neutral';

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-250">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg" style={{ backgroundColor: `${iconColor}20` }}>
          <Icon name={icon} size={20} color={iconColor} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm md:text-base text-muted-foreground font-medium">{title}</h3>
        <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">{value}</p>
        
        {change && (
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
              isPositive ? 'bg-success/10' : isNeutral ? 'bg-muted' : 'bg-error/10'
            }`}>
              <Icon 
                name={isPositive ? 'TrendingUp' : isNeutral ? 'Minus' : 'TrendingDown'} 
                size={14} 
                color={isPositive ? 'var(--color-success)' : isNeutral ? 'var(--color-muted-foreground)' : 'var(--color-error)'}
              />
              <span className={`text-xs font-medium ${
                isPositive ? 'text-success' : isNeutral ? 'text-muted-foreground' : 'text-error'
              }`}>
                {change}
              </span>
            </div>
            <span className="caption text-muted-foreground text-xs">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;