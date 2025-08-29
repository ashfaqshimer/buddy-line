import { loginUser } from './../services/authService';
import { create } from 'zustand';
import toast from 'react-hot-toast';
import {
	getLoggedInUser,
	registerUser,
	type RegisterFormData,
	type LoginDetails,
} from '../services/authService';
import type { User } from '../constants/types';

interface AuthState {
	authUser: User | null;
	isSigningUp: boolean;
	isLoggingIn: boolean;
	isUpdatingProfile: boolean;
	isCheckingAuth: boolean;
	onlineUsers: string[];
	// socket: SocketIOClient.Socket | null;
	checkAuth: () => Promise<void>;
	register: (data: RegisterFormData) => void;
	login: (data: LoginDetails) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
	authUser: null,
	isSigningUp: false,
	isLoggingIn: false,
	isUpdatingProfile: false,
	isCheckingAuth: true,
	onlineUsers: [],
	socket: null,

	checkAuth: async () => {
		try {
			const res = await getLoggedInUser();
			set({ authUser: res.data });
		} catch (err) {
			set({ authUser: null });
		} finally {
			set({ isCheckingAuth: false });
		}
	},
	register: async (data: RegisterFormData) => {
		set({ isSigningUp: true });
		try {
			const res = await registerUser(data);
			set({ authUser: res.data });
			toast.success('Account created successfully');
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Failed to create account';
			toast.error(message);
		} finally {
			set({ isSigningUp: false });
		}
	},
	login: async (data: LoginDetails) => {
		set({ isLoggingIn: true });
		try {
			const res = await loginUser(data);
			set({ authUser: res.data });
			toast.success('Logged In Successfully');
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Failed to login';
			toast.error(message);
		} finally {
			set({ isLoggingIn: false });
		}
	},
}));
