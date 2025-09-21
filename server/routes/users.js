const express = require('express');
const router = express.Router();
const User = require('../models/User');

function calculateAge(dobString) {
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// Create user
router.post('/', async (req, res) => {
  try {
    const {
      firstName, lastName, dob, gender, country,
      pin, state, city, mobile, email, address,
      referral, connectedMember
    } = req.body;

    if (
      !firstName || !lastName || !dob || !gender || !country ||
      !pin || !state || !city || !mobile || !email || !address
    ) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
    }

    if (calculateAge(dob) < 18) {
      return res.status(400).json({ error: 'User must be at least 18 years old.' });
    }

    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      return res.status(400).json({ error: 'Email must be unique.' });
    }

    // Optional referral uniqueness handled by sparse/partial index
    if (referral) {
      const existingReferralUser = await User.findOne({ referral });
      if (existingReferralUser) {
        return res.status(400).json({ error: 'Referral code must be unique.' });
      }
    }

    const user = new User({
      firstName, lastName, dob, gender, country,
      pin, state, city, mobile, email, address,
      referral, connectedMember
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} must be unique.` });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;

    const requiredFields = [
      "firstName", "lastName", "dob", "gender", "country",
      "pin", "state", "city", "mobile", "email", "address"
    ];
    for (const field of requiredFields) {
      if (!(field in updates) || !updates[field]) {
        return res.status(400).json({ error: `Field ${field} is required.` });
      }
    }

    if (updates.dob && calculateAge(updates.dob) < 18) {
      return res.status(400).json({ error: 'User must be at least 18 years old.' });
    }

    const emailUser = await User.findOne({ email: updates.email });
    if (emailUser && emailUser._id.toString() !== req.params.id) {
      return res.status(400).json({ error: 'Email must be unique.' });
    }

    if (updates.referral) {
      const referralUser = await User.findOne({ referral: updates.referral });
      if (referralUser && referralUser._id.toString() !== req.params.id) {
        return res.status(400).json({ error: 'Referral code must be unique.' });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} must be unique.` });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
