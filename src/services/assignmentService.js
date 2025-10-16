// src/services/assignmentService.js
const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'https://vistapro-backend.onrender.com/api';

const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Set default headers for POST/PUT requests
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    throw error;
  }
};

export const assignmentService = {
  // Hierarchical assignment methods using MasterAdmin controller
  assignMarketersToAdmin: async (data) => {
    return apiCall('/master-admin/assign-marketers-to-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  assignAdminToSuperAdmin: async (data) => {
    return apiCall('/master-admin/assign-admins-to-superadmin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  unassignMarketersFromAdmin: async (data) => {
    return apiCall('/master-admin/unassign-marketers-from-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  unassignAdminsFromSuperadmin: async (data) => {
    return apiCall('/master-admin/unassign-admins-from-superadmin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  unassignAllUsers: async () => {
    return apiCall('/master-admin/unassign-all-users', {
      method: 'POST',
    });
  },
  
  listMarketersByAdmin: async (adminUniqueId) => {
    return apiCall(`/master-admin/marketers/${adminUniqueId}`);
  },
  
  listAdminsBySuperAdmin: async (superAdminUniqueId) => {
    return apiCall(`/master-admin/admins/${superAdminUniqueId}`);
  },
  
  getAllAssignments: async () => {
    return apiCall('/master-admin/assignments');
  },
  
  // Legacy methods for backward compatibility (can be removed later)
  createAssignment: async (assignmentData) => {
    return apiCall('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  },
  getAssignments: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiCall(`/assignments?${queryParams}`);
  },
  getAssignmentById: async (assignmentId) => {
    return apiCall(`/assignments/${assignmentId}`);
  },
  updateAssignment: async (assignmentId, assignmentData) => {
    return apiCall(`/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify(assignmentData),
    });
  },
  deactivateAssignment: async (assignmentId) => {
    return apiCall(`/assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  },
  getAssignmentHistory: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiCall(`/assignments/history?${queryParams}`);
  },
  getAssignmentStats: async () => {
    return apiCall('/assignments/stats');
  },
};

export const locationService = {
  createLocation: async (locationData) => {
    return apiCall('/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  },
  getAllLocations: async () => {
    return apiCall('/locations');
  },
  getLocationById: async (locationId) => {
    return apiCall(`/locations/${locationId}`);
  },
  updateLocation: async (locationId, locationData) => {
    return apiCall(`/locations/${locationId}`, {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  },
  deleteLocation: async (locationId) => {
    return apiCall(`/locations/${locationId}`, {
      method: 'DELETE',
    });
  },
  getLocationStats: async () => {
    return apiCall('/locations/stats');
  },
};

export const userService = {
  getAllUsers: async () => {
    return apiCall('/master-admin/users');
  },
  getUsersByRole: async (role) => {
    return apiCall(`/master-admin/users?role=${role}`);
  },
  getUsersByLocation: async (location) => {
    return apiCall(`/master-admin/users?location=${location}`);
  },
};
