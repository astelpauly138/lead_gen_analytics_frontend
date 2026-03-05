import { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const FilterSelect = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer min-w-[130px]"
    >
      <option value="">All {label}s</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const SearchBar = ({
  searchTerm = '',
  onSearchChange,
  nameSuggestions = [],
  industryOptions = [],
  locationOptions = [],
  companyOptions = [],
  positionOptions = [],
  statusOptions = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  const hasActiveFiltersOrSearch =
    searchTerm || Object.values(activeFilters).some((v) => v);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-5 space-y-4">
      {/* Search with autocomplete */}
      <div className="relative" ref={containerRef}>
        <Icon
          name="Search"
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            if (searchTerm) setShowSuggestions(true);
          }}
          placeholder="Search leads by name…"
          className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => {
              onSearchChange('');
              setShowSuggestions(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <Icon name="X" size={16} />
          </button>
        )}

        {/* Autocomplete dropdown */}
        {showSuggestions && nameSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            {nameSuggestions.map((name) => (
              <button
                key={name}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSearchChange(name);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Icon name="User" size={14} className="text-muted-foreground flex-shrink-0" />
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 items-end">
        <FilterSelect
          label="Industry"
          value={activeFilters.industry}
          options={industryOptions}
          onChange={(v) => onFilterChange('industry', v)}
        />
        <FilterSelect
          label="Location"
          value={activeFilters.location}
          options={locationOptions}
          onChange={(v) => onFilterChange('location', v)}
        />
        <FilterSelect
          label="Company"
          value={activeFilters.company}
          options={companyOptions}
          onChange={(v) => onFilterChange('company', v)}
        />
        <FilterSelect
          label="Position"
          value={activeFilters.position}
          options={positionOptions}
          onChange={(v) => onFilterChange('position', v)}
        />
        <FilterSelect
          label="Status"
          value={activeFilters.status}
          options={statusOptions}
          onChange={(v) => onFilterChange('status', v)}
        />
        {hasActiveFiltersOrSearch && (
          <div className="flex flex-col justify-end">
            <button
              onClick={onClearFilters}
              className="h-10 px-4 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors whitespace-nowrap"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
