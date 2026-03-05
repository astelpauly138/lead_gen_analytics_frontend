import { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const ActivityFeed = ({ activities = [] }) => {

  // Keeps a ticking state so the component re-renders every minute
  // and the relative timestamps update for all activities.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const formatTimestamp = (date) => {
    const then = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      success: { bg: 'bg-success/10', text: 'text-success', label: 'Success' },
      warning: { bg: 'bg-warning/10', text: 'text-warning', label: 'Warning' },
      error: { bg: 'bg-error/10', text: 'text-error', label: 'Error' },
      info: { bg: 'bg-primary/10', text: 'text-primary', label: 'Info' }
    };

    const badge = badges?.[status] || badges?.info;

    return (
      <span className={`${badge?.bg} ${badge?.text} text-xs px-2 py-1 rounded-full font-medium`}>
        {badge?.label}
      </span>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-success/20 rounded-lg">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-foreground">Activity Feed</h2>
            <p className="caption text-muted-foreground text-xs md:text-sm">Real-time system updates</p>
          </div>
        </div>
      </div>

      {activities?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-4">
            <Icon name="Inbox" size={32} color="var(--color-muted-foreground)" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">No activities yet</p>
          <p className="caption text-xs text-muted-foreground">Start lead scraping to see activity logs</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto pr-2 scroll-smooth" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-border) transparent'
        }}>
          {activities?.map((activity, index) => (
            <div
              key={activity?.id}
              className="flex gap-4 p-3 md:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-all duration-250 animate-stagger"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${activity?.color}20` }}
              >
                <Icon name={activity?.icon} size={18} color={activity?.color} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm md:text-base font-medium text-foreground truncate">
                    {activity?.title}
                  </h3>
                  {getStatusBadge(activity?.status)}
                </div>

                <p className="caption text-muted-foreground text-xs md:text-sm mb-2 line-clamp-2">
                  {activity?.description}
                </p>

                <div className="flex items-center gap-2">
                  <Icon name="Clock" size={12} color="var(--color-muted-foreground)" />
                  <span className="caption text-muted-foreground text-xs">
                    {formatTimestamp(activity?.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;