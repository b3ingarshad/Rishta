const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const User = require('../models/User');
const crypto = require('crypto');

// ------------------ Multer Config for File Upload ------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// ------------------ Nodemailer Config ------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Store OTPs temporarily
let otpStore = {};

// ------------------ Generate Unique Referral ID ------------------
const generateReferralId = async () => {
  const makeId = () => 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase();
  let id = makeId();
  let exists = await User.findOne({ referralId: id });
  let attempts = 0;
  while (exists && attempts < 10) {
    id = makeId();
    exists = await User.findOne({ referralId: id });
    attempts++;
  }
  if (exists) throw new Error('Could not generate unique referral id');
  return id;
};

router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

  

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });


    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;

    // Send OTP
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP',
      text: `Your OTP is: ${otp}`
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
});


router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] && otpStore[email] == otp) {
    delete otpStore[email];
    res.json({ message: "OTP verified successfully" });
  } else {
    res.status(400).json({ message: "Invalid OTP" });
  }
});


// ------------------ Get Sponsor Name ------------------
router.get("/get-sponsor/:referralCode", async (req, res) => {
  try {
    const { referralCode } = req.params;
    const user = await User.findOne({ referralId: referralCode });

    if (!user) return res.status(404).json({ message: "Invalid Referral Code" });

    res.json({ sponsorName: user.fullName });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------ Register ------------------
router.post('/register', upload.fields([{ name: 'aadharPhoto' }, { name: 'panPhoto' }]), async (req, res) => {
  try {
    const data = req.body;
    const files = req.files;

    if (!data.email || !data.password || !data.fullName || !data.aadharNumber) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const existingEmail = await User.findOne({ email: data.email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

    const existingMobile = await User.findOne({ mobile: data.mobile });
    if (existingMobile) return res.status(400).json({ message: 'Mobile number already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(data.password, salt);

    const referralId = await generateReferralId();

    const user = new User({
      fullName: data.fullName,
      dob: data.dob ? new Date(data.dob) : null,
      gender: data.gender,
      mobile: data.mobile,
      address: data.address,
      country: data.country || 'India',
      city: data.city,
      state: data.state,
      pinCode: data.pinCode,
      aadharNumber: data.aadharNumber,
      panNumber: data.panNumber,
      aadharPhoto: files.aadharPhoto ? files.aadharPhoto[0].path : "",
      panPhoto: files.panPhoto ? files.panPhoto[0].path : "",
      email: data.email.toLowerCase(),
      password: hashed,
      education: data.education,
      profession: data.profession,
      nomineeName: data.nomineeName,
      nomineeRelation: data.nomineeRelation,
      role: data.role && data.role === 'admin' ? 'admin' : 'user',
      referralId,
      sponsorName: data.sponsorName || '',
      referredBy: data.referralCode || ''
    });

    await user.save();

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    const userSafe = user.toObject();
    delete userSafe.password;

    res.status(201).json({ token, user: userSafe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ------------------ Login ------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Provide email and password' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    const userSafe = user.toObject();
    delete userSafe.password;
    res.json({ token, user: userSafe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Add User API
router.post('/admin/add-user', upload.fields([{ name: 'aadharPhoto' }, { name: 'panPhoto' }]), async (req, res) => {
  try {
    const data = req.body;
    const files = req.files;

    if (!data.email || !data.fullName || !data.aadharNumber) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: data.email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

    // Check if mobile already exists
    const existingMobile = await User.findOne({ mobile: data.mobile });
    if (existingMobile) return res.status(400).json({ message: 'Mobile number already registered' });

    // Auto-generate password (8 characters)
    const autoPassword = crypto.randomBytes(4).toString('hex'); // 8 length
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(autoPassword, salt);

    // Generate referral ID
    const referralId = await generateReferralId();

    // Create new user
    const user = new User({
      fullName: data.fullName,
      dob: data.dob ? new Date(data.dob) : null,
      gender: data.gender,
      mobile: data.mobile,
      address: data.address,
      country: data.country || 'India',
      city: data.city,
      state: data.state,
      pinCode: data.pinCode,
      aadharNumber: data.aadharNumber,
      panNumber: data.panNumber,
      aadharPhoto: files.aadharPhoto ? files.aadharPhoto[0].path : "",
      panPhoto: files.panPhoto ? files.panPhoto[0].path : "",
      email: data.email.toLowerCase(),
      password: hashed,
      education: data.education,
      profession: data.profession,
      nomineeName: data.nomineeName,
      nomineeRelation: data.nomineeRelation,
      role: 'user',
      referralId,
      sponsorName: "Rishta Matrimonial",
      referredBy: "REFRM11RM1R"
    });
  
    await user.save();

    // Send email with credentials
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: data.email,
      subject: 'Your Account Details',
      text: `Hello ${data.fullName},\n\nYour account has been created successfully.\n\nEmail: ${data.email}\nPassword: ${autoPassword}\n\nPlease change your password after login.`
    });

    res.status(201).json({ message: "User created successfully, credentials sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT - Edit User
router.put('/admin/edit-user/:id', upload.fields([{ name: 'aadharPhoto' }, { name: 'panPhoto' }]), async (req, res) => {
  try {
    const userId = req.params.id;
    const data = req.body;
    const files = req.files;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if email/mobile is already used by someone else
    if (data.email) {
      const existingEmail = await User.findOne({ email: data.email.toLowerCase(), _id: { $ne: userId } });
      if (existingEmail) return res.status(400).json({ message: 'Email already in use' });
    }
    if (data.mobile) {
      const existingMobile = await User.findOne({ mobile: data.mobile, _id: { $ne: userId } });
      if (existingMobile) return res.status(400).json({ message: 'Mobile already in use' });
    }

    // Update fields
    user.fullName = data.fullName || user.fullName;
    user.dob = data.dob ? new Date(data.dob) : user.dob;
    user.gender = data.gender || user.gender;
    user.mobile = data.mobile || user.mobile;
    user.address = data.address || user.address;
    user.country = data.country || user.country;
    user.city = data.city || user.city;
    user.state = data.state || user.state;
    user.pinCode = data.pinCode || user.pinCode;
    user.aadharNumber = data.aadharNumber || user.aadharNumber;
    user.panNumber = data.panNumber || user.panNumber;
    user.aadharPhoto = files.aadharPhoto ? files.aadharPhoto[0].path : user.aadharPhoto;
    user.panPhoto = files.panPhoto ? files.panPhoto[0].path : user.panPhoto;
    user.email = data.email ? data.email.toLowerCase() : user.email;
    user.education = data.education || user.education;
    user.profession = data.profession || user.profession;
    user.nomineeName = data.nomineeName || user.nomineeName;
    user.nomineeRelation = data.nomineeRelation || user.nomineeRelation;

    // Referral & Sponsor remain unchanged unless provided
    user.referralId = user.referralId || (await generateReferralId());
    user.sponsorName = data.sponsorName || user.sponsorName || "Rishta Matrimonial";
    user.referredBy = data.referredBy || user.referredBy || "REFRM11RM1R";

    await user.save();
    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
  
module.exports = router;
