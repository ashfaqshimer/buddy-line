import ErrorResponse from '../utils/ErrorResponse.js';

const errorHandler = (err, req, res, next) => {
	let error = { ...err };

	error.message = err.message;

	// Log to console for dev
	if (process.env.NODE_ENV === 'development') {
		console.error(err.stack.red);
	}

	// Mongoose bad ObjectId
	if (err.name === 'CastError') {
		const message = `Resource not found`;
		error = new ErrorResponse(message, 404);
	}

	// Mongoose duplicate key
	if (err.code === 11000) {
		const message = 'Duplicate field value entered';
		error = new ErrorResponse(message, 400);
	}

	// Mongoose validation error
	if (err.name === 'ValidationError') {
		const errors = Object.values(err.errors).map((value) => value.message);

		return res.status(400).json({ success: false, errors });
	}

	res.status(error.statusCode || 500).json({
		success: false,
		error: error.message || 'Server Error',
	});
};

export default errorHandler;
