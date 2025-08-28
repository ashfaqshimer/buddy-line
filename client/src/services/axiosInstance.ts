import axios from 'axios';

const axiosInstance = axios.create({
	baseURL:
		import.meta.env.MODE === 'development'
			? 'http://localhost:5001'
			: import.meta.env.VITE_API_URL,
	withCredentials: true,
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
	(config) => {
		// Get the token from localStorage or wherever it's stored
		const token = localStorage.getItem('token');

		// If a token exists, attach it to the headers
		if (token) {
			config.headers.Authorization = `Bearer ${JSON.parse(token)}`;
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

export default axiosInstance;
