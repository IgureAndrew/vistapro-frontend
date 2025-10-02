import React, { useState, useEffect } from 'react';
import { User, UserPlus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api';

const MarketerAssignment = () => {
  const [unassignedMarketers, setUnassignedMarketers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedMarketer, setSelectedMarketer] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [marketersRes, adminsRes] = await Promise.all([
        api.get('/master-admin/unassigned-marketers'),
        api.get('/master-admin/users?role=Admin&limit=100')
      ]);
      
      setUnassignedMarketers(marketersRes.data.marketers || []);
      setAdmins(adminsRes.data.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error loading data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    
    if (!selectedMarketer || !selectedAdmin) {
      setMessage('Please select both a marketer and an admin.');
      return;
    }

    try {
      setAssigning(true);
      setMessage('');
      
      const response = await api.post('/master-admin/assign-marketer', {
        marketerId: selectedMarketer,
        adminId: selectedAdmin
      });

      setMessage(`✅ ${response.data.marketer.name} has been assigned to ${response.data.admin.name} successfully!`);
      
      // Reset form
      setSelectedMarketer('');
      setSelectedAdmin('');
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error('Error assigning marketer:', error);
      setMessage(error.response?.data?.message || 'Error assigning marketer. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Marketer Assignment</h2>
            <p className="text-sm text-gray-500 mt-1">
              Assign unassigned marketers to admins for verification process
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">
              {unassignedMarketers.length} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Assignment Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Marketer to Admin</h3>
        
        <form onSubmit={handleAssign} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Marketer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Marketer
              </label>
              <select
                value={selectedMarketer}
                onChange={(e) => setSelectedMarketer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a marketer...</option>
                {unassignedMarketers.map((marketer) => (
                  <option key={marketer.id} value={marketer.id}>
                    {marketer.first_name} {marketer.last_name} ({marketer.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Admin
              </label>
              <select
                value={selectedAdmin}
                onChange={(e) => setSelectedAdmin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose an admin...</option>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.first_name} {admin.last_name} ({admin.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={assigning || !selectedMarketer || !selectedAdmin}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {assigning ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Assigning...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Marketer
              </div>
            )}
          </button>
        </form>

        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <div className="flex items-center">
              {message.includes('✅') ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          </div>
        )}
      </div>

      {/* Unassigned Marketers List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Unassigned Marketers</h3>
          <p className="text-sm text-gray-500 mt-1">
            Marketers waiting for admin assignment
          </p>
        </div>
        
        <div className="p-6">
          {unassignedMarketers.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-500">No unassigned marketers at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unassignedMarketers.map((marketer) => (
                <div key={marketer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {marketer.first_name} {marketer.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{marketer.email}</p>
                      <p className="text-xs text-gray-400">
                        ID: {marketer.unique_id} • Registered: {formatDate(marketer.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      Pending Assignment
                    </span>
                    {marketer.locked && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketerAssignment;
