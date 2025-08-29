export type Message = {
	senderId: string;
	receiverId: string;
	text: string;
};

export type User = {
	name: string;
	email: string;
	imageUrl?: string;
	id: string;
};
