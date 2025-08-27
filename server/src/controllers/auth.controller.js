import User from '../models/user.model.js';

// @desc    Create a user
// @route   POST /api/v1/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
	const user = await User.create(req.body);
	// Hide the password
	user.password = undefined;

	sendTokenResponse(user, 200, res, user);
};
