import User from '../models/user.model.js';
import cloudinary from '../utils/cloudinary.js';
import ErrorResponse from '../utils/ErrorResponse.js';

// @desc    Get current logged in user profile
// @route   GET /api/v1/users/me
// @access  Private
export const getMe = async (req, res, next) => {
	// User is available in req.user from the protect middleware
	const user = await User.findById(req.user.id);
	
	res.status(200).json({
		success: true,
		data: user
	});
};

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
	const { profilePic } = req.body ?? {};
    const userId = req.user._id;

    if (!profilePic) {
		return next(new ErrorResponse("Profile pic is required", 400));
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );
	
	res.status(200).json({
		success: true,
		data: updatedUser
	});
};

// @desc    Delete user account
// @route   DELETE /api/v1/users/me
// @access  Private
export const deleteAccount = async (req, res, next) => {
	await User.findByIdAndDelete(req.user.id);
	
	res.status(200).json({
		success: true,
		data: 'Account deleted successfully'
	});
};