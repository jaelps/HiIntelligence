import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth endpoints
export const loginAPI = async (credentials: { username: string; password: string }) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

// Dashboard endpoints
export const getExecutiveAPI = async () => {
  const response = await api.get('/dashboard/executive');
  return response.data;
};

export const getRegionalAPI = async (region?: string) => {
  const response = await api.get('/dashboard/regional', { params: { region } });
  return response.data;
};

// Store endpoints
export interface GetStoresParams {
  search?: string;
  region?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const getStoresAPI = async (params: GetStoresParams) => {
  const response = await api.get('/store', { params });
  return response.data;
};

export const getStoreByIdAPI = async (id: number) => {
  const response = await api.get(`/store/${id}`);
  return response.data;
};

export const getStoreHistoryAPI = async (id: number, days: number = 30) => {
  const response = await api.get(`/store/${id}/history`, { params: { days } });
  return response.data;
};

// Alerts endpoints
export const getAlertsAPI = async (isAcknowledged?: boolean, severity?: string) => {
  const response = await api.get('/alerts', { params: { isAcknowledged, severity } });
  return response.data;
};

export const acknowledgeAlertAPI = async (id: number) => {
  const response = await api.post(`/alerts/${id}/acknowledge`);
  return response.data;
};

// Intelligence endpoints
export const getInsightsAPI = async () => {
  const response = await api.get('/intelligence');
  return response.data;
};

// Reports endpoints
export const exportReportUrl = (reportType: string, format: string, region?: string, storeId?: number, days: number = 30) => {
  const token = localStorage.getItem('token') || '';
  const regionParam = region ? `&region=${encodeURIComponent(region)}` : '';
  const storeParam = storeId ? `&storeId=${storeId}` : '';
  
  // Return URL with auth token query param or let browser open it directly.
  // Since reports are GET, appending access_token works if backend supports it,
  // or we fetch using axios with headers and createObjectURL.
  // Let's implement fetchReportAPI as blob using axios for secure header-based token transfer.
  return `${API_URL}/api/reports/export?reportType=${reportType}&format=${format}${regionParam}${storeParam}&days=${days}`;
};

export const downloadReportAPI = async (reportType: string, format: string, region?: string, storeId?: number, days: number = 30) => {
  const response = await api.get('/reports/export', {
    params: { reportType, format, region, storeId, days },
    responseType: 'blob',
  });
  return response.data;
};
