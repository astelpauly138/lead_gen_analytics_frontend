import Icon from '../../../components/AppIcon';

const LeadTableHeader = ({ sortConfig, onSort, onSelectAll, selectedCount, totalCount }) => {
  const columns = [
    { key: 'name', label: 'Contact Name', sortable: true, width: 'min-w-[180px]' },
    { key: 'company', label: 'Company', sortable: true, width: 'min-w-[160px]' },
    { key: 'email', label: 'Email', sortable: true, width: 'min-w-[180px]' },
    { key: 'phone', label: 'Phone', sortable: false, width: 'min-w-[130px]' },
    { key: 'event_type', label: 'Status', sortable: true, width: 'min-w-[110px]' },
    { key: 'last_contacted', label: 'Last Contacted', sortable: true, width: 'min-w-[130px]' },
    { key: 'actions', label: 'Actions', sortable: false, width: 'min-w-[90px]' }
  ];

  const handleSort = (key) => {
    if (!columns.find((col) => col.key === key)?.sortable) return;
    const direction =
      sortConfig?.key === key && sortConfig?.direction === 'asc' ? 'desc' : 'asc';
    onSort({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return 'ChevronsUpDown';
    return sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown';
  };

  return (
    <thead className="bg-muted sticky top-0 z-10">
      <tr>
        <th className="px-4 py-3 text-left w-12">
          <input
            type="checkbox"
            checked={selectedCount === totalCount && totalCount > 0}
            onChange={onSelectAll}
            className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
            aria-label="Select all leads"
          />
        </th>

        {columns.map((column) => (
          <th key={column.key} className={`px-4 py-3 text-left ${column.width}`}>
            {column.sortable ? (
              <button
                onClick={() => handleSort(column.key)}
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors touch-target"
              >
                {column.label}
                <Icon
                  name={getSortIcon(column.key)}
                  size={16}
                  color={
                    sortConfig?.key === column.key ? 'var(--color-primary)' : 'currentColor'
                  }
                />
              </button>
            ) : (
              <span className="text-sm font-medium text-foreground">{column.label}</span>
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default LeadTableHeader;
