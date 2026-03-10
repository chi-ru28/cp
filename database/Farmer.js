const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] } // [longitude, latitude]
    },
    farmSizeAcres: { type: Number },
    soilType: { type: String },
    primaryCrops: [{ type: String }],
    preferredLanguage: { type: String, default: 'English' }, // English, Hindi, Gujarati
    createdAt: { type: Date, default: Date.now }
});

farmerSchema.index({ farmLocation: '2dsphere' });
module.exports = mongoose.model('Farmer', farmerSchema);
