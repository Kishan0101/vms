import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import Navbar from '../Components/Navbar';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState([]);
  const [newSetting, setNewSetting] = useState({ key: '', value: '' });
  const [editingSetting, setEditingSetting] = useState(null);
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

        // Fetch settings (placeholder API)
        const settingsRes = await axios.get(`${process.env.REACT_APP_API_URL}/settings`, config);
        setSettings(settingsRes.data || []);
      } catch (err) {
        console.error('Error fetching settings:', err.response?.data);
        setError(err.response?.data?.message || err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddSetting = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/settings`, newSetting, config);
      setSettings([...settings, res.data]);
      setNewSetting({ key: '', value: '' });
    } catch (err) {
      console.error('Error adding setting:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to add setting');
    }
  };

  const handleEditSetting = (setting) => {
    setEditingSetting(setting);
    setNewSetting({ key: setting.key, value: setting.value });
  };

  const handleUpdateSetting = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/settings/${editingSetting._id}`, newSetting, config);
      setSettings(settings.map((s) => (s._id === editingSetting._id ? res.data : s)));
      setEditingSetting(null);
      setNewSetting({ key: '', value: '' });
    } catch (err) {
      console.error('Error updating setting:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to update setting');
    }
  };

  const handleDeleteSetting = async (id) => {
    if (!window.confirm('Are you sure you want to delete this setting?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL}/settings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(settings.filter((s) => s._id !== id));
    } catch (err) {
      console.error('Error deleting setting:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to delete setting');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          className="ml-4 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Log Out
        </button>
      </div>
    );
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
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">Settings</h1>

          <form onSubmit={editingSetting ? handleUpdateSetting : handleAddSetting} className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Setting Key (e.g., maxVisitors)"
                value={newSetting.key}
                onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                className="p-2 rounded-lg bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200"
                required
              />
              <input
                type="text"
                placeholder="Setting Value"
                value={newSetting.value}
                onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                className="p-2 rounded-lg bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200"
                required
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                className="bg-accent text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {editingSetting ? 'Update Setting' : 'Add Setting'}
              </button>
              {editingSetting && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSetting(null);
                    setNewSetting({ key: '', value: '' });
                  }}
                  className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-4 text-left text-gray-700">Key</th>
                  <th className="p-4 text-left text-gray-700">Value</th>
                  <th className="p-4 text-left text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((setting) => (
                  <tr key={setting._id} className="border-b hover:bg-gray-50 transition-colors duration-200">
                    <td className="p-4">{setting.key}</td>
                    <td className="p-4">{setting.value}</td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => handleEditSetting(setting)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSetting(setting._id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;