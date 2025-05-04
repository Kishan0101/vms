const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Visitor = require('../models/visitor');
const authMiddleware = require('../middleware/auth');

// Get analytics stats (accessible to all roles)
router.get('/stats', authMiddleware(['admin', 'company', 'receptionist']), async (req, res) => {
  try {
    let totalUsers, totalVisitors, activeVisitors;

    if (req.user.role === 'admin') {
      // Admin sees all data
      totalUsers = await User.countDocuments();
      totalVisitors = await Visitor.countDocuments();
      activeVisitors = await Visitor.countDocuments({ checkOutTime: null });
    } else if (req.user.role === 'company') {
      // Company sees their own data
      totalUsers = await User.countDocuments({ companyId: req.user.id });
      totalVisitors = await Visitor.countDocuments({ companyId: req.user.id });
      activeVisitors = await Visitor.countDocuments({ companyId: req.user.id, checkOutTime: null });
    } else {
      // Receptionist sees data for their company
      const user = await User.findById(req.user.id);
      totalUsers = await User.countDocuments({ companyId: user.companyId });
      totalVisitors = await Visitor.countDocuments({ companyId: user.companyId });
      activeVisitors = await Visitor.countDocuments({ companyId: user.companyId, checkOutTime: null });
    }

    const stats = {
      totalUsers,
      totalVisitors,
      activeVisitors,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching analytics stats:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;