const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
  action: { type: String, required: true }, // e.g., 'entry', 'exit'
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AccessLog', accessLogSchema);