import Icon from '../../../components/AppIcon';

const StatusCard = ({ title, status, lastCheck, icon, details }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'operational':
        return 'text-success bg-success/10 border-success/20';
      case 'warning':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'error':
        return 'text-error bg-error/10 border-error/20';
      default:
        return 'text-muted bg-muted/10 border-muted/20';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'operational':
        return 'CheckCircle2';
      case 'warning':
        return 'AlertTriangle';
      case 'error':
        return 'XCircle';
      default:
        return 'HelpCircle';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-lg transition-all duration-250 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 ${getStatusColor()} rounded-lg`}>
          <Icon name={icon} size={20} className="md:w-6 md:h-6" />
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 ${getStatusColor()} rounded-full`}>
          <Icon name={getStatusIcon()} size={14} />
          <span className="text-xs font-medium">{getStatusText()}</span>
        </div>
      </div>

      <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">{title}</h3>
      
      {details && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{details}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon name="Clock" size={12} />
        <span>Last checked: {lastCheck}</span>
      </div>
    </div>
  );
};

export default StatusCard;