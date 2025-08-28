import { create } from 'zustand';
import toast from 'react-hot-toast';
import { registerUser, type RegisterFormData } from '../services/authService';

export const useAuthStore = create((set, get) => ({
	authUser: null,
	isSigningUp: false,
	isLoggingIn: false,
	isUpdatingProfile: false,
	isCheckingAuth: true,
	onlineUsers: [],
	socket: null,

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
}));
