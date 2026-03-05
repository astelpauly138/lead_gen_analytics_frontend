import { useState } from 'react';
import Icon from '../../../components/AppIcon';

const MobileLeadCard = ({ lead, isSelected, onSelect }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    const colors = {
      new: 'bg-primary/10 text-primary border-primary/20',
      contacted: 'bg-warning/10 text-warning border-warning/20',
      qualified: 'bg-success/10 text-success border-success/20',
      nurturing: 'bg-secondary/10 text-secondary border-secondary/20',
      converted: 'bg-success/20 text-success border-success/30',
      approved: 'bg-success/10 text-success border-success/20',
      pending: 'bg-warning/10 text-warning border-warning/20',
      rejected: 'bg-error/10 text-error border-error/20'
    };
    return colors[s] || 'bg-muted text-muted-foreground border-border';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const lastContacted = formatDate(lead?.last_contacted || lead?.updated_at || lead?.created_at);
  const statusLabel =
    lead?.event_type
      ? lead.event_type.charAt(0).toUpperCase() + lead.event_type.slice(1)
      : '—';

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
      <div className="p-4">
        {/* Header row: checkbox + name/position/status */}
        <div className="flex items-start gap-3 mb-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(lead?.id)}
            className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer flex-shrink-0"
            aria-label={`Select ${lead?.name}`}
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate mb-0.5">
              {lead?.name || '—'}
            </h3>
            <p className="text-xs text-muted-foreground truncate mb-2">
              {lead?.position || '—'}
            </p>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(lead?.event_type)}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Company + Category */}
        <div className="mb-3">
          <p className="text-sm font-medium text-foreground truncate">{lead?.company || '—'}</p>
          <p className="text-xs text-muted-foreground truncate">{lead?.category || '—'}</p>
        </div>

        {/* Contact info */}
        <div className="space-y-1.5 mb-3">
          {lead?.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name="Mail" size={14} className="flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead?.phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name="Phone" size={14} className="flex-shrink-0" />
              <span>{lead.phone}</span>
            </div>
          )}
        </div>

        {/* Footer: last contacted + actions toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Icon name="Clock" size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{lastContacted}</span>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground border border-border rounded-lg hover:bg-muted transition-colors touch-target"
            aria-label="Toggle lead details"
          >
            Actions
            <Icon name={showDetails ? 'ChevronUp' : 'ChevronDown'} size={14} />
          </button>
        </div>
      </div>

      {/* Expandable details: address, location, website */}
      {showDetails && (
        <div className="px-4 pb-4 pt-3 bg-muted/30 border-t border-border space-y-3 animate-fade-in">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Lead Details
          </p>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Address</p>
              <p className="text-sm text-foreground">{lead?.address || 'N/A'}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Location</p>
              <p className="text-sm text-foreground">{lead?.location || 'N/A'}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Company Website</p>
              {lead?.website ? (
                <a
                  href={
                    lead.website.startsWith('http') ? lead.website : `https://${lead.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 break-all"
                >
                  {lead.website}
                  <Icon name="ExternalLink" size={12} className="flex-shrink-0" />
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">N/A</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileLeadCard;
