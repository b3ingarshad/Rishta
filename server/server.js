const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const app = express();

// Middleware 
app.use(express.static(path.join(__dirname, 'build')));

app.use(cors({
  origin: [
    'https://rishta-b7de.vercel.app', // Your NEW live Vercel frontend
    'https://rishta-ochre.vercel.app', // Your old URL (keep it if you still use it)
    'http://localhost:3000' // Your local frontend for development
  ]
}));
app.use(express.json());
app.use((req, res, next) => {
  if (req.headers.host.slice(0, 4) !== 'www.') {
    res.redirect(301, 'https://www.' + req.headers.host + req.originalUrl);
  }
  next();
});
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