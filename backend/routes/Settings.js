const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const authMiddleware = require('../middleware/auth');

// Get all settings
router.get('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const settings = await Setting.find();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new setting
router.post('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || !value) {
      return res.status(400).json({ message: 'Key and value are required' });
    }

    const existingSetting = await Setting.findOne({ key });
    if (existingSetting) {
      return res.status(400).json({ message: 'Setting with this key already exists' });
    }

    const setting = new Setting({ key, value });
    await setting.save();
    res.status(201).json(setting);
  } catch (error) {
    console.error('Error creating setting:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a setting
router.put('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const { key, value } = req.body;
    const setting = await Setting.findById(req.params.id);
    if (!setting) return res.status(404).json({ message: 'Setting not found' });

    setting.key = key || setting.key;
    setting.value = value || setting.value;
    await setting.save();
    res.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a setting
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const setting = await Setting.findById(req.params.id);
    if (!setting) return res.status(404).json({ message: 'Setting not found' });

    await setting.remove();
    res.json({ message: 'Setting deleted' });
  } catch (error) {
    console.error('Error deleting setting:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;