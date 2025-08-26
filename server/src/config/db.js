import mongoose from 'mongoose';
import chalk from 'chalk';

export const connectDb = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI);
		console.log(
			chalk.underline.bold(`MongoDB Connected: ${conn.connection.host}`)
		);
	} catch (err) {
		console.error(chalk.red(err.message));
	}
};
