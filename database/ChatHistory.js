const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for anonymous users
    sessionId: { type: String, required: true },
    messages: [{
        role: { type: String, enum: ['user', 'assistant'] },
        content: { type: String },
        mediaUrl: { type: String }, // For image/audio inputs/outputs
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
