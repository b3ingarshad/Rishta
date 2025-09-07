// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  country: { type: String, required: true },
  pin: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  referral: { type: String }, 
  connectedMember: { type: String }, // optional
});

module.exports = mongoose.model('User', userSchema);
