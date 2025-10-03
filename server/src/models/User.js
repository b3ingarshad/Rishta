const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  mobile: String,
  address: String,
  country: { type: String, default: 'India' },
  city: String,
  state: String,
  pinCode: String,
  aadharNumber: String,
  panNumber: String,
   aadharPhoto: String,   // Added for file path
  panPhoto: String,      // Added for file path
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  education: String,
  gender: { type: String },
  dob: { type: Date },
  profession: String,
  nomineeName: String,
  nomineeRelation: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  referralId: { type: String, unique: true },
  sponsorName: String,
  referredBy: String, // optional: store referral code which user entered
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
