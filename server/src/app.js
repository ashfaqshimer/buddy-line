import express from 'express';
import { config } from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Local imports
import { connectDb } from './config/db.js';
import errorHandler from './middleware/errorHandler.middleware.js';
import routes from './routes/index.js';

// Load env vars
config({ path: '.env' });

// Connect to database
connectDb();

const app = express();

app.use(express.json());

// Dev loggin middleware
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(cookieParser());
// // Set static folder
// app.use(express.static(join(__dirname, 'public')));

// Mount routers
app.use('/api/v1/', routes);

// // Error handler
app.use(errorHandler);

export default app;
