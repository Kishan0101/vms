import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import Navbar from '../Components/Navbar';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch authenticated user
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
          setUser(storedUser);
        } else {
          const userRes = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`, config);
          setUser(userRes.data);
        }

        // Fetch analytics stats
        try {
          const statsRes = await axios.get(`${process.env.REACT_APP_API_URL}/analytics/stats`, config);
          setStats(statsRes.data);
        } catch (statsErr) {
          console.error('Error fetching stats:', statsErr.response?.data || statsErr.message);
          setStats(null);
        }
      } catch (err) {
        console.error('Error in Dashboard fetchData:', err.response?.data || err.message);
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center h-screen">No user data available</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} />
        <div className="p-4 sm:p-6 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
          {stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Total Users</h2>
                <p className="text-2xl sm:text-3xl text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Total Visitors</h2>
                <p className="text-2xl sm:text-3xl text-gray-900">{stats.totalVisitors}</p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Active Visitors</h2>
                <p className="text-2xl sm:text-3xl text-gray-900">{stats.activeVisitors}</p>
              </div>
            </div>
          ) : (
            <p className="text-red-500">Unable to load stats. Please try again later.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;