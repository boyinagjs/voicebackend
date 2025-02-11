// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('./User');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || password === !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    //const expiresAt = new Date(Date.now() + Number(user.expireshours) * 60 * 60 * 1000);
    //console.log(expiresAt);
    //console.log(new Date.now());
    
    if (new Date(user.expiresAt) < new Date()) {
      return res.status(401).json({ message: 'Account expired' });
    }
    
    return res.status(200).json({
      userId: user._id,
      role: user.role,
      expiresAt: user.expiresAt
    });
  } catch (error) {
    res.status(500).json({ message: 'something error' });
  }
});

// Admin Login
router.post('/adminlogin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (email === "admin@gmail.com" && password === "admin@123") {
      return res.status(200).json({
        userId: "superadmin",
        role: "superadmin",
        expiresAt: 24,
      });
    }
    else {
      return res.status(401).json("invalid admin details");
    }
  } catch (error) {
    res.status(500).json({ message: 'server error' });
  }
});

// Create user (Admin only)
router.post('/create-user', async (req, res) => {
  try {
    const { creatorId, email, password, role, expiresInHours } = req.body;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const newUser = new User({
      email,
      password,
      role,
      expiresAt,
      expireshours: expiresInHours,
      createdBy: creatorId
    });
    await newUser.save();
    res.status(200).json("user created sucessfully");
  } catch (error) {
    res.status(500).json(error);
  }
});

// Get active users
router.get('/active-users', async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId);

    let query = { expiresAt: { $gt: new Date() } };

    if (user.role === 'admin') {
      query.createdBy = userId;
    } else if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const users = await User.find(query).populate('createdBy', 'email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;