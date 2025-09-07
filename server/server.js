const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware 
app.use(cors({ origin: ['https://rishta-b7de.vercel.app','https://rishta-ochre.vercel.app', 'http://localhost:3000'],
  methods: 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH, PROPFIND',
  credentials: true
 }));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log(err));

app.get('/',(req,res)=>{
 res.send("API is working............")
})
const userRoutes = require('./routes/users');
const authRoutes = require("./routes/auth");
app.use('/api/users', userRoutes);
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});