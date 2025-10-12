// src/components/MobileSearch.jsx
import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

const MobileSearch = ({
  placeholder = "Search...",
  onSearch,
  onFilterChange,
  filters = [],
  showFilters = true,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...activeFilters, [filterKey]: value };
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilter = (filterKey) => {
    const newFilters = { ...activeFilters };
    delete newFilters[filterKey];
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onFilterChange?.({});
  };

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).length;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-4 py-2"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSearch('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Section */}
      {showFilters && filters.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {getActiveFilterCount()}
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilterPanel ? 'rotate-180' : ''}`} />
            </Button>
            
            {getActiveFilterCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {filters.map((filter) => (
                    <div key={filter.key}>
                      <label className="block mobile-h6 text-gray-700 dark:text-gray-300 mb-2">
                        {filter.label}
                      </label>
                      
                      {filter.type === 'select' && (
                        <select
                          value={activeFilters[filter.key] || ''}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 mobile-input-text"
                        >
                          <option value="">All {filter.label}</option>
                          {filter.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {filter.type === 'checkbox' && (
                        <div className="space-y-2">
                          {filter.options.map((option) => (
                            <label key={option.value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={activeFilters[filter.key]?.includes(option.value) || false}
                                onChange={(e) => {
                                  const currentValues = activeFilters[filter.key] || [];
                                  const newValues = e.target.checked
                                    ? [...currentValues, option.value]
                                    : currentValues.filter(v => v !== option.value);
                                  handleFilterChange(filter.key, newValues);
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="mobile-body-small text-gray-700 dark:text-gray-300">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {filter.type === 'date' && (
                        <input
                          type="date"
                          value={activeFilters[filter.key] || ''}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 mobile-input-text"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Filters */}
          {getActiveFilterCount() > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(activeFilters).map(([key, value]) => {
                const filter = filters.find(f => f.key === key);
                if (!filter) return null;
                
                const getFilterLabel = (val) => {
                  if (Array.isArray(val)) {
                    return val.map(v => filter.options.find(o => o.value === v)?.label || v).join(', ');
                  }
                  return filter.options.find(o => o.value === val)?.label || val;
                };
                
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <span>{filter.label}: {getFilterLabel(value)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearFilter(key)}
                      className="p-0 h-4 w-4 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileSearch;
