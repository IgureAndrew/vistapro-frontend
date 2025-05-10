import axios from 'axios';

const reportApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL + '/api/reports',
    headers: {
      'Content-Type': 'application/json',
      // grab the token from localStorage on init
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    withCredentials: true,  // in case you ever use cookies
  });

  export default reportApi;
