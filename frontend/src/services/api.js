import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Add interceptor to include token from localStorage or sessionStorage
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function normalizeAxiosError(err) {
  const e = new Error(err.response?.data?.message || err.message || 'Request failed');
  e.status = err.response?.status;
  e.body = err.response?.data;
  e.isNetworkError = !err.response;
  throw e;
}

export async function getJSON(path) {
  try {
    const res = await client.get(path);
    return res.data;
  } catch (err) {
    normalizeAxiosError(err);
  }
}

export async function postJSON(path, body) {
  try {
    const res = await client.post(path, body);
    return res.data;
  } catch (err) {
    normalizeAxiosError(err);
  }
}
