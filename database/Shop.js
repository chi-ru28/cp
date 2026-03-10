const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shopName: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    address: { type: String },
    contactNumber: { type: String },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

shopSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Shop', shopSchema);
