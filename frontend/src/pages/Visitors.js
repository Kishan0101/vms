import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import Navbar from '../Components/Navbar';

const Visitors = () => {
  const [user, setUser] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [newVisitor, setNewVisitor] = useState({ name: '', email: '', phone: '', contactEmail: '' });
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [badgeCount, setBadgeCount] = useState(0);
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
        let currentUser;
        if (storedUser) {
          currentUser = storedUser;
        } else {
          const userRes = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`, config);
          currentUser = userRes.data;
        }
        setUser(currentUser);

        // Fetch visitors
        const visitorsUrl =
          currentUser.role === 'admin'
            ? `${process.env.REACT_APP_API_URL}/visitors`
            : `${process.env.REACT_APP_API_URL}/visitors/company/${currentUser.id}`;
        const visitorsRes = await axios.get(visitorsUrl, config);
        setVisitors(visitorsRes.data);

        // Fetch badge count (pending visitors)
        const pendingCount = visitorsRes.data.filter(v => v.status === 'pending').length;
        setBadgeCount(pendingCount);
      } catch (err) {
        console.error('Error in Visitors fetchData:', err.response?.data || err.message);
        setError(err.response?.data?.message || err.message || 'Failed to load visitors data');
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

  const handleAddVisitor = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const visitor = {
        ...newVisitor,
        companyId: user.role === 'receptionist' ? user.companyId : user._id,
        status: 'pending',
      };
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/visitors`, visitor, config);
      setVisitors([...visitors, res.data]);
      setBadgeCount(badgeCount + 1);
      setNewVisitor({ name: '', email: '', phone: '', contactEmail: '' });

      // Send email notification
      await axios.post(`${process.env.REACT_APP_API_URL}/visitors/notify`, {
        visitorId: res.data._id,
        contactEmail: visitor.contactEmail,
      }, config);
    } catch (err) {
      console.error('Error adding visitor:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to add visitor');
    }
  };

  const handleEditVisitor = (visitor) => {
    setEditingVisitor(visitor);
    setNewVisitor({ name: visitor.name, email: visitor.email, phone: visitor.phone, contactEmail: visitor.contactEmail || '' });
  };

  const handleUpdateVisitor = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/visitors/${editingVisitor._id}`, newVisitor, config);
      setVisitors(visitors.map((v) => (v._id === editingVisitor._id ? res.data : v)));
      setEditingVisitor(null);
      setNewVisitor({ name: '', email: '', phone: '', contactEmail: '' });
    } catch (err) {
      console.error('Error updating visitor:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to update visitor');
    }
  };

  const handleDeleteVisitor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this visitor?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL}/visitors/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedVisitors = visitors.filter((v) => v._id !== id);
      setVisitors(updatedVisitors);
      const pendingCount = updatedVisitors.filter(v => v.status === 'pending').length;
      setBadgeCount(pendingCount);
    } catch (err) {
      console.error('Error deleting visitor:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to delete visitor');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/visitors/${id}/status`,
        { status },
        config
      );
      const updatedVisitors = visitors.map((v) => (v._id === id ? res.data : v));
      setVisitors(updatedVisitors);
      const pendingCount = updatedVisitors.filter(v => v.status === 'pending').length;
      setBadgeCount(pendingCount);
    } catch (err) {
      console.error('Error updating visitor status:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to update visitor status');
    }
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Visitors</h1>
            {badgeCount > 0 && (
              <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {badgeCount} Pending
              </span>
            )}
          </div>
          {(user.role === 'receptionist' || user.role === 'admin') && (
            <form onSubmit={editingVisitor ? handleUpdateVisitor : handleAddVisitor} className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={newVisitor.name}
                  onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                  className="p-2 rounded-lg bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newVisitor.email}
                  onChange={(e) => setNewVisitor({ ...newVisitor, email: e.target.value })}
                  className="p-2 rounded-lg bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200"
                  required
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={newVisitor.phone}
                  onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                  className="p-2 rounded-lg bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200"
                  required
                />
                <input
                  type="email"
                  placeholder="Contact Email (to notify)"
                  value={newVisitor.contactEmail}
                  onChange={(e) => setNewVisitor({ ...newVisitor, contactEmail: e.target.value })}
                  className="p-2 rounded-lg bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200"
                  required
                />
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  className="bg-accent text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {editingVisitor ? 'Update Visitor' : 'Add Visitor'}
                </button>
                {editingVisitor && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVisitor(null);
                      setNewVisitor({ name: '', email: '', phone: '', contactEmail: '' });
                    }}
                    className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-4 text-left text-gray-700">Name</th>
                  <th className="p-4 text-left text-gray-700">Email</th>
                  <th className="p-4 text-left text-gray-700">Phone</th>
                  <th className="p-4 text-left text-gray-700">Status</th>
                  <th className="p-4 text-left text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v._id} className="border-b hover:bg-gray-50 transition-colors duration-200">
                    <td className="p-4">{v.name}</td>
                    <td className="p-4">{v.email}</td>
                    <td className="p-4">{v.phone}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          v.status === 'allowed' ? 'bg-green-100 text-green-800' :
                          v.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2 flex-wrap">
                      {(user.role === 'company' || user.role === 'admin') && v.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(v._id, 'allowed')}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            Allow
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(v._id, 'rejected')}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEditVisitor(v)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVisitor(v._id)}
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

export default Visitors;