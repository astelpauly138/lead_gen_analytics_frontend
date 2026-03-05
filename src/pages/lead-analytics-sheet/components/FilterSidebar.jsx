import { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { Checkbox } from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';

const FilterSidebar = ({ filters, onFilterChange, onClearFilters, isCollapsed, onToggle }) => {
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    source: true,
    quality: true,
    region: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev?.[section]
    }));
  };

  const statusOptions = [
    { value: 'new', label: 'New Leads', count: 1247 },
    { value: 'contacted', label: 'Contacted', count: 856 },
    { value: 'qualified', label: 'Qualified', count: 423 },
    { value: 'nurturing', label: 'Nurturing', count: 312 },
    { value: 'converted', label: 'Converted', count: 189 }
  ];

  const sourceOptions = [
    { value: 'linkedin', label: 'LinkedIn', count: 1523 },
    { value: 'website', label: 'Website', count: 892 },
    { value: 'referral', label: 'Referral', count: 456 },
    { value: 'event', label: 'Event', count: 234 },
    { value: 'cold_outreach', label: 'Cold Outreach', count: 922 }
  ];

  const qualityOptions = [
    { value: 'hot', label: 'Hot (90-100)', count: 234 },
    { value: 'warm', label: 'Warm (70-89)', count: 567 },
    { value: 'medium', label: 'Medium (50-69)', count: 891 },
    { value: 'cold', label: 'Cold (0-49)', count: 1335 }
  ];

  const regionOptions = [
    { value: 'north_america', label: 'North America', count: 1456 },
    { value: 'europe', label: 'Europe', count: 892 },
    { value: 'asia_pacific', label: 'Asia Pacific', count: 634 },
    { value: 'latin_america', label: 'Latin America', count: 312 },
    { value: 'middle_east', label: 'Middle East', count: 233 }
  ];

  const handleCheckboxChange = (category, value) => {
    const currentValues = filters?.[category] || [];
    const newValues = currentValues?.includes(value)
      ? currentValues?.filter(v => v !== value)
      : [...currentValues, value];
    onFilterChange(category, newValues);
  };

  const FilterSection = ({ title, options, category, icon }) => (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => toggleSection(category)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted transition-colors touch-target"
        aria-expanded={expandedSections?.[category]}
      >
        <div className="flex items-center gap-2">
          <Icon name={icon} size={16} />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <Icon
          name="ChevronDown"
          size={16}
          className={`transition-transform duration-250 ${
            expandedSections?.[category] ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      {expandedSections?.[category] && (
        <div className="px-4 pb-4 space-y-2 animate-fade-in">
          {options?.map(option => (
            <div key={option?.value} className="flex items-center justify-between">
              <Checkbox
                label={option?.label}
                checked={(filters?.[category] || [])?.includes(option?.value)}
                onChange={() => handleCheckboxChange(category, option?.value)}
                size="sm"
              />
              <span className="caption text-muted-foreground text-xs">
                {option?.count?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-4 top-24 z-50 flex items-center justify-center w-10 h-10 bg-card border border-border rounded-lg shadow-lg hover:bg-muted transition-all duration-250 lg:hidden touch-target"
        aria-label="Open filters"
      >
        <Icon name="Filter" size={20} />
      </button>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
        onClick={onToggle}
        aria-hidden="true"
      />
      
      <aside className="fixed left-0 top-0 bottom-0 w-80 bg-card border-r border-border z-50 lg:relative lg:w-full overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-card border-b border-border z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <Icon name="Filter" size={20} color="var(--color-primary)" />
              <h2 className="text-base font-semibold text-foreground">Filters</h2>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors touch-target"
              aria-label="Close filters"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
          
          <div className="px-4 pb-3">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              iconName="RotateCcw"
              iconPosition="left"
              onClick={onClearFilters}
            >
              Clear All Filters
            </Button>
          </div>
        </div>

        <div className="pb-4">
          <FilterSection
            title="Lead Status"
            options={statusOptions}
            category="status"
            icon="Target"
          />
          
          <FilterSection
            title="Lead Source"
            options={sourceOptions}
            category="source"
            icon="Share2"
          />
          
          <FilterSection
            title="Quality Score"
            options={qualityOptions}
            category="quality"
            icon="TrendingUp"
          />
          
          <FilterSection
            title="Geographic Region"
            options={regionOptions}
            category="region"
            icon="Globe"
          />
        </div>
      </aside>
    </>
  );
};

export default FilterSidebar;