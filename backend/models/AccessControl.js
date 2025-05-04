const mongoose = require('mongoose');

const accessControlSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['admin', 'company', 'receptionist'],
  },
  resource: {
    type: String,
    required: true,
  },
  actions: {
    type: [String],
    required: true,
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('AccessControl', accessControlSchema);