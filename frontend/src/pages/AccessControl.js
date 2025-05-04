import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import Navbar from '../Components/Navbar';

const AccessControl = () => {
  const [user, setUser] = useState(null);
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState({ role: '', resource: '', actions: [] });
  const [editingRule, setEditingRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // List of pages for the resource dropdown
  const pages = ['dashboard', 'users', 'access-control', 'visitors', 'analytics', 'settings'];
  const roles = ['admin', 'company', 'receptionist'];
  const possibleActions = ['read', 'write'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch authenticated user
        const storedUser = JSON.parse(localStorage.getItem('user'));
        let currentUser;
        if (storedUser) {
          currentUser = storedUser;
        } else {
          const userRes = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`, config);
          currentUser = userRes.data;
        }
        setUser(currentUser);

        // Fetch access control rules
        const rulesRes = await axios.get(`${process.env.REACT_APP_API_URL}/access-control`, config);
        setRules(rulesRes.data);
      } catch (err) {
        console.error('Error in AccessControl fetchData:', err.response?.data || err.message);
        setError(err.response?.data?.message || err.message || 'Failed to load access control data');
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

  const handleAddRule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const ruleData = {
        role: newRule.role,
        resource: newRule.resource,
        actions: newRule.actions, // Array of actions (e.g., ["read", "write"])
      };
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/access-control`, ruleData, config);
      setRules([...rules, res.data]);
      setNewRule({ role: '', resource: '', actions: [] });
    } catch (err) {
      console.error('Error adding rule:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to add rule');
    }
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setNewRule({
      role: rule.role,
      resource: rule.resource,
      actions: rule.actions || [rule.action], // Backward compatibility if action is a string
    });
  };

  const handleUpdateRule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const ruleData = {
        role: newRule.role,
        resource: newRule.resource,
        actions: newRule.actions,
      };
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/access-control/${editingRule._id}`, ruleData, config);
      setRules(rules.map((r) => (r._id === editingRule._id ? res.data : r)));
      setEditingRule(null);
      setNewRule({ role: '', resource: '', actions: [] });
    } catch (err) {
      console.error('Error updating rule:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to update rule');
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL}/access-control/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRules(rules.filter((r) => r._id !== id));
    } catch (err) {
      console.error('Error deleting rule:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to delete rule');
    }
  };

  const handleActionChange = (action) => {
    setNewRule((prev) => {
      const actions = prev.actions.includes(action)
        ? prev.actions.filter((a) => a !== action)
        : [...prev.actions, action];
      return { ...prev, actions };
    });
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">Access Control</h1>

          <form onSubmit={editingRule ? handleUpdateRule : handleAddRule} className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select
                value={newRule.role}
                onChange={(e) => setNewRule({ ...newRule, role: e.target.value })}
                className="p-2 rounded-lg bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200"
                required
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={newRule.resource}
                onChange={(e) => setNewRule({ ...newRule, resource: e.target.value })}
                className="p-2 rounded-lg bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200"
                required
              >
                <option value="">Select Resource</option>
                {pages.map((page) => (
                  <option key={page} value={page}>
                    {page.charAt(0).toUpperCase() + page.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-4">
                {possibleActions.map((action) => (
                  <label key={action} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newRule.actions.includes(action)}
                      onChange={() => handleActionChange(action)}
                      className="mr-2"
                    />
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                className="bg-accent text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {editingRule ? 'Update Rule' : 'Add Rule'}
              </button>
              {editingRule && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRule(null);
                    setNewRule({ role: '', resource: '', actions: [] });
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
                  <th className="p-4 text-left text-gray-700">Role</th>
                  <th className="p-4 text-left text-gray-700">Resource</th>
                  <th className="p-4 text-left text-gray-700">Action</th>
                  <th className="p-4 text-left text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule._id} className="border-b hover:bg-gray-50 transition-colors duration-200">
                    <td className="p-4">{rule.role}</td>
                    <td className="p-4">{rule.resource}</td>
                    <td className="p-4">
                      {Array.isArray(rule.actions)
                        ? rule.actions.join(', ')
                        : rule.action || 'N/A'}
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule._id)}
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

export default AccessControl;