import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import Navbar from '../Components/Navbar';
import Chart from '../Components/Chart';

const Analytics = () => {
  const [user, setUser] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [visitorTrends, setVisitorTrends] = useState([]);
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

        // Fetch analytics data
        try {
          const analyticsRes = await axios.get(`${process.env.REACT_APP_API_URL}/analytics/stats`, config);
          setAnalyticsData(analyticsRes.data);
        } catch (analyticsErr) {
          console.error('Error fetching analytics data:', analyticsErr.response?.data || analyticsErr.message);
          setAnalyticsData(null);
        }

        // Fetch visitor trends
        try {
          const trendsRes = await axios.get(`${process.env.REACT_APP_API_URL}/analytics/visitors/trend`, config);
          setVisitorTrends(trendsRes.data);
        } catch (trendsErr) {
          console.error('Error fetching visitor trends:', trendsErr.response?.data || trendsErr.message);
          setVisitorTrends([]);
        }
      } catch (err) {
        console.error('Error in Analytics fetchData:', err.response?.data || err.message);
        setError(err.response?.data?.message || err.message || 'Failed to load analytics data');
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
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">Analytics</h1>
          {analyticsData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Total Users</h2>
                <p className="text-2xl sm:text-3xl text-gray-900">{analyticsData.totalUsers}</p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Total Visitors</h2>
                <p className="text-2xl sm:text-3xl text-gray-900">{analyticsData.totalVisitors}</p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Active Visitors</h2>
                <p className="text-2xl sm:text-3xl text-gray-900">{analyticsData.activeVisitors}</p>
              </div>
            </div>
          ) : (
            <p className="text-red-500 mb-8">Unable to load analytics data. Please try again later.</p>
          )}
          {visitorTrends.length > 0 ? (
            <Chart data={visitorTrends} />
          ) : (
            <p className="text-gray-500">No visitor trend data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;