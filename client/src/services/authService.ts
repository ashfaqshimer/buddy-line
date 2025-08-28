import api from './axiosInstance';
import { extractErrorMessage } from '../utils/errorHandler';

export interface LoginDetails {
	email: string;
	password: string;
}

export interface RegisterFormData {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
}

const AUTH_URL = '/api/v1/auth';

export const loginUser = async (loginDetails: LoginDetails) => {
	try {
		const response = await api.post(`${AUTH_URL}/login`, loginDetails);
		return response;
	} catch (err: unknown) {
		throw new Error(extractErrorMessage(err, 'Error logging in'));
	}
};

export const registerUser = async (formData: RegisterFormData) => {
	try {
		const response = await api.post(`${AUTH_URL}/register`, formData);
		return response;
	} catch (err: unknown) {
		throw new Error(extractErrorMessage(err, 'Error creating user'));
	}
};

export const logoutUser = async () => {
	try {
		const response = await api.get(`${AUTH_URL}/logout`);
		return response;
	} catch (err: unknown) {
		throw new Error(extractErrorMessage(err, 'Error logging out'));
	}
};

export const getLoggedInUser = async () => {
	try {
		const response = await api.get(`${AUTH_URL}/me`);
		return response.data.user;
	} catch (err: unknown) {
		throw new Error(extractErrorMessage(err, 'Error getting logged in user'));
	}
};
