const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'company', 'receptionist'] },
  companyId: {
    type: String,
    required: function() {
      return this.role === 'receptionist'; // companyId required for receptionists
    },
    validate: {
      validator: async function(value) {
        if (this.role === 'receptionist') {
          // For receptionists, companyId must be the _id of an existing company user
          const company = await mongoose.model('User').findOne({ _id: value, role: 'company' });
          return !!company;
        }
        if (this.role === 'company') {
          // For company users, companyId should be a string like "001"
          return typeof value === 'string' && value.match(/^\d{3}$/); // e.g., "001", "002"
        }
        return true; // No validation for admins
      },
      message: props => {
        if (props.path === 'companyId' && props.value === 'receptionist') {
          return 'Invalid companyId: Must be the ID of an existing company user';
        }
        return 'Invalid companyId format';
      },
    },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);