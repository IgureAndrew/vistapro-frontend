import React, { useState, useEffect } from 'react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger, 
  Button, 
  Badge,
  Separator 
} from './ui';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Wallet, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  ExternalLink,
  Send,
  CreditCard,
  Unlock,
  History
} from 'lucide-react';
import walletApi from '../api/walletApi';

const UserSummaryPopover = ({ 
  children, 
  userUniqueId, 
  userName, 
  userRole,
  onAction 
}) => {
  const [userSummary, setUserSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [withheldReleases, setWithheldReleases] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loadingSection, setLoadingSection] = useState(false);

  const fetchUserSummary = async () => {
    if (!userUniqueId) {
      console.log('No userUniqueId provided');
      return;
    }
    
    console.log('Fetching user summary for:', userUniqueId);
    setLoading(true);
    setError(null);
    
    try {
      const response = await walletApi.get(`/user/${userUniqueId}/summary`);
      console.log('User summary response:', response.data);
      setUserSummary(response.data);
    } catch (err) {
      console.error('Error fetching user summary:', err);
      console.error('Error details:', err.response?.data);
      setError(`Failed to load user data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithheldReleases = async () => {
    if (!userUniqueId) return;
    
    setLoadingSection(true);
    try {
      const response = await walletApi.get(`/user/${userUniqueId}/withheld-releases`);
      setWithheldReleases(response.data.releases || []);
    } catch (err) {
      console.error('Error fetching withheld releases:', err);
    } finally {
      setLoadingSection(false);
    }
  };

  const fetchWithdrawalRequests = async () => {
    if (!userUniqueId) return;
    
    setLoadingSection(true);
    try {
      const response = await walletApi.get(`/user/${userUniqueId}/withdrawal-requests`);
      setWithdrawalRequests(response.data.requests || []);
    } catch (err) {
      console.error('Error fetching withdrawal requests:', err);
    } finally {
      setLoadingSection(false);
    }
  };

  const handleSectionToggle = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
      if (section === 'withheld-releases') {
        fetchWithheldReleases();
      } else if (section === 'withdrawal-requests') {
        fetchWithdrawalRequests();
      }
    }
  };

  const handleQuickAction = (action, data) => {
    if (onAction) {
      onAction(action, data);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return `₦${Number(amount).toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'MasterAdmin': return 'bg-purple-100 text-purple-800';
      case 'SuperAdmin': return 'bg-blue-100 text-blue-800';
      case 'Admin': return 'bg-green-100 text-green-800';
      case 'Marketer': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Popover onOpenChange={(open) => {
      console.log('Popover open change:', open);
      if (open) {
        fetchUserSummary();
      }
    }}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 max-h-[80vh] overflow-hidden">
        {loading ? (
          <div className="p-4">
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Loading user details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="text-center text-red-500">
              <XCircle className="w-8 h-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          </div>
        ) : !userSummary ? (
          <div className="p-4">
            <div className="text-center text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Click to load user details</p>
            </div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{userSummary.user.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-xs ${getRoleColor(userSummary.user.role)}`}>
                      {userSummary.user.role}
                    </Badge>
                    <span className="text-xs text-gray-500 font-mono">
                      {userSummary.user.unique_id}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="mt-3 space-y-1">
                {userSummary.user.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span>{userSummary.user.location}</span>
                  </div>
                )}
                {userSummary.user.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3 h-3" />
                    <span>{userSummary.user.phone}</span>
                  </div>
                )}
                {userSummary.user.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{userSummary.user.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Summary */}
            <div className="p-4 border-b">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Wallet Summary
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-white border border-gray-200 rounded">
                  <div className="text-lg font-bold text-gray-900">
                    {formatAmount(userSummary.wallet.total_balance)}
                  </div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center p-2 bg-white border border-gray-200 rounded">
                  <div className="text-lg font-bold text-gray-900">
                    {formatAmount(userSummary.wallet.available_balance)}
                  </div>
                  <div className="text-xs text-gray-600">Available</div>
                </div>
                <div className="text-center p-2 bg-white border border-gray-200 rounded">
                  <div className="text-lg font-bold text-gray-900">
                    {formatAmount(userSummary.wallet.withheld_balance)}
                  </div>
                  <div className="text-xs text-gray-600">Withheld</div>
                </div>
                <div className="text-center p-2 bg-white border border-gray-200 rounded">
                  <div className="text-lg font-bold text-gray-900">
                    {formatAmount(userSummary.wallet.pending_cashout)}
                  </div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>
              </div>
            </div>

            {/* Commission Summary */}
            <div className="p-4 border-b">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Commission Summary
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-white border border-gray-200 rounded">
                  <div className="text-lg font-bold text-gray-900">
                    {formatAmount(userSummary.stats.total_commission_earned)}
                  </div>
                  <div className="text-xs text-gray-600">Total Earned</div>
                </div>
                <div className="text-center p-2 bg-white border border-gray-200 rounded">
                  <div className="text-lg font-bold text-gray-900">
                    {formatAmount(userSummary.stats.commission_rate)}
                  </div>
                  <div className="text-xs text-gray-600">Per Device</div>
                </div>
                <div className="text-center p-2 bg-white border border-gray-200 rounded">
                  <div className="text-sm font-bold text-green-600">
                    {formatAmount(userSummary.stats.withdrawable_commission)}
                  </div>
                  <div className="text-xs text-gray-600">Withdrawable (40%)</div>
                </div>
                <div className="text-center p-2 bg-white border border-gray-200 rounded">
                  <div className="text-sm font-bold text-orange-600">
                    {formatAmount(userSummary.stats.withheld_commission)}
                  </div>
                  <div className="text-xs text-gray-600">Withheld (60%)</div>
                </div>
              </div>
            </div>

            {/* Sales Performance */}
            <div className="p-4 border-b">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Sales Performance
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-white border border-gray-200 rounded">
                  <div className="text-lg font-bold text-gray-900">
                    {userSummary.stats.total_orders}
                  </div>
                  <div className="text-xs text-gray-600">Devices Sold</div>
                </div>
                <div className="text-center p-2 bg-white border border-gray-200 rounded">
                  <div className="text-sm font-bold text-gray-900">
                    {formatAmount(userSummary.stats.total_sales)}
                  </div>
                  <div className="text-xs text-gray-600">Total Sales</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Activity
              </h4>
              
              {/* Recent Device Sales */}
              {userSummary.recent_orders.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Recent Device Sales</div>
                  <div className="space-y-2">
                    {userSummary.recent_orders.slice(0, 5).map((order, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-600">Order #{order.id}</span>
                          <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{formatAmount(order.amount)}</div>
                          <div className="text-gray-500">{formatDate(order.date)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Withdrawals */}
              {userSummary.recent_withdrawals.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Recent Withdrawals</div>
                  <div className="space-y-2">
                    {userSummary.recent_withdrawals.slice(0, 3).map((withdrawal, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-600">#{withdrawal.id}</span>
                          <Badge className={`text-xs ${getStatusColor(withdrawal.status)}`}>
                            {withdrawal.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{formatAmount(withdrawal.amount)}</div>
                          <div className="text-gray-500">{formatDate(withdrawal.date)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t bg-gray-50">
              <div className="space-y-3">
                {/* Primary Actions */}
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => handleQuickAction('send_message', userSummary.user)}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Message
                  </Button>
                </div>
                
                {/* Master Admin Actions */}
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Master Admin Actions</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleSectionToggle('withheld-releases')}
                    >
                      <Unlock className="w-3 h-3 mr-1" />
                      {expandedSection === 'withheld-releases' ? 'Hide' : 'Show'} Withheld
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleSectionToggle('withdrawal-requests')}
                    >
                      <CreditCard className="w-3 h-3 mr-1" />
                      {expandedSection === 'withdrawal-requests' ? 'Hide' : 'Show'} Requests
                    </Button>
                  </div>
                </div>
                
                {/* Quick Withdrawal Actions */}
                {userSummary.wallet.pending_cashout > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">Pending Withdrawal Actions:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        className="text-xs bg-white text-green-600 border border-green-600 hover:bg-green-50"
                        onClick={() => handleQuickAction('approve_withdrawal', userSummary.user)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs bg-white text-red-600 border border-red-600 hover:bg-red-50"
                        onClick={() => handleQuickAction('reject_withdrawal', userSummary.user)}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Expanded Sections */}
            {expandedSection && (
              <div className="border-t bg-white">
                {expandedSection === 'withheld-releases' && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Unlock className="w-4 h-4" />
                        Withheld Releases
                      </h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        onClick={() => setExpandedSection(null)}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {loadingSection ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-xs text-gray-500">Loading...</p>
                      </div>
                    ) : withheldReleases.length > 0 ? (
                      <div className="space-y-2">
                        {withheldReleases.map((release, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-gray-900">
                                {formatAmount(release.withheld_balance)}
                              </div>
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                Pending Release
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              Available: {formatAmount(release.available_balance)} | 
                              Total: {formatAmount(release.total_balance)}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="text-xs bg-white text-green-600 border border-green-600 hover:bg-green-50"
                                onClick={() => handleQuickAction('approve_withheld', { 
                                  userUniqueId, 
                                  amount: release.withheld_balance 
                                })}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Release
                              </Button>
                              <Button
                                size="sm"
                                className="text-xs bg-white text-red-600 border border-red-600 hover:bg-red-50"
                                onClick={() => handleQuickAction('reject_withheld', { 
                                  userUniqueId, 
                                  amount: release.withheld_balance 
                                })}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Unlock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No withheld amounts to release</p>
                      </div>
                    )}
                  </div>
                )}

                {expandedSection === 'withdrawal-requests' && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Withdrawal Requests
                      </h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        onClick={() => setExpandedSection(null)}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {loadingSection ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-xs text-gray-500">Loading...</p>
                      </div>
                    ) : withdrawalRequests.length > 0 ? (
                      <div className="space-y-2">
                        {withdrawalRequests.map((request, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-gray-900">
                                {formatAmount(request.amount)}
                              </div>
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                Pending
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              <div>Bank: {request.bank_name}</div>
                              <div>Account: {request.account_number}</div>
                              <div>Fee: {formatAmount(request.fee)} | Net: {formatAmount(request.net_amount)}</div>
                              <div>Date: {formatDate(request.requested_at)}</div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="text-xs bg-white text-green-600 border border-green-600 hover:bg-green-50"
                                onClick={() => handleQuickAction('approve_withdrawal', { 
                                  requestId: request.id,
                                  userUniqueId 
                                })}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                className="text-xs bg-white text-red-600 border border-red-600 hover:bg-red-50"
                                onClick={() => handleQuickAction('reject_withdrawal', { 
                                  requestId: request.id,
                                  userUniqueId 
                                })}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No pending withdrawal requests</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default UserSummaryPopover;
