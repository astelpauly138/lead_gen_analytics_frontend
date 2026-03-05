import { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';

const SystemLogViewer = ({ logs }) => {
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'api', label: 'API Calls' },
    { value: 'webhook', label: 'Webhooks' },
    { value: 'sync', label: 'Data Sync' },
    { value: 'error', label: 'Errors' }
  ];

  const severityOptions = [
    { value: 'all', label: 'All Severity' },
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
    { value: 'critical', label: 'Critical' }
  ];

  const filteredLogs = logs?.filter(log => {
    const typeMatch = filterType === 'all' || log?.type === filterType;
    const severityMatch = filterSeverity === 'all' || log?.severity === filterSeverity;
    return typeMatch && severityMatch;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'info':
        return 'text-primary bg-primary/10';
      case 'warning':
        return 'text-warning bg-warning/10';
      case 'error':
        return 'text-error bg-error/10';
      case 'critical':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-muted bg-muted/10';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'info':
        return 'Info';
      case 'warning':
        return 'AlertTriangle';
      case 'error':
        return 'XCircle';
      case 'critical':
        return 'AlertOctagon';
      default:
        return 'Circle';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <Icon name="FileText" size={20} color="var(--color-primary)" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-foreground">System Logs</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-full">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-xs font-medium">Live</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Select
          label="Filter by Type"
          options={typeOptions}
          value={filterType}
          onChange={setFilterType}
        />
        <Select
          label="Filter by Severity"
          options={severityOptions}
          value={filterSeverity}
          onChange={setFilterSeverity}
        />
      </div>
      <div className="space-y-2">
        {filteredLogs?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="Inbox" size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No logs match the selected filters</p>
          </div>
        ) : (
          filteredLogs?.map((log) => (
            <div
              key={log?.id}
              className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={`flex items-center justify-center w-8 h-8 ${getSeverityColor(log?.severity)} rounded-lg flex-shrink-0`}>
                <Icon name={getSeverityIcon(log?.severity)} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground uppercase">{log?.type}</span>
                  <span className="text-xs text-muted-foreground">{log?.timestamp}</span>
                </div>
                <p className="text-sm text-foreground line-clamp-2">{log?.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SystemLogViewer;