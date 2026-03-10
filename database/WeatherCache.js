const mongoose = require('mongoose');

const weatherCacheSchema = new mongoose.Schema({
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    weatherData: { type: mongoose.Schema.Types.Mixed }, // JSON response from Weather API
    fetchedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
});

weatherCacheSchema.index({ location: '2dsphere' });
weatherCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic deletion

module.exports = mongoose.model('WeatherCache', weatherCacheSchema);
