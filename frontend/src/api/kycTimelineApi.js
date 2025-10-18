// frontend/src/api/kycTimelineApi.js
// API service for KYC Timeline

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Get all KYC timelines with detailed tracking information
 */
export const getAllKYCTimelines = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/kyc-tracking/timelines`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching KYC timelines:', error);
    throw error;
  }
};

/**
 * Get KYC timeline for a specific submission
 */
export const getKYCTimelineById = async (submissionId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/kyc-tracking/${submissionId}/timeline`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching KYC timeline:', error);
    throw error;
  }
};

/**
 * Get KYC statistics overview
 */
export const getKYCStatistics = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/kyc-tracking/statistics/overview`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching KYC statistics:', error);
    throw error;
  }
};

/**
 * Log a KYC action
 */
export const logKYCAction = async (submissionId, actionType, details = {}) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/kyc-tracking/log`, {
      submissionId,
      actionType,
      details
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error logging KYC action:', error);
    throw error;
  }
};

/**
 * Export timeline data to CSV
 */
export const exportTimelineToCSV = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/kyc-tracking/export/csv`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kyc-timeline-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error) {
    console.error('Error exporting timeline to CSV:', error);
    throw error;
  }
};

/**
 * Export timeline data to PDF
 */
export const exportTimelineToPDF = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/kyc-tracking/export/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kyc-timeline-${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error) {
    console.error('Error exporting timeline to PDF:', error);
    throw error;
  }
};

export default {
  getAllKYCTimelines,
  getKYCTimelineById,
  getKYCStatistics,
  logKYCAction,
  exportTimelineToCSV,
  exportTimelineToPDF
};

