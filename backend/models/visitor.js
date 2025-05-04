// models/Visitor.js
const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'allowed', 'rejected'] },
  contactEmail: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Visitor', visitorSchema);