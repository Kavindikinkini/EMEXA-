import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export async function getJSON(path) {
  try {
    const res = await client.get(path);
    return res.data;
  } catch (err) {
    if (!err.response) err.isNetworkError = true;
    const e = new Error(err.response?.data?.message || err.message);
    e.status = err.response?.status;
    e.body = err.response?.data;
    e.isNetworkError = !!err.isNetworkError;
    throw e;
  }
}

export async function postJSON(path, body) {
  try {
    const res = await client.post(path, body);
    return res.data;
  } catch (err) {
    if (!err.response) err.isNetworkError = true;
    const e = new Error(err.response?.data?.message || err.message);
    e.status = err.response?.status;
    e.body = err.response?.data;
    e.isNetworkError = !!err.isNetworkError;
    throw e;
  }
}module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  API_VERSION: process.env.API_VERSION || 'v1',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/emexa',
  MONGODB_URI_TEST: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/emexa_test',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};