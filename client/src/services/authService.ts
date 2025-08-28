import api from './axiosInstance';
import { isAxiosError } from 'axios';

interface LoginDetails {
  email: string;
  password: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// The shape our API uses for error responses
interface ApiErrorResponse {
  error?: string;
  errors?: string[];
}

const AUTH_URL = '/api/v1/auth';

// Extracts a user-friendly message from unknown errors
const getErrorMessage = (err: unknown): string | undefined => {
  if (isAxiosError<ApiErrorResponse>(err)) {
    const data = err.response?.data;
    if (data?.errors?.length) return data.errors.join(', ');
    if (data?.error) return data.error;
  }
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return undefined;
};

export const loginUser = async (loginDetails: LoginDetails) => {
  try {
    const response = await api.post(`${AUTH_URL}/login`, loginDetails);
    return response;
  } catch (err: unknown) {
    const errorMsg = getErrorMessage(err);
    throw new Error(errorMsg || 'Error logging in');
  }
};

export const registerUser = async (formData: RegisterFormData) => {
  try {
    const response = await api.post(`${AUTH_URL}/register`, formData);
    return response;
  } catch (err: unknown) {
    const errorMsg = getErrorMessage(err);
    throw new Error(errorMsg || 'Error creating user');
  }
};

export const logoutUser = async () => {
  try {
    const response = await api.get(`${AUTH_URL}/logout`);
    return response;
  } catch (err: unknown) {
    const errorMsg = getErrorMessage(err);
    throw new Error(errorMsg || 'Error logging out');
  }
};