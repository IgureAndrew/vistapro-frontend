// src/components/MobileGrid.jsx
import React from 'react';

const MobileGrid = ({ 
  children, 
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className = ""
}) => {
  const getGridClasses = () => {
    // Use mobile design system classes
    const baseClasses = 'mobile-grid';
    
    // Mobile: 1 column (default)
    const mobileClasses = 'mobile-grid-1';
    
    // Tablet: 2 columns (md breakpoint)
    const tabletClasses = columns.tablet > 1 ? 'md:mobile-grid-2' : '';
    
    // Desktop: 3+ columns (lg breakpoint)
    const desktopClasses = columns.desktop > 2 ? 'lg:mobile-grid-3' : '';
    const xlClasses = columns.desktop > 3 ? 'xl:mobile-grid-4' : '';
    
    return `${baseClasses} ${mobileClasses} ${tabletClasses} ${desktopClasses} ${xlClasses}`;
  };

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {children}
    </div>
  );
};

// Specialized grid components for common layouts
export const StatsGrid = ({ children, className = "" }) => (
  <MobileGrid 
    columns={{ mobile: 1, tablet: 2, desktop: 4 }} 
    gap={4}
    className={className}
  >
    {children}
  </MobileGrid>
);

export const CardsGrid = ({ children, className = "" }) => (
  <MobileGrid 
    columns={{ mobile: 1, tablet: 2, desktop: 3 }} 
    gap={6}
    className={className}
  >
    {children}
  </MobileGrid>
);

export const ListGrid = ({ children, className = "" }) => (
  <MobileGrid 
    columns={{ mobile: 1, tablet: 1, desktop: 2 }} 
    gap={4}
    className={className}
  >
    {children}
  </MobileGrid>
);

export default MobileGrid;
