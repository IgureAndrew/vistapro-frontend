import React from 'react';
import { X, Home, ShoppingCart, User, MessageSquare, CheckCircle, Package, Wallet as WalletIcon, BarChart2, Settings, LogOut, Users, ClipboardList, Target, UserPlus, Activity, Shield } from 'lucide-react';

const MobileBottomSheet = ({ isOpen, onClose, user, activeModule, setActiveModule, handleLogout, userRole }) => {
  if (!isOpen) return null;

  const getMenuItems = (role) => {
    const baseItems = [
      { key: 'overview', label: 'Overview', icon: Home },
      { key: 'wallet', label: 'Wallet', icon: WalletIcon },
    ];

    switch (role) {
      case 'masteradmin':
        return [
          ...baseItems,
          { key: 'users', label: 'Users', icon: Users },
          { key: 'manage-orders', label: 'Orders', icon: ClipboardList },
          { key: 'stock', label: 'Stock', icon: Package },
          { key: 'verification', label: 'Verify', icon: CheckCircle },
          { key: 'performance', label: 'Stats', icon: BarChart2 },
          { key: 'target-management', label: 'Targets', icon: Target },
          { key: 'user-assignments', label: 'Assignments', icon: UserPlus },
          { key: 'stock-update', label: 'Stock Update', icon: Activity },
          { key: 'submissions', label: 'Submissions', icon: Shield },
        ];
      
      case 'superadmin':
        return [
          ...baseItems,
          { key: 'stock', label: 'Stock', icon: Package },
          { key: 'manage-orders', label: 'Orders', icon: ClipboardList },
          { key: 'messages', label: 'Messages', icon: MessageSquare },
          { key: 'verification', label: 'Verify', icon: CheckCircle },
          { key: 'assigned', label: 'Team', icon: UserPlus },
          { key: 'performance', label: 'Stats', icon: BarChart2 },
        ];
      
      case 'admin':
        return [
          ...baseItems,
          { key: 'stock', label: 'Stock', icon: Package },
          { key: 'manage-orders', label: 'Orders', icon: ClipboardList },
          { key: 'messages', label: 'Messages', icon: MessageSquare },
          { key: 'verification', label: 'Verify', icon: CheckCircle },
          { key: 'performance', label: 'Stats', icon: BarChart2 },
          { key: 'assigned', label: 'Team', icon: UserPlus },
        ];
      
      case 'marketer':
        return [
          ...baseItems,
          { key: 'stock-pickup', label: 'Stock Pickup', icon: Package },
          { key: 'orders', label: 'Orders', icon: ShoppingCart },
          { key: 'verification', label: 'Verification', icon: CheckCircle },
          { key: 'messages', label: 'Messages', icon: MessageSquare },
          { key: 'performance', label: 'Performance', icon: BarChart2 },
          { key: 'account', label: 'Account', icon: User },
        ];
      
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems(userRole);

  const handleItemClick = (key) => {
    setActiveModule(key);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out">
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Header */}
        <div className="px-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-[#f59e0b] rounded-2xl flex items-center justify-center">
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
                  {userRole} Dashboard
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
        
        {/* Menu Items */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.key;
              
              return (
                <button
                  key={item.key}
                  onClick={() => handleItemClick(item.key)}
                  className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#f59e0b] text-white shadow-lg' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
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

export default MobileBottomSheet;
