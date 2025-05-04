const express = require('express');
const router = express.Router();
const AccessControl = require('../models/accessControl');
const authMiddleware = require('../middleware/auth');

// Get all access control rules (admin only)
router.get('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const rules = await AccessControl.find();
    res.json(rules);
  } catch (error) {
    console.error('Error fetching access control rules:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new access control rule (admin only)
router.post('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const { role, resource, actions } = req.body;

    // Validate required fields
    if (!role || !resource || !actions || !Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ message: 'Role, resource, and at least one action are required' });
    }

    // Validate actions
    const validActions = ['read', 'write'];
    const invalidActions = actions.filter((action) => !validActions.includes(action));
    if (invalidActions.length > 0) {
      return res.status(400).json({ message: `Invalid actions: ${invalidActions.join(', ')}` });
    }

    const rule = new AccessControl({ role, resource, actions });
    await rule.save();
    res.status(201).json(rule);
  } catch (error) {
    console.error('Error creating access control rule:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update an access control rule (admin only)
router.put('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const { role, resource, actions } = req.body;

    // Validate required fields
    if (!role || !resource || !actions || !Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ message: 'Role, resource, and at least one action are required' });
    }

    // Validate actions
    const validActions = ['read', 'write'];
    const invalidActions = actions.filter((action) => !validActions.includes(action));
    if (invalidActions.length > 0) {
      return res.status(400).json({ message: `Invalid actions: ${invalidActions.join(', ')}` });
    }

    const rule = await AccessControl.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    rule.role = role;
    rule.resource = resource;
    rule.actions = actions;
    await rule.save();
    res.json(rule);
  } catch (error) {
    console.error('Error updating access control rule:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete an access control rule (admin only)
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const rule = await AccessControl.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    await rule.remove();
    res.json({ message: 'Rule deleted' });
  } catch (error) {
    console.error('Error deleting access control rule:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;