const mongoose = require('mongoose');

const cropAnalysisSchema = new mongoose.Schema({
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    soilData: {
        nitrogen: { type: Number },
        phosphorus: { type: Number },
        potassium: { type: Number },
        ph: { type: Number },
        moisture: { type: Number }
    },
    recommendedCrops: [{ type: String }],
    recommendedFertilizers: [{ type: String }],
    analysisDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CropAnalysis', cropAnalysisSchema);
