const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const app = express();

// Middleware 
app.use(express.static(path.join(__dirname, 'build')));

app.use(cors({ origin: ['https://rishta-ochre.vercel.app', 'http://localhost:3000'] }));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log(err));

const userRoutes = require('./routes/users');
const authRoutes = require("./routes/auth");
app.use('/api/users', userRoutes);
app.use("/auth", authRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});