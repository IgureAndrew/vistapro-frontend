// src/components/MobileSearchEnhanced.jsx
import React, { useState } from 'react';
import { Search, X, Filter, SortAsc } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const MobileSearchEnhanced = ({
  placeholder = 'Search...',
  onSearch,
  onFilter,
  onSort,
  filters = [],
  sortOptions = [],
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortBy, setSortBy] = useState('');

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleFilterToggle = (filter) => {
    const newFilters = activeFilters.includes(filter)
      ? activeFilters.filter(f => f !== filter)
      : [...activeFilters, filter];
    
    setActiveFilters(newFilters);
    onFilter?.(newFilters);
  };

  const handleSort = (option) => {
    setSortBy(option);
    onSort?.(option);
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSortBy('');
    onFilter?.([]);
    onSort?.('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-4 py-3 text-base mobile-swipeable"
        />
        {searchTerm && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex items-center gap-2">
        {/* Filter Button */}
        {filters.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 touch-target"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        )}

        {/* Sort Button */}
        {sortOptions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const nextSort = sortOptions[(sortOptions.indexOf(sortBy) + 1) % sortOptions.length];
              handleSort(nextSort);
            }}
            className="flex items-center gap-2 touch-target"
          >
            <SortAsc className="w-4 h-4" />
            {sortBy || 'Sort'}
          </Button>
        )}

        {/* Clear Filters */}
        {(activeFilters.length > 0 || sortBy) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700 touch-target"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && filters.length > 0 && (
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="mobile-h6 text-gray-700 dark:text-gray-300">Filter by:</h4>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleFilterToggle(filter.value)}
                className={`px-3 py-1 rounded-full mobile-body-small font-medium transition-colors touch-target ${
                  activeFilters.includes(filter.value)
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {filters.find(f => f.value === filter)?.label || filter}
              <button
                onClick={() => handleFilterToggle(filter)}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileSearchEnhanced;
