import api from './axiosInstance';
import { extractErrorMessage } from '../utils/errorHandler';

const MESSAGE_URL = '/api/v1/messages';

export const getSidebarUsers = async () => {
	try {
		const response = await api.get(`${MESSAGE_URL}/users`);
		return response.data;
	} catch (err: unknown) {
		throw new Error(extractErrorMessage(err, 'Error logging in'));
	}
};

export const getUserMessages = async (userId: string) => {
	try {
		const response = await api.get(`${MESSAGE_URL}/${userId}`);
		return response.data;
	} catch (err: unknown) {
		throw new Error(extractErrorMessage(err, 'Error getting messages'));
	}
};

export const sendMessage = async (messageData: {
	userId: string;
	messageText: string;
}) => {
	const { userId, messageText } = messageData;
	try {
		const response = await api.post(
			`${MESSAGE_URL}/send/${userId}`,
			messageText
		);
		return response.data;
	} catch (err: unknown) {
		throw new Error(extractErrorMessage(err, 'Error sending message'));
	}
};
