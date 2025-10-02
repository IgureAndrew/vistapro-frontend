import axios from 'axios';

const superAdminApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/super-admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
superAdminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// SuperAdmin team management API calls
export const superAdminApiCalls = {
  // Get team hierarchy (admins and their marketers)
  getTeamHierarchy: () => superAdminApi.get('/team/hierarchy'),
  
  // Get team statistics
  getTeamStats: () => superAdminApi.get('/team/stats'),
  
  // Get performance metrics
  getPerformanceMetrics: () => superAdminApi.get('/team/performance'),
  
  // Get location breakdown
  getLocationBreakdown: () => superAdminApi.get('/team/locations'),
};

export default superAdminApi;




