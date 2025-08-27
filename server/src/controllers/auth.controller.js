import User from '../models/user.model.js';
import ErrorResponse from '../utils/ErrorResponse.js';

// Get token from model, create cookies and send response
const sendTokenResponse = (user, statusCode, res, data) => {
	// Create token
	const token = user.getSignedJwtToken();
	const options = {
		httpOnly: true,
		secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
		sameSite: 'strict', // Prevent CSRF attacks
		maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
	};

	if (process.env.NODE_ENV === 'production') {
		options.secure = true;
	}
	res
		.status(statusCode)
		.cookie('token', token, options)
		.json({ success: true, token, data });
};

// @desc    Create a user
// @route   POST /api/v1/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
	const user = await User.create(req.body);
	// Hide the password
	user.password = undefined;

	sendTokenResponse(user, 200, res, user);
};

// @desc    Login a user
// @route   POST /api/v1/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
	const { email, password } = req.body ?? {};
	
	if (!email || !password) {
		return next(new ErrorResponse('Please provide an email and password', 400));
	}

	const user = await User.findOne({ email }).select('+password');
	if (!user) {
		return next(new ErrorResponse('Invalid credentials', 401));
	}
	
	const isMatch = await user.matchPassword(password);
	if (!isMatch) {
		return next(new ErrorResponse('Invalid credentials', 401));
	}

	user.password = undefined;

	sendTokenResponse(user, 200, res, user);
};

// @desc    Logout user / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
export const logoutUser = (req, res, next) => {
	res.cookie('token', 'none', {
		expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
		httpOnly: true,
	});

	res.status(200).json({
		success: true,
		data: 'User logged out successfully'
	});
};