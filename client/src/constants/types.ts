export type Message = {
	senderId: string;
	receiverId: string;
	text: string;
};

export type User = {
	name: string;
	email: string;
	profilePic?: string;
	_id: string;
};
