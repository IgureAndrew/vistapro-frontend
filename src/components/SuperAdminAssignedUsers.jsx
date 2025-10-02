import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  UserGroupIcon, 
  MapPinIcon, 
  ChartBarIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { superAdminApiCalls } from '../api/superAdminApi';

const SuperAdminAssignedUsers = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [teamHierarchy, setTeamHierarchy] = useState([]);
  const [teamStats, setTeamStats] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [locationBreakdown, setLocationBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAdmins, setExpandedAdmins] = useState(new Set());
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Load all data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hierarchyRes, statsRes, performanceRes, locationRes] = await Promise.all([
        superAdminApiCalls.getTeamHierarchy(),
        superAdminApiCalls.getTeamStats(),
        superAdminApiCalls.getPerformanceMetrics(),
        superAdminApiCalls.getLocationBreakdown()
      ]);

      if (hierarchyRes.data.success) setTeamHierarchy(hierarchyRes.data.data);
      if (statsRes.data.success) setTeamStats(statsRes.data.data);
      if (performanceRes.data.success) setPerformanceMetrics(performanceRes.data.data);
      if (locationRes.data.success) setLocationBreakdown(locationRes.data.data);
    } catch (err) {
      console.error('Error loading SuperAdmin data:', err);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminExpansion = (adminId) => {
    const newExpanded = new Set(expandedAdmins);
    if (newExpanded.has(adminId)) {
      newExpanded.delete(adminId);
    } else {
      newExpanded.add(adminId);
    }
    setExpandedAdmins(newExpanded);
  };

  const getFilteredHierarchy = () => {
    let filtered = teamHierarchy;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.map(admin => ({
        ...admin,
        marketers: admin.marketers.filter(marketer => 
          `${marketer.first_name} ${marketer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          marketer.unique_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          marketer.location?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(admin => 
        admin.marketers.length > 0 ||
        `${admin.admin_first_name} ${admin.admin_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.admin_unique_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(admin => admin.admin_location === selectedLocation);
    }

    return filtered;
  };

  const getUniqueLocations = () => {
    const locations = new Set();
    teamHierarchy.forEach(admin => {
      if (admin.admin_location) locations.add(admin.admin_location);
      admin.marketers.forEach(marketer => {
        if (marketer.location) locations.add(marketer.location);
      });
    });
    return Array.from(locations).sort();
  };

  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <UserGroupIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">My Admins</p>
            <p className="text-2xl font-bold text-gray-900">{teamStats.total_admins || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <UsersIcon className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Marketers</p>
            <p className="text-2xl font-bold text-gray-900">{teamStats.total_marketers || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <MapPinIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Active Locations</p>
            <p className="text-2xl font-bold text-gray-900">{teamStats.admin_locations || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 rounded-lg">
            <ChartBarIcon className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Approved Marketers</p>
            <p className="text-2xl font-bold text-gray-900">{teamStats.approved_marketers || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeamOverview = () => {
    const filteredHierarchy = getFilteredHierarchy();

    if (filteredHierarchy.length === 0) {
      return (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No team members found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search criteria.' : 'No admins are currently assigned to you.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredHierarchy.map((admin) => (
          <div key={admin.admin_id} className="bg-white rounded-lg shadow">
            {/* Admin Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleAdminExpansion(admin.admin_id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {expandedAdmins.has(admin.admin_id) ? (
                      <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {admin.admin_first_name} {admin.admin_last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {admin.admin_unique_id} • {admin.admin_location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {admin.marketer_count} marketer{admin.marketer_count !== 1 ? 's' : ''}
                  </span>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketers List */}
            {expandedAdmins.has(admin.admin_id) && (
              <div className="p-4">
                {admin.marketers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No marketers assigned</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {admin.marketers.map((marketer) => (
                      <div key={marketer.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {marketer.first_name} {marketer.last_name}
                            </h4>
                            <p className="text-sm text-gray-600">{marketer.unique_id}</p>
                            <p className="text-sm text-gray-500">{marketer.location}</p>
                          </div>
                          <div className="flex space-x-1">
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <ChatBubbleLeftRightIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {marketer.bio_submitted && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Bio
                            </span>
                          )}
                          {marketer.guarantor_submitted && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Guarantor
                            </span>
                          )}
                          {marketer.commitment_submitted && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Commitment
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPerformanceMetrics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Admin Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marketers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceMetrics.map((admin) => (
                <tr key={admin.admin_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{admin.admin_name}</div>
                      <div className="text-sm text-gray-500">{admin.admin_unique_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {admin.admin_location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {admin.total_marketers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${admin.completion_rate || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{admin.completion_rate || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${admin.approval_rate || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{admin.approval_rate || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLocationBreakdown = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {locationBreakdown.map((location) => (
        <div key={location.location} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{location.location}</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Admins:</span>
              <span className="text-sm font-medium text-gray-900">{location.admin_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Marketers:</span>
              <span className="text-sm font-medium text-gray-900">{location.marketer_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completed:</span>
              <span className="text-sm font-medium text-green-600">{location.completed_submissions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Approved:</span>
              <span className="text-sm font-medium text-blue-600">{location.approved_marketers}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Team</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and monitor your assigned admins and their marketers
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search admins or marketers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Locations</option>
              {getUniqueLocations().map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Team Overview', icon: UsersIcon },
            { id: 'performance', name: 'Performance', icon: ChartBarIcon },
            { id: 'locations', name: 'Locations', icon: MapPinIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && renderTeamOverview()}
        {activeTab === 'performance' && renderPerformanceMetrics()}
        {activeTab === 'locations' && renderLocationBreakdown()}
      </div>
    </div>
  );
};

export default SuperAdminAssignedUsers;




