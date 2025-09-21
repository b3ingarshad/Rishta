require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

const app = express();
const allowedOrigins = [
  'https://rishta-b7de.vercel.app',
  'https://rishta-ochre.vercel.app',
  'http://localhost:3000'
];
app.use(express.json());
app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like Postman)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  credentials: true
}));

// Optional: handle preflight manually for some cases
app.options('*', cors());
connectDB();
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', require('./src/routes/auth'));
const userRoutes = require("./src/routes/userRoutes");

app.use("/api/users", userRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
