import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log('Logging in with:', email, password);
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, { email, password });
      console.log('Login response:', res.data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to login. Please check your connection and try again.'
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1A2634] p-4">
      <div className="mb-6 flex flex-col items-center gap-2">
        <img src={logo} alt="Webbify Infotech-VMS" className="w-16 h-16 transition-transform duration-300 hover:scale-110" />
        <h1 className="text-3xl font-bold text-white">Visitor Management System</h1>
      </div>
      <form onSubmit={handleLogin} className="bg-[#2A3A4A] p-6 rounded-lg w-full max-w-sm">
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-[#4A5A6A] text-white placeholder-white focus:outline-none transition-all duration-200"
            required
          />
        </div>
        <div className="mb-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-[#4A5A6A] text-white placeholder-white focus:outline-none transition-all duration-200"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[#007BFF] text-white py-3 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none"
        >
          Login
        </button>
      </form>
      <p className="mt-4 text-white text-sm">© Webbify Infotech</p>
    </div>
  );
};

export default Login;