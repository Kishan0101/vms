const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Visitor = require('../models/visitor');
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Get all visitors (admin can see all, company can see their own visitors)
router.get('/', authMiddleware(['admin', 'company', 'receptionist']), async (req, res) => {
  try {
    let visitors;
    if (req.user.role === 'admin') {
      visitors = await Visitor.find();
    } else if (req.user.role === 'company') {
      visitors = await Visitor.find({ companyId: req.user.id });
    } else {
      const user = await User.findById(req.user.id);
      visitors = await Visitor.find({ companyId: user.companyId });
    }
    res.json(visitors);
  } catch (error) {
    console.error('Error fetching visitors:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get visitors by company ID
router.get('/company/:companyId', authMiddleware(['company', 'receptionist']), async (req, res) => {
  try {
    const visitors = await Visitor.find({ companyId: req.params.companyId });
    res.json(visitors);
  } catch (error) {
    console.error('Error fetching visitors by company:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new visitor
router.post('/', authMiddleware(['admin', 'receptionist']), async (req, res) => {
  try {
    const { name, email, phone, companyId, status, contactEmail } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !companyId) {
      return res.status(400).json({ message: 'Name, email, phone, and companyId are required' });
    }

    // Verify companyId exists in the database (as a string, matching a user's _id)
    const companyExists = await User.findOne({ _id: companyId, role: 'company' });
    if (!companyExists) {
      return res.status(400).json({ message: 'Company not found' });
    }

    const visitor = new Visitor({
      name,
      email,
      phone,
      companyId,
      status: status || 'pending',
      contactEmail,
    });

    await visitor.save();
    res.status(201).json(visitor);
  } catch (error) {
    console.error('Error creating visitor:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update visitor status
router.put('/:id/status', authMiddleware(['admin', 'company']), async (req, res) => {
  try {
    const { status } = req.body;
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });

    visitor.status = status;
    await visitor.save();
    res.json(visitor);
  } catch (error) {
    console.error('Error updating visitor status:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update visitor
router.put('/:id', authMiddleware(['admin', 'company', 'receptionist']), async (req, res) => {
  try {
    const { name, email, phone, contactEmail } = req.body;
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });

    visitor.name = name || visitor.name;
    visitor.email = email || visitor.email;
    visitor.phone = phone || visitor.phone;
    visitor.contactEmail = contactEmail || visitor.contactEmail;
    await visitor.save();
    res.json(visitor);
  } catch (error) {
    console.error('Error updating visitor:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete visitor
router.delete('/:id', authMiddleware(['admin', 'company', 'receptionist']), async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });

    await visitor.remove();
    res.json({ message: 'Visitor deleted' });
  } catch (error) {
    console.error('Error deleting visitor:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send email notification for new visitor
router.post('/notify', authMiddleware(['admin', 'receptionist']), async (req, res) => {
  try {
    const { visitorId, contactEmail } = req.body;
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });

    const approveLink = `${process.env.FRONTEND_URL}/visitors/approve/${visitor._id}`;
    const rejectLink = `${process.env.FRONTEND_URL}/visitors/reject/${visitor._id}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: contactEmail,
      subject: 'New Visitor Request - Action Required',
      html: `
        <h2>New Visitor Request</h2>
        <p>A new visitor has been added:</p>
        <p><strong>Name:</strong> ${visitor.name}</p>
        <p><strong>Email:</strong> ${visitor.email}</p>
        <p><strong>Phone:</strong> ${visitor.phone}</p>
        <p>Please approve or reject this visitor:</p>
        <p>
          <a href="${approveLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Approve</a>
          <a href="${rejectLink}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-left: 10px;">Reject</a>
        </p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Notification email sent' });
  } catch (error) {
    console.error('Error sending notification email:', error.message);
    res.status(500).json({ message: 'Failed to send notification email', error: error.message });
  }
});

// Approve visitor via email link
router.get('/approve/:id', async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).send('Visitor not found');

    visitor.status = 'allowed';
    await visitor.save();
    res.send(`
      <h2>Visitor Approved</h2>
      <p>The visitor ${visitor.name} has been approved.</p>
      <p><a href="${process.env.FRONTEND_URL}/visitors">Return to Visitors</a></p>
    `);
  } catch (error) {
    console.error('Error approving visitor:', error.message);
    res.status(500).send('Server error');
  }
});

// Reject visitor via email link
router.get('/reject/:id', async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).send('Visitor not found');

    visitor.status = 'rejected';
    await visitor.save();
    res.send(`
      <h2>Visitor Rejected</h2>
      <p>The visitor ${visitor.name} has been rejected.</p>
      <p><a href="${process.env.FRONTEND_URL}/visitors">Return to Visitors</a></p>
    `);
  } catch (error) {
    console.error('Error rejecting visitor:', error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;