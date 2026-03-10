const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actionType: { type: String, required: true }, // 'VERIFY_SHOP', 'DELETE_USER', 'UPDATE_SETTINGS'
    targetId: { type: mongoose.Schema.Types.ObjectId }, // ID of the affected resource
    description: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminLog', adminLogSchema);
