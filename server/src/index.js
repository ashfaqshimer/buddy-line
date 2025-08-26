import app from './app.js';
import chalk from 'chalk';

// ------------------------------SERVER CONFIGURATION-----------------------------------

const PORT = process.env.PORT || 5000;

const server = app.listen(
	PORT,
	console.log(
		chalk.yellow.bold(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
	)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
	console.error(chalk.red(`Error: ${err.message}`));
	// Close server and exit process
	server.close(() => process.exit(1));
});