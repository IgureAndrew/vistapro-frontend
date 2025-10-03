import React from 'react';
import { 
  Home, 
  User, 
  Users, 
  FileText, 
  TrendingUp, 
  Package, 
  CheckCircle, 
  ShoppingCart, 
  ClipboardList, 
  Wallet,
  BarChart3,
  Target,
  Activity,
  Settings
} from 'lucide-react';

const MobileBottomNavigation = ({ 
  userRole, 
  activeModule, 
  setActiveModule, 
  isDarkMode = false,
  onMoreClick
}) => {
  // Define navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { key: 'overview', label: 'Overview', icon: Home },
    ];

    switch (userRole) {
      case 'masteradmin':
        return [
          ...baseItems,
          { key: 'users', label: 'Users', icon: Users },
          { key: 'manage-orders', label: 'Orders', icon: ShoppingCart },
          { key: 'performance', label: 'Reports', icon: BarChart3 },
          { key: 'more', label: 'More', icon: Settings, isMore: true },
        ];
      
      case 'superadmin':
        return [
          ...baseItems,
          { key: 'team-management', label: 'Team', icon: Users },
          { key: 'stock-pickups', label: 'Stock', icon: Package },
          { key: 'performance', label: 'Reports', icon: BarChart3 },
          { key: 'more', label: 'More', icon: Settings, isMore: true },
        ];
      
      case 'admin':
        return [
          ...baseItems,
          { key: 'team-management', label: 'Team', icon: Users },
          { key: 'stock-pickups', label: 'Stock', icon: Package },
          { key: 'performance', label: 'Reports', icon: BarChart3 },
          { key: 'more', label: 'More', icon: Settings, isMore: true },
        ];
      
      case 'marketer':
        return [
          ...baseItems,
          { key: 'order', label: 'Orders', icon: ShoppingCart },
          { key: 'stock-pickup', label: 'Stock Pickup', icon: Package },
          { key: 'more', label: 'More', icon: Settings, isMore: true },
        ];
      
      case 'dealer':
        return [
          ...baseItems,
          { key: 'orders', label: 'Orders', icon: ShoppingCart },
          { key: 'stock', label: 'Stock', icon: Package },
          { key: 'more', label: 'More', icon: Settings, isMore: true },
        ];
      
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg z-40">
      <div className="flex items-center justify-around px-4 py-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.key;
          
          return (
            <button
              key={item.key}
              className={`flex flex-col items-center space-y-1 p-2 min-h-[48px] transition-all duration-200 ease-out hover:scale-105 active:scale-95 hover:bg-orange-50 rounded-xl touch-manipulation ${
                isActive ? 'bg-orange-50' : ''
              }`}
              onClick={() => item.isMore ? onMoreClick() : setActiveModule(item.key)}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 ${
                isActive 
                  ? 'bg-[#f59e0b] shadow-lg' 
                  : 'bg-black/5 hover:bg-orange-100'
              }`}>
                <Icon className={`w-4 h-4 transition-colors duration-200 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-black/60'
                }`} />
              </div>
              <span className={`text-xs font-medium transition-colors duration-200 ${
                isActive 
                  ? 'text-[#f59e0b] font-semibold' 
                  : 'text-black/60'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNavigation;
