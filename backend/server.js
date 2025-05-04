const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const visitorRoutes = require('./routes/visitors');
const analyticsRoutes = require('./routes/analytics');
const accessControlRoutes = require('./routes/access-control');
const settingsRoutes = require('./routes/Settings');

// Routes
try {
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/visitors', visitorRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/access-control', accessControlRoutes);
  app.use('/api/settings', settingsRoutes); // Added settings route
} catch (error) {
  console.error('Error setting up routes:', error.message);
  process.exit(1);
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)


  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Error handling for unhandled routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});