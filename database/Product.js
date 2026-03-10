const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    name: { type: String, required: true },
    description: { type: String },
    tags: [{ type: String }], // 'fertilizer', 'tool', 'pesticide', 'seed', etc.
    price: { type: Number },
    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
