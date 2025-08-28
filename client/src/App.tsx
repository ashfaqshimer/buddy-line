import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { Loader } from 'lucide-react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

function App() {
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	if (isCheckingAuth && !authUser)
		return (
			<div className='flex items-center justify-center h-screen'>
				<Loader className='size-10 animate-spin' />
			</div>
		);
	return (
		<div>
			<Navbar />
			<Routes>
				<Route
					path='/'
					element={authUser ? <HomePage /> : <Navigate to='/login' />}
				/>
				<Route
					path='/login'
					element={!authUser ? <LoginPage /> : <Navigate to='/' />}
				/>
			</Routes>

			<Toaster />
		</div>
	);
}

export default App;
