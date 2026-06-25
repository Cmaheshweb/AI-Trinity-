import { ACCESS_TOKEN_KEY } from './constants';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000';

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  data?: any,
  isAuthenticated: boolean = false
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (isAuthenticated) {
    const token = Cookies.get(ACCESS_TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // In a real app, you might redirect to login here or throw a specific error
      console.warn('Authentication required but no token found.');
    }
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'An API error occurred');
    }

    // Handle no content response
    if (response.status === 204) {
      return null as T;
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

export const api = {
  get: <T>(path: string, isAuthenticated: boolean = false) =>
    request<T>('GET', path, undefined, isAuthenticated),
  post: <T>(path: string, data: any, isAuthenticated: boolean = false) =>
    request<T>('POST', path, data, isAuthenticated),
  put: <T>(path: string, data: any, isAuthenticated: boolean = false) =>
    request<T>('PUT', path, data, isAuthenticated),
  patch: <T>(path: string, data: any, isAuthenticated: boolean = false) =>
    request<T>('PATCH', path, data, isAuthenticated),
  del: <T>(path: string, isAuthenticated: boolean = false) =>
    request<T>('DELETE', path, undefined, isAuthenticated),
};