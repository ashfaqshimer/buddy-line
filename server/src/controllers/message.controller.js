import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import cloudinary from '../utils/cloudinary.js';
import ErrorResponse from '../utils/ErrorResponse.js';

// @desc    Get all users to display on sidebar
// @route   GET /api/v1/messages/users
// @access  Private
export const getUsersForSidebar = async (req, res, next) => {
	const loggedInUserId = req.user._id;
	const filteredUsers = await User.find({
		_id: { $ne: loggedInUserId },
	}).select('-password');

	res.status(200).json({
		success: true,
		data: filteredUsers,
	});
};

// @desc    Display conversation with user
// @route   GET /api/v1/messages/users
// @access  Private
export const getMessages = async (req, res, next) => {
	const { _id: userToChatId } = req.params;

	const myId = req.user._id;

	const messages = await Message.find({
		$or: [
			{ senderId: myId, receiverId: userToChatId },
			{ senderId: userToChatId, receiverId: myId },
		],
	});

	res.status(200).json({
		success: true,
		data: messages,
	});
};

// @desc    Send a message to a user
// @route   POST /api/v1/messages/send/:id
// @access  Private
export const sendMessage = async (req, res, next) => {
	const { text, image } = req.body ?? {};
	if (!text && !image)
		return next(new ErrorResponse("Please provide a 'text' or 'image'."));
	const { id: receiverId } = req.params;
	const senderId = req.user._id;

	let imageUrl;
	if (image) {
		// Upload base64 image to cloudinary
		const uploadResponse = await cloudinary.uploader.upload(image);
		imageUrl = uploadResponse.secure_url;
	}

	const newMessage = new Message({
		senderId,
		receiverId,
		text,
		image: imageUrl,
	});

	await newMessage.save();

	// const receiverSocketId = getReceiverSocketId(receiverId);
	// if (receiverSocketId) {
	// 	io.to(receiverSocketId).emit('newMessage', newMessage);
	// }

	res.status(201).json({ success: true, data: newMessage });
};
