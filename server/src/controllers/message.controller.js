import User from '../models/user.model.js';

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
