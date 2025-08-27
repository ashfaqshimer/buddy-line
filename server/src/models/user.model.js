import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		fullName: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
		},
		profilePic: {
			type: String,
			default: '',
		},
	},
	{ timestamps: true }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		next();
	}
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function (next) {
	return jsonwebtoken.sign({ id: this._id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRE,
	});
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
