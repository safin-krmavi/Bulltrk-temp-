import type { AxiosRequestConfig } from 'axios';
import apiClient from './apiClient';
import { apiurls } from './apiurls';

export interface LoginResponse {
  status: string;
  message?: string;
  data: {
    message: string | undefined;
    token: string;
    user: Record<string, any>;
  };
}

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export async function loginUser(
  email: string, 
  password: string
): Promise<LoginResponse> {
  try {
    const response = await apiClient.post(apiurls.userAuth.login, {
      email,
      password
    });
    
    localStorage.setItem("AUTH_TOKEN", response.data.data.token);
    return response.data;
    
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Login request failed"
    );
  }
}

export async function registerUser(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  roleId: string;
}): Promise<LoginResponse> {
  try {
    const response = await apiClient.post(apiurls.userAuth.signup, data);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Registration failed"
    );
  }
}

export function logoutUser(): void {
  localStorage.removeItem("AUTH_TOKEN");
}

export function getToken(): string | null {
  return localStorage.getItem("AUTH_TOKEN");
}

// Generic authenticated request
export async function authFetch<T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const response = await apiClient(endpoint, config);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Request failed"
    );
  }
}