import jsonwebtoken from 'jsonwebtoken';
import ErrorResponse from '../utils/ErrorResponse.js';
import User from '../models/user.model.js';

export const protect = async (req, res, next) => {
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1];
	} else if (req.cookies.token) {
		token = req.cookies.token;
	}
	// Make sure token exists
	if (!token) {
		return next(new ErrorResponse('Not authorized to access this route', 401));
	}

	try {
		// Verify token
		const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
		req.user = await User.findById(decoded.id);
		if (!req.user) {
			return next(
				new ErrorResponse('Not authorized to access this route', 401)
			);
		}
		next();
	} catch (err) {
		if (err.name === 'TokenExpiredError') {
			return next(new ErrorResponse('Token expired', 401));
		}
		return next(new ErrorResponse('Not authorized to access this route', 401));
	}
};
