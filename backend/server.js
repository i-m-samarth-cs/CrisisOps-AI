require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const agentRoutes = require('./routes/agentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', agentRoutes);

// Database Connection
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
