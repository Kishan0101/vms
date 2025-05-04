import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex justify-between items-center p-4 bg-primary text-white shadow-md">
      <div className="text-xl font-bold flex items-center gap-3">
        <img src={logo} alt="Webbify Infotech-VMS" className="w-20 h-15 transition-transform duration-300 hover:scale-110" />
        <span className="hidden sm:block">Webbify Infotech-VMS</span>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm sm:text-base truncate max-w-xs">{user.name}</span>
        <button
          onClick={handleLogout}
          className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;