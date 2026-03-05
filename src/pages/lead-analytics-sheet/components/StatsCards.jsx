import Icon from '../../../components/AppIcon';

const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Leads',
      value: stats?.totalLeads?.toLocaleString() ?? '0',
      icon: 'Users',
      color: 'primary'
    },
    {
      title: 'Qualified Leads',
      value: stats?.qualifiedLeads?.toLocaleString() ?? '0',
      icon: 'Target',
      color: 'success'
    },
    {
      title: 'Avg Quality Score',
      value: '0',
      icon: 'TrendingUp',
      color: 'warning'
    },
    {
      title: 'Conversion Rate',
      value: '0%',
      icon: 'Percent',
      color: 'secondary'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      primary: 'bg-primary/10 text-primary',
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      secondary: 'bg-secondary/10 text-secondary'
    };
    return colors[color];
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-card border border-border rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-250 animate-stagger"
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-lg ${getColorClasses(card.color)}`}
            >
              <Icon name={card.icon} size={24} />
            </div>
          </div>

          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-1">{card.value}</h3>
          <p className="caption text-muted-foreground text-sm">{card.title}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
