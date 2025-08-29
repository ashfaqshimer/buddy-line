import { create } from 'zustand';
import toast from 'react-hot-toast';
import type { Message, User } from '../constants/types';
import {
	getSidebarUsers,
	getUserMessages,
	sendMessage,
} from '../services/messageService';

interface ChatState {
	messages: Message[];
	users: User[];
	selectedUser: User | null;
	isUsersLoading: boolean;
	isMessagesLoading: boolean;
	getUsers: () => Promise<void>;
	getMessages: (userId: string) => Promise<void>;
	sendMessage: (message: string) => Promise<void>;
	// subscribeToMessages: () => void;
	// unsubscribeFromMessages: () => void;
	setSelectedUser: (user: User) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
	messages: [],
	users: [],
	selectedUser: null,
	isUsersLoading: false,
	isMessagesLoading: false,

	getUsers: async () => {
		set({ isUsersLoading: true });
		try {
			const res = await getSidebarUsers();
			set({ users: res.data });
		} catch (error) {
			toast.error(error.response.data.message);
		} finally {
			set({ isUsersLoading: false });
		}
	},

	getMessages: async (userId: string) => {
		set({ isMessagesLoading: true });
		try {
			const res = await getUserMessages(userId);
			set({ messages: res.data });
		} catch (error) {
			toast.error(error.response.data.message);
		} finally {
			set({ isMessagesLoading: false });
		}
	},
	sendMessage: async (message: string) => {
		const { selectedUser, messages } = get();
		try {
			const res = await sendMessage({
				userId: selectedUser.id,
				messageText: message,
			});
			set({ messages: [...messages, res.data] });
		} catch (error) {
			toast.error(error.response.data.message);
		}
	},

	// subscribeToMessages: () => {
	// 	const { selectedUser } = get();
	// 	if (!selectedUser) return;

	// 	const socket = useAuthStore.getState().socket;

	// 	socket.on('newMessage', (newMessage) => {
	// 		const isMessageSentFromSelectedUser =
	// 			newMessage.senderId === selectedUser._id;
	// 		if (!isMessageSentFromSelectedUser) return;

	// 		set({
	// 			messages: [...get().messages, newMessage],
	// 		});
	// 	});
	// },

	// unsubscribeFromMessages: () => {
	// 	const socket = useAuthStore.getState().socket;
	// 	socket.off('newMessage');
	// },

	setSelectedUser: (selectedUser: User) => set({ selectedUser }),
}));
