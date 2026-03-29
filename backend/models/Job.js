const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    location: { type: String, required: true },
    crisisType: { type: String, required: true },
    requirement: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'running', 'completed', 'failed'], 
        default: 'pending' 
    },
    tinyfishTaskId: { type: String },
    logs: [
        {
            timestamp: { type: Date, default: Date.now },
            message: { type: String }
        }
    ],
    results: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', JobSchema);
