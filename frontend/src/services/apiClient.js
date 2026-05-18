// frontend/src/services/apiClient.js
const API_BASE_URL = import.meta.env.VITE_API_CLIENT || 'http://127.0.0.1:5000/api';

// Single unified function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Prioritize regular token over admin token
  const authToken = token || adminToken;
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
    console.log('🔑 Auth token attached to request');
  } else {
    console.warn('⚠️ No auth token found');
  }
  
  return headers;
};

const apiClient = {
  get: async (endpoint) => {
    console.log('🌐 API GET:', `${API_BASE_URL}${endpoint}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      console.log('📥 API Response:', response.status, data);

      if (!response.ok) {
        console.error('❌ API Error:', response.status, data);
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
          console.log('🚪 Unauthorized - redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('userRole');
          window.location.href = '/login';
        }
        
        throw new Error(data.message || `API Error: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ API Request failed:', error);
      throw error;
    }
  },

  post: async (endpoint, body) => {
    console.log('🌐 API POST:', `${API_BASE_URL}${endpoint}`, body);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      console.log('📥 API Response:', response.status, data);

      if (!response.ok) {
        console.error('❌ API Error:', response.status, data);
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
          console.log('🚪 Unauthorized - redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('userRole');
          window.location.href = '/login';
        }
        
        throw new Error(data.message || `API Error: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ API Request failed:', error);
      throw error;
    }
  },

  put: async (endpoint, body) => {
    console.log('🌐 API PUT:', `${API_BASE_URL}${endpoint}`, body);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      console.log('📥 API Response:', response.status, data);

      if (!response.ok) {
        console.error('❌ API Error:', response.status, data);
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
          console.log('🚪 Unauthorized - redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('userRole');
          window.location.href = '/login';
        }
        
        throw new Error(data.message || `API Error: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ API Request failed:', error);
      throw error;
    }
  },

  delete: async (endpoint) => {
    console.log('🌐 API DELETE:', `${API_BASE_URL}${endpoint}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      console.log('📥 API Response:', response.status, data);

      if (!response.ok) {
        console.error('❌ API Error:', response.status, data);
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
          console.log('🚪 Unauthorized - redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('userRole');
          window.location.href = '/login';
        }
        
        throw new Error(data.message || `API Error: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ API Request failed:', error);
      throw error;
    }
  },
};

export default apiClient;