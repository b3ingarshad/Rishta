const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const User = require('../models/User');
const crypto = require('crypto');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'rishta-users',
      allowed_formats: ['jpg', 'png', 'jpeg'],
    },
  }),
});


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

router.get("/referrals/count/:referralId", async (req, res) => {
  try {
    const { referralId } = req.params;

    // Count how many users have this referralId as sponsor
    const count = await User.countDocuments({ referredBy: referralId });

    res.json({ totalReferrals: count });
  } catch (err) {
    console.error("Error fetching referral count:", err);
    res.status(500).json({ message: "Server error" });
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

    if (!data.email || !data.password || !data.fullName) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const existingEmail = await User.findOne({ email: data.email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

    const existingMobile = await User.findOne({ mobile: data.mobile });
    if (existingMobile) return res.status(400).json({ message: 'Mobile number already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(data.password, salt);

    const referralId = await generateReferralId();

    // Upload photos to Cloudinary
    const aadharUpload = files.aadharPhoto ? await cloudinary.uploader.upload(files.aadharPhoto[0].path, { folder: 'rishta-users' }) : null;
    const panUpload = files.panPhoto ? await cloudinary.uploader.upload(files.panPhoto[0].path, { folder: 'rishta-users' }) : null;

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
      aadharPhoto: aadharUpload ? aadharUpload.secure_url : "",
      panPhoto: panUpload ? panUpload.secure_url : "",
      email: data.email.toLowerCase(),
      password: hashed,
      education: data.education,
      profession: data.profession,
      nomineeName: data.nomineeName,
      nomineeRelation: data.nomineeRelation,
      role: data.role && data.role === 'admin' ? 'admin' : 'user',
      referralId,
      sponsorName: data.sponsorName || user.sponsorName || "Mohammad Abbas Noorani",
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
    const { emailOrMobile, password } = req.body;
    if (!emailOrMobile || !password) {
      return res.status(400).json({ message: 'Provide email/mobile and password' });
    }

    // User को email OR mobile से find करो
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile.toLowerCase() },
        { mobile: emailOrMobile }
      ]
    });

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

// ------------------ Admin Add User ------------------
router.post('/admin/add-user',
  upload.fields([{ name: 'aadharPhoto' }, { name: 'panPhoto' }]),
  async (req, res) => {
    try {
      // ------------------ Debug Logs ------------------
      console.log("REQ BODY:", req.body);
      console.log("REQ FILES:", req.files);

      const data = req.body;
      const files = req.files;

      // ------------------ Required Fields ------------------
      if (!data.email || !data.fullName) {
        console.warn("Missing required fields");
        return res.status(400).json({ message: "Full Name, Email & Aadhar are required" });
      }

      // ------------------ Check Existing Email/Mobile ------------------
      console.log("Checking existing email...");
      const existingEmail = await User.findOne({ email: data.email.toLowerCase() });
      if (existingEmail) {
        console.warn("Email already registered");
        return res.status(400).json({ message: 'Email already registered' });
      }

      if (data.mobile) {
        console.log("Checking existing mobile...");
        const existingMobile = await User.findOne({ mobile: data.mobile });
        if (existingMobile) {
          console.warn("Mobile already registered");
          return res.status(400).json({ message: 'Mobile number already registered' });
        }
      }

      // ------------------ Auto Password ------------------
      const autoPassword = crypto.randomBytes(4).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(autoPassword, salt);
      console.log("Generated auto password (hashed)");

      // ------------------ Generate Referral ID ------------------
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

      const referralId = await generateReferralId();
      console.log("Generated referral ID:", referralId);

      // ------------------ Cloudinary Upload ------------------
      const aadharPhotoUrl = files.aadharPhoto ? files.aadharPhoto[0].path : "";
      const panPhotoUrl = files.panPhoto ? files.panPhoto[0].path : "";
      console.log("Uploaded files:", aadharPhotoUrl, panPhotoUrl);

      // ------------------ Create User ------------------
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
        aadharPhoto: aadharPhotoUrl,
        panPhoto: panPhotoUrl,
        email: data.email.toLowerCase(),
        password: hashed,
        education: data.education,
        profession: data.profession,
        nomineeName: data.nomineeName,
        nomineeRelation: data.nomineeRelation,
        role: 'user',
        referralId,
        sponsorName: data.sponsorName ? data.sponsorName : "Mohammad Abbas Noorani",
        referredBy: data.referralCode ? data.referralCode : "REF1IBDUNDO"
      });

      await user.save();
      console.log("User saved successfully");

      // ------------------ Optional Email Sending ------------------
      try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: data.email,
            subject: "Welcome to RishtaForYou Referral Program",
            text: `Hi ${data.fullName},

Welcome to the RishtaForYou Referral Program! You’re now part of our mission to spread love and earn rewards. 

Share your unique referral link and earn ₹400 per direct referral and potential income is up to ₹40 crores through indirect referrals across 10 levels!

Get Started:

Sign in here: https://rishta-lake.vercel.app/auth/sign-in
Login: ${data.email || data.mobile}
Password: ${autoPassword}

Access your referral link and share it with friends and family.
Earn rewards for every successful membership signup!

Let’s create rishtas and build your earnings together. 

For any questions, contact us at support@rishtaforyou.com or call us: +91 9375007734

Warm regards,
Team RishtaForYou
www.rishtaforyou.com`
          });
          console.log("Referral Program Email sent successfully");
        }
      } catch (emailErr) {
        console.warn("Email not sent:", emailErr.message);
      }


      res.status(201).json({ message: "User created successfully", autoPassword });

    } catch (err) {
      console.error("Error in /admin/add-user:", err.message);
      console.error(err.stack);
      res.status(500).json({
        message: 'Server error',
        error: err.message,
        stack: err.stack
      });
    }
  }
);



// ------------------ Edit User ------------------

router.put('/admin/edit-user/:id', upload.fields([{ name: 'aadharPhoto' }, { name: 'panPhoto' }]), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const files = req.files;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields (only if provided)
    if (data.fullName) user.fullName = data.fullName;
    if (data.email) user.email = data.email;
    if (data.dob) user.dob = new Date(data.dob);
    if (data.gender) user.gender = data.gender;
    if (data.mobile) user.mobile = data.mobile;
    if (data.address) user.address = data.address;
    if (data.city) user.city = data.city;
    if (data.state) user.state = data.state;
    if (data.pinCode) user.pinCode = data.pinCode;
    if (data.country) user.country = data.country;
    if (data.aadharNumber) user.aadharNumber = data.aadharNumber;
    if (data.panNumber) user.panNumber = data.panNumber;
    if (data.education) user.education = data.education;
    if (data.profession) user.profession = data.profession;
    if (data.nomineeName) user.nomineeName = data.nomineeName;
    if (data.nomineeRelation) user.nomineeRelation = data.nomineeRelation;

    // Upload new files if provided
    if (files.aadharPhoto) {
      const aadharUpload = await cloudinary.uploader.upload(files.aadharPhoto[0].path, { folder: 'rishta-users' });
      user.aadharPhoto = aadharUpload.secure_url;
    }
    if (files.panPhoto) {
      const panUpload = await cloudinary.uploader.upload(files.panPhoto[0].path, { folder: 'rishta-users' });
      user.panPhoto = panUpload.secure_url;
    }

    // ❌ Referral code should NOT be updated in edit
    // so we skip updating referralId / referredBy

    await user.save();

    const userSafe = user.toObject();
    delete userSafe.password;

    res.json({ message: "User updated successfully", user: userSafe });
  } catch (err) {
    console.error("Error in /edit-user:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// ------------------ Register ------------------
router.post('/register', upload.fields([{ name: 'aadharPhoto' }, { name: 'panPhoto' }]), async (req, res) => {
  try {
    const data = req.body;
    const files = req.files;

    if (!data.email || !data.password || !data.fullName) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const existingEmail = await User.findOne({ email: data.email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

    const existingMobile = await User.findOne({ mobile: data.mobile });
    if (existingMobile) return res.status(400).json({ message: 'Mobile number already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(data.password, salt);

    const referralId = await generateReferralId();

    const aadharUpload = files.aadharPhoto ? await cloudinary.uploader.upload(files.aadharPhoto[0].path, { folder: 'rishta-users' }) : null;
    const panUpload = files.panPhoto ? await cloudinary.uploader.upload(files.panPhoto[0].path, { folder: 'rishta-users' }) : null;

    // ✅ sponsorName/referralCode logic
    let sponsorName = data.sponsorName?.trim();
    let referredBy = data.referralCode?.trim();

    if (!sponsorName && referredBy) {
      // agar referralCode diya hai to sponsor fetch karo
      const sponsorUser = await User.findOne({ referralId: referredBy });
      sponsorName = sponsorUser ? sponsorUser.fullName : "";
    }

    if (!sponsorName && !referredBy) {
      // agar kuch nahi diya to default values
      sponsorName = "Mohammad Abbas Noorani";
      referredBy = "REF1IBDUNDO";
    }

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
      aadharPhoto: aadharUpload ? aadharUpload.secure_url : "",
      panPhoto: panUpload ? panUpload.secure_url : "",
      email: data.email.toLowerCase(),
      password: hashed,
      education: data.education,
      profession: data.profession,
      nomineeName: data.nomineeName,
      nomineeRelation: data.nomineeRelation,
      role: data.role && data.role === 'admin' ? 'admin' : 'user',
      referralId,
      sponsorName,
      referredBy
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


module.exports = router;
