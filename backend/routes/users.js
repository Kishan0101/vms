const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');

// Get all users (admin) or receptionists (company)
router.get('/', authMiddleware(['admin', 'company']), async (req, res) => {
  try {
    let users;
    if (req.user.role === 'admin') {
      // Admins can see all users
      users = await User.find();
    } else if (req.user.role === 'company') {
      // Company users can only see their receptionists
      users = await User.find({ role: 'receptionist', companyId: req.user.id });
    }
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new user (admin and company can create users)
router.post('/', authMiddleware(['admin', 'company']), async (req, res) => {
  try {
    const { name, email, password, role: incomingRole, companyId } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Log the incoming role for debugging
    console.log('Incoming role:', incomingRole);

    // Determine the role to use
    let role = incomingRole ? incomingRole.toLowerCase() : '';
    if (req.user.role === 'company') {
      // Force role to 'receptionist' for company users, as they can only create receptionists
      role = 'receptionist';
    } else if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let newUserData = {
      name,
      email,
      password: hashedPassword,
      role,
    };

    // Handle companyId based on role
    if (role === 'company') {
      // Fetch all company users and filter those with valid companyId (three digits)
      const companyUsers = await User.find({ role: 'company', companyId: { $regex: /^\d{3}$/ } });
      let newCompanyId = '001';
      if (companyUsers.length > 0) {
        // Find the highest valid companyId
        const highestId = companyUsers
          .map(user => parseInt(user.companyId, 10))
          .reduce((max, curr) => Math.max(max, curr), 0);
        newCompanyId = String(highestId + 1).padStart(3, '0');
      }
      console.log('Generated companyId:', newCompanyId);
      newUserData.companyId = newCompanyId;
    } else if (role === 'receptionist') {
      // If created by a company user, automatically assign their companyId
      if (req.user.role === 'company') {
        newUserData.companyId = req.user.id;
      } else {
        // If created by admin, companyId must be provided
        if (!companyId) {
          return res.status(400).json({ message: 'companyId is required for receptionists' });
        }
        newUserData.companyId = companyId;
      }
    }

    const user = new User(newUserData);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a user (admin only)
router.put('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const { name, email, password, role, companyId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    user.role = role || user.role;

    if (role === 'company') {
      // If the role is being changed to company, assign a new companyId
      if (user.role !== 'company') {
        const companyUsers = await User.find({ role: 'company', companyId: { $regex: /^\d{3}$/ } });
        let newCompanyId = '001';
        if (companyUsers.length > 0) {
          const highestId = companyUsers
            .map(user => parseInt(user.companyId, 10))
            .reduce((max, curr) => Math.max(max, curr), 0);
          newCompanyId = String(highestId + 1).padStart(3, '0');
        }
        user.companyId = newCompanyId;
      }
    } else if (role === 'receptionist') {
      if (!companyId) {
        return res.status(400).json({ message: 'companyId is required for receptionists' });
      }
      user.companyId = companyId;
    } else if (role === 'admin') {
      user.companyId = undefined; // Admins don't need companyId
    }

    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a user (admin only)
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check for dependencies (receptionists or visitors)
    if (user.role === 'company') {
      const receptionists = await User.find({ role: 'receptionist', companyId: user._id });
      const visitors = await Visitor.find({ companyId: user._id });
      if (receptionists.length > 0 || visitors.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete company with associated receptionists or visitors',
          details: {
            receptionists: receptionists.length,
            visitors: visitors.length,
          },
        });
      }
    }

    await user.remove();
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;