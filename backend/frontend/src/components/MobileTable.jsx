// src/components/MobileTable.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const MobileTable = ({ 
  data = [], 
  columns = [], 
  onRowClick,
  actions = [],
  className = "",
  cardTitle = "Data",
  emptyMessage = "No data available"
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleRow = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const formatValue = (value, column) => {
    if (column.type === 'currency') {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        notation: 'compact'
      }).format(value || 0);
    }
    
    if (column.type === 'date') {
      return new Date(value).toLocaleDateString();
    }
    
    if (column.type === 'badge') {
      return (
        <Badge 
          variant={value === 'active' || value === 'approved' ? 'default' : 'secondary'}
          className={value === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
        >
          {value}
        </Badge>
      );
    }
    
    if (column.type === 'status') {
      const statusColors = {
        'active': 'bg-green-100 text-green-800',
        'inactive': 'bg-gray-100 text-gray-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800',
        'sold': 'bg-green-100 text-green-800',
        'expired': 'bg-red-100 text-red-800'
      };
      
      return (
        <Badge className={statusColors[value] || 'bg-gray-100 text-gray-800'}>
          {value}
        </Badge>
      );
    }
    
    return value || '-';
  };

  // Desktop Table View
  const DesktopTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
            {actions.length > 0 && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => onRowClick?.(row, rowIndex)}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {formatValue(row[column.key], column)}
                </td>
              ))}
              {actions.length > 0 && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick(row, rowIndex);
                        }}
                        className="p-1 h-8 w-8"
                      >
                        <action.icon className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Mobile Card View
  const MobileCards = () => (
    <div className="space-y-4">
      {data.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        data.map((row, rowIndex) => (
          <Card 
            key={rowIndex} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onRowClick?.(row, rowIndex)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {cardTitle} #{rowIndex + 1}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {actions.length > 0 && (
                    <div className="flex space-x-1">
                      {actions.slice(0, 2).map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row, rowIndex);
                          }}
                          className="p-1 h-8 w-8"
                        >
                          <action.icon className="h-4 w-4" />
                        </Button>
                      ))}
                      {actions.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(rowIndex);
                          }}
                          className="p-1 h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRow(rowIndex);
                    }}
                    className="p-1 h-8 w-8"
                  >
                    {expandedRows.has(rowIndex) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Primary Information - Always Visible */}
              <div className="space-y-2">
                {columns.slice(0, 3).map((column, colIndex) => (
                  <div key={colIndex} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {column.label}:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {formatValue(row[column.key], column)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Expanded Information */}
              {expandedRows.has(rowIndex) && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    {columns.slice(3).map((column, colIndex) => (
                      <div key={colIndex} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {column.label}:
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatValue(row[column.key], column)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Additional Actions */}
                  {actions.length > 2 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex space-x-2">
                        {actions.slice(2).map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row, rowIndex);
                            }}
                            className="flex-1"
                          >
                            <action.icon className="h-4 w-4 mr-2" />
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className={className}>
      {isMobile ? <MobileCards /> : <DesktopTable />}
    </div>
  );
};

export default MobileTable;
