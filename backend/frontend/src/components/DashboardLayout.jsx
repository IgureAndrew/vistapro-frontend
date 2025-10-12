import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useResponsive } from '../hooks/useResponsive';
import { getRoleConfig, getMobileNavConfig } from '../config/RoleConfig';
import ShadcnblocksLayout from './layouts/ShadcnblocksLayout';
import { getRoleMetrics } from './metrics/RoleMetrics';
import { getRoleCharts } from './charts/DashboardCharts';
import { getRoleTables } from './tables/DashboardTables';
import TeamMembersCard from './team/TeamMembers';
import { 
  Activity, 
  Clock, 
  Users, 
  Package, 
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';

const DashboardLayout = ({ 
  userRole = 'masteradmin',
  children 
}) => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  
  // State management
  const [user, setUser] = useState(null);
  const [activeModule, setActiveModule] = useState('overview');
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Get role configuration
  const roleConfig = getRoleConfig(userRole);
  const mobileNav = getMobileNavConfig(userRole);

  // Load user data
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const userData = JSON.parse(stored);
      setUser(userData);
    }
  }, []);

  // Load stats data
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        // Simulate API call - replace with actual API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock stats data - replace with actual data fetching
        const mockStats = {
          totalUsers: 1250,
          previousTotalUsers: 1200,
          totalOrders: 340,
          totalPendingOrders: 45,
          previousPendingOrders: 50,
          totalConfirmedOrders: 295,
          previousConfirmedOrders: 280,
          totalSales: 2500000,
          previousSales: 2200000,
          totalPickupStocks: 120,
          previousPickupStocks: 110,
          pendingVerification: 25,
          previousPendingVerification: 30,
          assignedUsers: 45,
          previousAssignedUsers: 40,
          assignedMarketers: 15,
          previousAssignedMarketers: 12,
          walletBalance: 125000,
          previousWalletBalance: 100000,
          verificationStatus: userRole === 'marketer' ? 'verified' : 'pending'
        };
        
        setStats(mockStats);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [userRole]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Get current module component
  const getCurrentModuleComponent = ({ onNavigate, isDarkMode, activeModule: currentModule }) => {
    // Use the activeModule passed from ShadcnblocksLayout (sidebar state)
    const moduleKey = currentModule || activeModule;
    const module = roleConfig.modules.find(m => m.key === moduleKey);
    if (module && module.component) {
      const Component = module.component;
      return <Component onNavigate={onNavigate} isDarkMode={isDarkMode} />;
    }
    
    // Return overview content if no specific component
    if (moduleKey === 'overview') {
      return <OverviewContent />;
    }
    
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            Module "{moduleKey}" is not implemented yet.
          </p>
        </CardContent>
      </Card>
    );
  };

  // Overview content component
  const OverviewContent = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Welcome back, {user?.first_name || 'User'}! 👋
            </span>
            <Badge variant="outline" className="text-sm">
              {roleConfig.title}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Here's what's happening with your account today.
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roleConfig.quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.key}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50"
                onClick={() => setActiveModule(action.key)}
              >
                <Icon className={`h-6 w-6 text-${action.color}-500`} />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                { id: 1, type: 'user', action: 'New user registration', user: 'John Doe', time: '2 minutes ago', status: 'success' },
                { id: 2, type: 'order', action: 'Order completed', user: 'Jane Smith', time: '5 minutes ago', status: 'success' },
                { id: 3, type: 'payment', action: 'Payment received', user: 'Mike Johnson', time: '10 minutes ago', status: 'success' },
                { id: 4, type: 'user', action: 'Profile updated', user: 'Sarah Wilson', time: '15 minutes ago', status: 'info' },
                { id: 5, type: 'order', action: 'New order placed', user: 'David Brown', time: '20 minutes ago', status: 'pending' }
              ].map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'user' ? 'bg-blue-100' :
                      activity.type === 'order' ? 'bg-green-100' :
                      activity.type === 'payment' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {activity.type === 'user' ? <Users className="h-4 w-4 text-blue-600" /> :
                       activity.type === 'order' ? <ShoppingCart className="h-4 w-4 text-green-600" /> :
                       activity.type === 'payment' ? <DollarSign className="h-4 w-4 text-purple-600" /> :
                       <Activity className="h-4 w-4 text-gray-600" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">by {activity.user}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-500">{activity.time}</p>
                    <Badge 
                      variant={activity.status === 'success' ? 'default' : 
                              activity.status === 'pending' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Get role-specific data for Shadcnblocks layout
  const metrics = getRoleMetrics(userRole, stats);
  const charts = getRoleCharts(userRole);
  const tables = getRoleTables(userRole);

  return (
    <ShadcnblocksLayout
      userRole={userRole}
      metrics={metrics}
      charts={charts}
      tables={tables}
      teamMembers={[]}
    >
      {isLoading ? (
        () => (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        )
      ) : (
        getCurrentModuleComponent
      )}
    </ShadcnblocksLayout>
  );
};

export default DashboardLayout;