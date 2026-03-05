import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActions = ({ onActionClick, isRefreshing, isExporting }) => {
  const actions = [
    {
      id: 'export',
      label: 'Export Report',
      icon: 'Download',
      variant: 'outline',
      description: 'Download Approved Leads data'
    },
    {
      id: 'refresh',
      label: 'Refresh Data',
      icon: 'RefreshCw',
      variant: 'outline',
      description: 'Update dashboard metrics'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg">
          <Icon name="Zap" size={20} color="var(--color-primary)" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-foreground">Quick Actions</h2>
          <p className="caption text-muted-foreground text-xs md:text-sm">Common dashboard operations</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions?.map((action) => (
          <Button
            key={action?.id}
            variant={action?.variant}
            iconName={(action?.id === 'refresh' && isRefreshing) || (action?.id === 'export' && isExporting) ? null : action?.icon}
            iconPosition="left"
            onClick={() => onActionClick(action?.id)}
            loading={(action?.id === 'refresh' && isRefreshing) || (action?.id === 'export' && isExporting)}
            disabled={(action?.id === 'refresh' && isRefreshing) || (action?.id === 'export' && isExporting)}
            fullWidth
            className="justify-start"
          >
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">
                {action?.id === 'export' && isExporting ? 'Processing...' : action?.label}
              </span>
              <span className="caption text-muted-foreground text-xs">{action?.description}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;