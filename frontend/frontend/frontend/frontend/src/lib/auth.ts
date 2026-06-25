import Cookies from 'js-cookie';
import { ACCESS_TOKEN_KEY } from './constants';
import { api } from './api';

interface AuthTokens {
  accessToken: string;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const setAuthTokens = ({ accessToken }: AuthTokens) => {
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, { expires: 7, secure: process.env.NODE_ENV === 'production' }); // Store for 7 days
};

export const getAccessToken = (): string | undefined => {
  return Cookies.get(ACCESS_TOKEN_KEY);
};

export const removeAuthTokens = () => {
  Cookies.remove(ACCESS_TOKEN_KEY);
};

export const registerUser = async (data: any): Promise<UserProfile> => {
  try {
    const response = await api.post<UserProfile>('/auth/register', data);
    // Note: Register API might not return token directly. Login should follow registration.
    return response;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

export const loginUser = async (data: any): Promise<UserProfile> => {
  try {
    const { accessToken } = await api.post<AuthTokens>('/auth/login', data);
    setAuthTokens({ accessToken });

    // Fetch user profile after successful login
    const userProfile = await api.get<UserProfile>('/users/me', true);
    return userProfile;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const logoutUser = () => {
  removeAuthTokens();
  // Optionally, invalidate session on backend if needed
};

export const fetchUserProfile = async (): Promise<UserProfile | null> => {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const userProfile = await api.get<UserProfile>('/users/me', true);
    return userProfile;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    removeAuthTokens(); // Clear token if it's invalid
    return null;
  }
};