import { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const BUCKET_ORDER = ['7d', '30d', '90d', '1y'];

// Filter campaigns by all dimensions EXCEPT the one being built (so each filter
// only narrows based on what's selected in the *other* filters).
const filterExcluding = (campaigns, filters, excludeKey) => {
  return campaigns.filter(c => {
    if (excludeKey !== 'category' && filters.category && c.industry !== filters.category) return false;
    if (excludeKey !== 'city'     && filters.city     && c.city     !== filters.city)     return false;
    if (excludeKey !== 'country'  && filters.country  && c.country  !== filters.country)  return false;
    if (excludeKey !== 'dateRange' && filters.dateRange) {
      const selIdx = BUCKET_ORDER.indexOf(filters.dateRange);
      const camIdx = BUCKET_ORDER.indexOf(c.campaign_age_bucket);
      if (camIdx === -1 || camIdx > selIdx) return false;
    }
    return true;
  });
};

const unique = (list) => Array.from(new Set(list.filter(Boolean)));

const FilterPanel = ({ campaigns = [], filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Each filter's options are built from campaigns matching all OTHER active filters.
  const forCategory  = filterExcluding(campaigns, filters, 'category');
  const forCity      = filterExcluding(campaigns, filters, 'city');
  const forCountry   = filterExcluding(campaigns, filters, 'country');
  const forDateRange = filterExcluding(campaigns, filters, 'dateRange');

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...unique(forCategory.map(c => c.industry)).map(v => ({ value: v, label: v }))
  ];

  const cityOptions = [
    { value: '', label: 'All Cities' },
    ...unique(forCity.map(c => c.city)).map(v => ({ value: v, label: v }))
  ];

  const countryOptions = [
    { value: '', label: 'All Countries' },
    ...unique(forCountry.map(c => c.country)).map(v => ({ value: v, label: v }))
  ];

  // Date range: only show options that have at least one qualifying campaign
  // after the other three filters are applied.
  const bucketsInScope = new Set(forDateRange.map(c => c.campaign_age_bucket).filter(Boolean));
  const allDateOptions = [
    { value: '',    label: 'All' },
    { value: '7d',  label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y',  label: 'Last Year' }
  ];
  const dateRangeOptions = allDateOptions.filter(opt => {
    if (opt.value === '') return true;
    const selIdx = BUCKET_ORDER.indexOf(opt.value);
    // option is available if any campaign in scope qualifies for this range
    return BUCKET_ORDER.slice(0, selIdx + 1).some(b => bucketsInScope.has(b));
  });

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFilterChange({ category: '', city: '', country: '', dateRange: '' });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <Icon name="Filter" size={20} color="var(--color-primary)" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-foreground">Advanced Filters</h2>
            {activeFilterCount > 0 && (
              <p className="caption text-primary text-xs mt-0.5">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-all duration-250 touch-target"
        >
          <span className="text-sm font-medium text-foreground hidden md:inline">
            {isExpanded ? 'Collapse' : 'Expand'}
          </span>
          <Icon
            name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
            size={16}
            className="transition-transform duration-250"
          />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Campaign Category"
              options={categoryOptions}
              value={filters.category}
              onChange={(value) => handleChange('category', value)}
            />

            <Select
              label="City"
              options={cityOptions}
              value={filters.city}
              onChange={(value) => handleChange('city', value)}
            />

            <Select
              label="Country"
              options={countryOptions}
              value={filters.country}
              onChange={(value) => handleChange('country', value)}
            />

            <Select
              label="Date Range"
              options={dateRangeOptions}
              value={filters.dateRange}
              onChange={(value) => handleChange('dateRange', value)}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="caption text-muted-foreground text-sm">
              Showing results for selected filters
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                iconName="RotateCcw"
                iconPosition="left"
              >
                Reset Filters
              </Button>
              <Button
                variant="default"
                size="sm"
                iconName="Download"
                iconPosition="left"
              >
                Export Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
