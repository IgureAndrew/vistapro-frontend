// src/api/reportApi.js
import axios from 'axios';

const reportApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api', // e.g. "http://localhost:3000/api"
  headers: {
    'Content-Type': 'application/json',
    // add auth header if needed, e.g.
    // Authorization: `Bearer ${localStorage.getItem('token')}`
  },
});

export default reportApi;
