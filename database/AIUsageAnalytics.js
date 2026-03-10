const mongoose = require('mongoose');

const aiUsageAnalyticsSchema = new mongoose.Schema({
    date: { type: Date, required: true, unique: true }, // e.g., 2026-03-05
    totalQueries: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    languagesUsed: {
        english: { type: Number, default: 0 },
        hindi: { type: Number, default: 0 },
        gujarati: { type: Number, default: 0 }
    },
    modalitiesUsed: {
        text: { type: Number, default: 0 },
        voice: { type: Number, default: 0 },
        image: { type: Number, default: 0 }
    }
});

module.exports = mongoose.model('AIUsageAnalytics', aiUsageAnalyticsSchema);
