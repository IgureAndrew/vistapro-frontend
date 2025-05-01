// src/api/messagesApi.js
import axios from 'axios';

const messagesApi = axios.create({
  baseURL: '${import.meta.env.VITE_API_URL}/api/messages',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

export default messagesApi;
