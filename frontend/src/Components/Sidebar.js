import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png'; // Import the logo image

const Sidebar = ({ role }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => (location.pathname === path ? 'bg-accent text-white' : 'text-gray-200 hover:bg-accent hover:text-white');

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Hamburger button for small screens */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-transparent text-black rounded-md focus:outline-none"
        onClick={toggleSidebar}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed lg:static top-0 left-0 h-screen bg-secondary text-white p-6 transform transition-transform duration-300 ease-in-out z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:w-64 w-3/4 lg:flex lg:flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-secondary`}
      >
        <div className="pt-16 lg:pt-0">
          <div className="mb-8 flex justify-center">
            <img src={logo} alt="Webbify Infotech-VMS" className="w-20 transition-transform duration-300 hover:scale-105" />
          </div>
          <nav className="flex flex-col gap-3 flex-1">
            <Link
              to="/dashboard"
              className={`block py-3 px-4 rounded-lg transition-colors duration-200 ${isActive('/dashboard')}`}
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            {role === 'admin' && (
              <>
                <Link
                  to="/users"
                  className={`block py-3 px-4 rounded-lg transition-colors duration-200 ${isActive('/users')}`}
                  onClick={() => setIsOpen(false)}
                >
                  Users
                </Link>
                <Link
                  to="/access-control"
                  className={`block py-3 px-4 rounded-lg transition-colors duration-200 ${isActive('/access-control')}`}
                  onClick={() => setIsOpen(false)}
                >
                  Access Control
                </Link>
              </>
            )}
            {role === 'company' && (
              <Link
                to="/users"
                className={`block py-3 px-4 rounded-lg transition-colors duration-200 ${isActive('/users')}`}
                onClick={() => setIsOpen(false)}
              >
                Receptionists
              </Link>
            )}
            <Link
              to="/visitors"
              className={`block py-3 px-4 rounded-lg transition-colors duration-200 ${isActive('/visitors')}`}
              onClick={() => setIsOpen(false)}
            >
              Visitors
            </Link>
            <Link
              to="/analytics"
              className={`block py-3 px-4 rounded-lg transition-colors duration-200 ${isActive('/analytics')}`}
              onClick={() => setIsOpen(false)}
            >
              Analytics
            </Link>
            {role === 'admin' && (
              <Link
                to="/settings"
                className={`block py-3 px-4 rounded-lg transition-colors duration-200 ${isActive('/settings')}`}
                onClick={() => setIsOpen(false)}
              >
                Settings
              </Link>
            )}
          </nav>
          <div className="mt-auto p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for small screens when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;