const mongoose = require('mongoose');

const accessRuleSchema = new mongoose.Schema({
  role: { type: String, enum: ['admin', 'company', 'receptionist'], required: true },
  resource: { type: String, required: true },
  action: { type: String, enum: ['read', 'write', 'delete'], required: true },
});

module.exports = mongoose.models.AccessRule || mongoose.model('AccessRule', accessRuleSchema);