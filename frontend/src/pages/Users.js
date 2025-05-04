import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import Navbar from '../Components/Navbar';

const Users = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]); // To store list of company users for admin
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'admin', companyId: '' });
  const [editingUser, setEditingUser] = useState(null);
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

        // Fetch users based on role
        let usersRes;
        if (currentUser.role === 'admin') {
          usersRes = await axios.get(`${process.env.REACT_APP_API_URL}/users`, config);
        } else if (currentUser.role === 'company') {
          usersRes = await axios.get(`${process.env.REACT_APP_API_URL}/users`, config);
          usersRes.data = usersRes.data.filter(u => u.role === 'receptionist' && u.companyId === currentUser.id);
        }
        setUsers(usersRes.data);

        // Fetch company users for admin dropdown
        if (currentUser.role === 'admin') {
          const companyUsers = usersRes.data.filter(u => u.role === 'company');
          setCompanies(companyUsers);
        }
      } catch (err) {
        console.error('Error in Users fetchData:', err.response?.data || err.message);
        setError(err.response?.data?.message || err.message || 'Failed to load users data');
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

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const userData = {
        ...newUser,
        companyId: user.role === 'company' ? user.id : (newUser.role === 'receptionist' ? newUser.companyId : undefined),
      };
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/users`, userData, config);
      setUsers([...users, res.data]);
      setNewUser({ name: '', email: '', password: '', role: user.role === 'company' ? 'receptionist' : 'admin', companyId: '' });
    } catch (err) {
      console.error('Error adding user:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to add user');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      companyId: user.companyId || '',
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const userData = {
        ...newUser,
        companyId: newUser.role === 'receptionist' ? newUser.companyId : undefined,
      };
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/users/${editingUser._id}`, userData, config);
      setUsers(users.map((u) => (u._id === editingUser._id ? res.data : u)));
      setEditingUser(null);
      setNewUser({ name: '', email: '', password: '', role: user.role === 'company' ? 'receptionist' : 'admin', companyId: '' });
    } catch (err) {
      console.error('Error updating user:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      console.error('Error deleting user:', err.response?.data);
      alert(err.response?.data?.message || 'Failed to delete user');
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
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">Users</h1>

          <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="p-2 rounded-lg bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="p-2 rounded-lg bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="p-2 rounded-lg bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200"
                required={!editingUser}
              />
              {user.role === 'admin' ? (
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value, companyId: '' })}
                  className="p-2 rounded-lg bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="company">Company</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              ) : (
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value, companyId: '' })}
                  className="p-2 rounded-lg bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200"
                  required
                  disabled
                >
                  <option value="receptionist">Receptionist</option>
                </select>
              )}
              {user.role === 'admin' && newUser.role === 'receptionist' && (
                <select
                  value={newUser.companyId}
                  onChange={(e) => setNewUser({ ...newUser, companyId: e.target.value })}
                  className="p-2 rounded-lg bg-gray-200 border border-gray-300 focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200"
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name} (ID: {company.companyId})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                className="bg-accent text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {editingUser ? 'Update User' : 'Add User'}
              </button>
              {editingUser && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setNewUser({ name: '', email: '', password: '', role: user.role === 'company' ? 'receptionist' : 'admin', companyId: '' });
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
                  <th className="p-4 text-left text-gray-700">Name</th>
                  <th className="p-4 text-left text-gray-700">Email</th>
                  <th className="p-4 text-left text-gray-700">Role</th>
                  <th className="p-4 text-left text-gray-700">Company ID</th>
                  <th className="p-4 text-left text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b hover:bg-gray-50 transition-colors duration-200">
                    <td className="p-4">{u.name}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">{u.role}</td>
                    <td className="p-4">{u.companyId || 'N/A'}</td>
                    <td className="p-4 flex gap-2">
                      {user.role === 'admin' && (
                        <>
                          <button
                            onClick={() => handleEditUser(u)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Delete
                          </button>
                        </>
                      )}
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

export default Users;