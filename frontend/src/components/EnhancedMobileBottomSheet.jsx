import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Home, 
  ShoppingCart, 
  User, 
  MessageSquare, 
  CheckCircle, 
  Package, 
  Wallet as WalletIcon, 
  BarChart2, 
  Settings, 
  LogOut, 
  Users, 
  ClipboardList, 
  Target, 
  UserPlus, 
  Activity, 
  Shield,
  Search,
  Star,
  StarOff,
  Bell,
  TrendingUp,
  FileText,
  DollarSign,
  Eye,
  Download,
  Plus,
  Filter,
  ChevronRight,
  Clock,
  AlertCircle
} from 'lucide-react';

const EnhancedMobileBottomSheet = ({ 
  isOpen, 
  onClose, 
  user, 
  activeModule, 
  setActiveModule, 
  handleLogout, 
  userRole 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(() => {
    // Load favorites from localStorage
    const saved = localStorage.getItem(`favorites_${userRole}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  // Swipe gesture handling
  const sheetRef = useRef(null);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Handle touch start
  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
    setIsDragging(true);
  };

  // Handle touch move
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    const threshold = 100; // Minimum swipe distance
    
    if (deltaY > threshold) {
      onClose(); // Swipe down to close
    }
    
    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  // Add keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Define all menu items with categories and metadata
  const getAllMenuItems = (role) => {
    const baseItems = [
      { key: 'overview', label: 'Overview', icon: Home, category: 'main', description: 'Dashboard overview' },
      { key: 'wallet', label: 'Wallet', icon: WalletIcon, category: 'main', description: 'View earnings and balance' },
    ];

    switch (role) {
      case 'masteradmin':
        return [
          ...baseItems,
          { key: 'users', label: 'Users', icon: Users, category: 'management', description: 'Manage all users', badge: 'admin' },
          { key: 'manage-orders', label: 'Orders', icon: ClipboardList, category: 'management', description: 'Order management' },
          { key: 'stock', label: 'Stock', icon: Package, category: 'management', description: 'Inventory management' },
          { key: 'verification', label: 'Verification', icon: CheckCircle, category: 'management', description: 'User verification' },
          { key: 'performance', label: 'Analytics', icon: BarChart2, category: 'analytics', description: 'System analytics' },
          { key: 'target-management', label: 'Targets', icon: Target, category: 'management', description: 'Target management' },
          { key: 'user-assignments', label: 'Assignments', icon: UserPlus, category: 'management', description: 'User assignments' },
          { key: 'stock-update', label: 'Stock Update', icon: Activity, category: 'management', description: 'Update inventory' },
          { key: 'submissions', label: 'Submissions', icon: Shield, category: 'management', description: 'View submissions' },
          { key: 'messages', label: 'Messages', icon: MessageSquare, category: 'communication', description: 'System messages' },
          { key: 'account', label: 'Account', icon: User, category: 'settings', description: 'Account settings' },
        ];
      
      case 'superadmin':
        return [
          ...baseItems,
          { key: 'stock', label: 'Stock', icon: Package, category: 'operations', description: 'Stock management' },
          { key: 'manage-orders', label: 'Orders', icon: ClipboardList, category: 'operations', description: 'Order management' },
          { key: 'messages', label: 'Messages', icon: MessageSquare, category: 'communication', description: 'Team messages' },
          { key: 'verification', label: 'Verification', icon: CheckCircle, category: 'operations', description: 'Verification process' },
          { key: 'assigned', label: 'Team', icon: UserPlus, category: 'team', description: 'Manage assigned admins' },
          { key: 'performance', label: 'Analytics', icon: BarChart2, category: 'analytics', description: 'Team performance' },
          { key: 'account', label: 'Account', icon: User, category: 'settings', description: 'Account settings' },
        ];
      
      case 'admin':
        return [
          ...baseItems,
          { key: 'stock', label: 'Stock', icon: Package, category: 'operations', description: 'Stock management' },
          { key: 'manage-orders', label: 'Orders', icon: ClipboardList, category: 'operations', description: 'Order management' },
          { key: 'messages', label: 'Messages', icon: MessageSquare, category: 'communication', description: 'Team messages' },
          { key: 'verification', label: 'Verification', icon: CheckCircle, category: 'operations', description: 'Verification process' },
          { key: 'performance', label: 'Analytics', icon: BarChart2, category: 'analytics', description: 'Team performance' },
          { key: 'assigned', label: 'Team', icon: UserPlus, category: 'team', description: 'Manage assigned marketers' },
          { key: 'account', label: 'Account', icon: User, category: 'settings', description: 'Account settings' },
        ];
      
      case 'marketer':
        return [
          ...baseItems,
          { key: 'stock-pickup', label: 'Stock Pickup', icon: Package, category: 'sales', description: 'Pick up stock items' },
          { key: 'orders', label: 'Orders', icon: ShoppingCart, category: 'sales', description: 'Manage orders' },
          { key: 'verification', label: 'Verification', icon: CheckCircle, category: 'operations', description: 'Complete verification' },
          { key: 'messages', label: 'Messages', icon: MessageSquare, category: 'communication', description: 'Team messages' },
          { key: 'performance', label: 'Performance', icon: BarChart2, category: 'analytics', description: 'View performance metrics' },
          { key: 'account', label: 'Account', icon: User, category: 'settings', description: 'Account settings' },
        ];
      
      case 'dealer':
        return [
          ...baseItems,
          { key: 'orders', label: 'Orders', icon: ShoppingCart, category: 'sales', description: 'Manage orders' },
          { key: 'stock', label: 'Stock', icon: Package, category: 'operations', description: 'Stock management' },
          { key: 'verification', label: 'Verification', icon: CheckCircle, category: 'operations', description: 'Complete verification' },
          { key: 'messages', label: 'Messages', icon: MessageSquare, category: 'communication', description: 'Team messages' },
          { key: 'performance', label: 'Performance', icon: BarChart2, category: 'analytics', description: 'View performance metrics' },
          { key: 'account', label: 'Account', icon: User, category: 'settings', description: 'Account settings' },
        ];
      
      default:
        return baseItems;
    }
  };

  const allMenuItems = getAllMenuItems(userRole);

  // Filter menu items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allMenuItems;
    
    const query = searchQuery.toLowerCase();
    return allMenuItems.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [allMenuItems, searchQuery]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Get favorites items
  const favoriteItems = useMemo(() => {
    return allMenuItems.filter(item => favorites.includes(item.key));
  }, [allMenuItems, favorites]);

  // Toggle favorite
  const toggleFavorite = (itemKey) => {
    const newFavorites = favorites.includes(itemKey)
      ? favorites.filter(key => key !== itemKey)
      : [...favorites, itemKey];
    
    setFavorites(newFavorites);
    localStorage.setItem(`favorites_${userRole}`, JSON.stringify(newFavorites));
  };

  // Handle item click
  const handleItemClick = (key) => {
    setActiveModule(key);
    onClose();
  };

  // Category labels
  const categoryLabels = {
    main: 'Main',
    management: 'Management',
    operations: 'Operations',
    sales: 'Sales',
    analytics: 'Analytics',
    team: 'Team',
    communication: 'Communication',
    settings: 'Settings'
  };

  // Get role display info
  const getRoleInfo = (role) => {
    const roleMap = {
      masteradmin: { label: 'Master Admin', color: 'bg-red-500' },
      superadmin: { label: 'Super Admin', color: 'bg-purple-500' },
      admin: { label: 'Admin', color: 'bg-blue-500' },
      marketer: { label: 'Marketer', color: 'bg-green-500' },
      dealer: { label: 'Dealer', color: 'bg-orange-500' }
    };
    return roleMap[role] || { label: 'User', color: 'bg-gray-500' };
  };

  const roleInfo = getRoleInfo(userRole);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Enhanced Bottom Sheet */}
      <div 
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out max-h-[85vh] flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isDragging ? `translateY(${Math.max(0, currentY - startY)}px)` : 'translateY(0)',
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Header */}
        <div className="px-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${roleInfo.color} rounded-2xl flex items-center justify-center`}>
                <span className="text-white text-lg font-bold">
                  {userRole === 'masteradmin' ? 'M' : 
                   userRole === 'superadmin' ? 'S' : 
                   userRole === 'admin' ? 'A' : 
                   userRole === 'marketer' ? 'M' : 
                   userRole === 'dealer' ? 'D' : 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-black capitalize">
                  {roleInfo.label} Dashboard
                </h3>
                <p className="text-sm text-gray-600">
                  ID: {user?.unique_id || 'N/A'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Favorites Section */}
          {favoriteItems.length > 0 && !searchQuery && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <h4 className="text-sm font-semibold text-gray-700">Favorites</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {favoriteItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.key;
                  
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleItemClick(item.key)}
                      className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-[#f59e0b] text-white shadow-lg' 
                          : 'bg-yellow-50 text-gray-700 hover:bg-yellow-100'
                      }`}
                    >
                      <Icon className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categorized Menu Items */}
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-2 h-2 bg-[#f59e0b] rounded-full"></div>
                <h4 className="text-sm font-semibold text-gray-700">
                  {categoryLabels[category] || category}
                </h4>
              </div>
              <div className="space-y-2">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.key;
                  const isFavorite = favorites.includes(item.key);
                  
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleItemClick(item.key)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-[#f59e0b] text-white' 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-6 h-6" />
                        <div className="text-left">
                          <div className="font-medium">{item.label}</div>
                          <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.badge && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                            {item.badge}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.key);
                          }}
                          className="p-1 rounded-full hover:bg-white/20 transition-colors"
                        >
                          {isFavorite ? (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Logout Button */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default EnhancedMobileBottomSheet;
