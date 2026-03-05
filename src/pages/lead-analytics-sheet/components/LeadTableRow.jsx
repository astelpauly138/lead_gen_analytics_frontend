import { useState } from 'react';
import Icon from '../../../components/AppIcon';

const LeadTableRow = ({ lead, isSelected, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    const colors = {
      new: 'bg-primary/10 text-primary',
      contacted: 'bg-warning/10 text-warning',
      qualified: 'bg-success/10 text-success',
      nurturing: 'bg-secondary/10 text-secondary',
      converted: 'bg-success/20 text-success',
      approved: 'bg-success/10 text-success',
      pending: 'bg-warning/10 text-warning',
      rejected: 'bg-error/10 text-error'
    };
    return colors[s] || 'bg-muted text-muted-foreground';
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
  const statusLabel = lead?.event_type
    ? lead.event_type.charAt(0).toUpperCase() + lead.event_type.slice(1)
    : '—';

  return (
    <>
      <tr className="border-b border-border hover:bg-muted/50 transition-colors">
        {/* Checkbox */}
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(lead?.id)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
            aria-label={`Select ${lead?.name}`}
          />
        </td>

        {/* Contact Name + Position */}
        <td className="px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {lead?.name || '—'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{lead?.position || '—'}</p>
          </div>
        </td>

        {/* Company + Category */}
        <td className="px-4 py-3">
          <p className="text-sm text-foreground truncate">{lead?.company || '—'}</p>
          <p className="text-xs text-muted-foreground truncate">{lead?.category || '—'}</p>
        </td>

        {/* Email */}
        <td className="px-4 py-3">
          <p className="text-sm text-foreground truncate">{lead?.email || '—'}</p>
        </td>

        {/* Phone */}
        <td className="px-4 py-3">
          <p className="text-sm text-foreground whitespace-nowrap">
            {lead?.phone || '—'}
          </p>
        </td>

        {/* Status — from DB column "event_type" */}
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(lead?.event_type)}`}
          >
            {statusLabel}
          </span>
        </td>

        {/* Last Contacted */}
        <td className="px-4 py-3">
          <p className="text-sm text-foreground whitespace-nowrap">{lastContacted}</p>
        </td>

        {/* Actions — chevron that expands the detail row below */}
        <td className="px-4 py-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors touch-target"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} />
          </button>
        </td>
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr className="bg-muted/30 border-b border-border animate-fade-in">
          <td colSpan="8" className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Address</p>
                <p className="text-sm text-foreground">{lead?.address || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Location</p>
                <p className="text-sm text-foreground">{lead?.location || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Company Website</p>
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
          </td>
        </tr>
      )}
    </>
  );
};

export default LeadTableRow;
