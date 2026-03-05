import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BackupStatus = ({ backups }) => {
  const handleBackupNow = () => {
    console.log('Manual backup initiated');
  };

  const handleRestore = (backupId) => {
    console.log('Restoring backup:', backupId);
  };

  const getBackupStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10';
      case 'in_progress':
        return 'text-warning bg-warning/10';
      case 'failed':
        return 'text-error bg-error/10';
      default:
        return 'text-muted bg-muted/10';
    }
  };

  const getBackupStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'CheckCircle2';
      case 'in_progress':
        return 'Loader2';
      case 'failed':
        return 'XCircle';
      default:
        return 'HelpCircle';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <Icon name="Database" size={20} color="var(--color-primary)" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-foreground">Backup Status</h3>
        </div>
        <Button
          variant="default"
          size="sm"
          iconName="Download"
          onClick={handleBackupNow}
        >
          Backup Now
        </Button>
      </div>
      <div className="space-y-3">
        {backups?.map((backup) => (
          <div
            key={backup?.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-3 flex-1">
              <div className={`flex items-center justify-center w-8 h-8 ${getBackupStatusColor(backup?.status)} rounded-lg flex-shrink-0`}>
                <Icon 
                  name={getBackupStatusIcon(backup?.status)} 
                  size={16}
                  className={backup?.status === 'in_progress' ? 'animate-spin' : ''}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{backup?.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getBackupStatusColor(backup?.status)}`}>
                    {backup?.status?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon name="Calendar" size={12} />
                    {backup?.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="HardDrive" size={12} />
                    {backup?.size}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="FileText" size={12} />
                    {backup?.records} records
                  </span>
                </div>
              </div>
            </div>
            {backup?.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                iconName="RotateCcw"
                onClick={() => handleRestore(backup?.id)}
              >
                Restore
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={16} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium mb-1">Automated Backup Schedule</p>
            <p className="text-xs text-muted-foreground">
              Daily backups at 2:00 AM UTC. Retention period: 30 days. Critical data backed up every 6 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupStatus;