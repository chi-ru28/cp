const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getShopInventory } = require('../models/ShopInventory');

// GET /api/shop/inventory — list products for the authenticated shopkeeper
router.get('/inventory', protect, async (req, res) => {
    try {
        const ShopInventory = getShopInventory();
        const products = await ShopInventory.findAll({
            where: { shopkeeperId: req.user.id },
            order: [['category', 'ASC'], ['productName', 'ASC']],
        });
        res.json({ products });
    } catch (err) {
        console.error('Inventory fetch error:', err);
        res.status(500).json({ message: 'Failed to fetch inventory.' });
    }
});

// POST /api/shop/inventory — add a new product
router.post('/inventory', protect, async (req, res) => {
    try {
        const ShopInventory = getShopInventory();
        const { productName, category, type, price, quantityAvailable, availability } = req.body;
        if (!productName) return res.status(400).json({ message: 'Product name is required.' });

        const product = await ShopInventory.create({
            shopkeeperId: req.user.id,
            productName,
            category: category || 'fertilizer',
            type: type || 'chemical',
            price: price || 0,
            quantityAvailable: quantityAvailable || 0,
            availability: availability !== undefined ? availability : true
        });
        res.status(201).json({ product });
    } catch (err) {
        console.error('Add product error:', err);
        res.status(500).json({ message: 'Failed to add product.' });
    }
});

// PUT /api/shop/inventory/:id — update a product
router.put('/inventory/:id', protect, async (req, res) => {
    try {
        const ShopInventory = getShopInventory();
        const product = await ShopInventory.findOne({ where: { id: req.params.id, shopkeeperId: req.user.id } });
        if (!product) return res.status(404).json({ message: 'Product not found.' });

        await product.update(req.body);
        res.json({ product });
    } catch (err) {
        console.error('Update product error:', err);
        res.status(500).json({ message: 'Failed to update product.' });
    }
});

// DELETE /api/shop/inventory/:id — delete a product
router.delete('/inventory/:id', protect, async (req, res) => {
    try {
        const ShopInventory = getShopInventory();
        const deleted = await ShopInventory.destroy({ where: { id: req.params.id, shopkeeperId: req.user.id } });
        if (!deleted) return res.status(404).json({ message: 'Product not found.' });
        res.json({ message: 'Product deleted.' });
    } catch (err) {
        console.error('Delete product error:', err);
        res.status(500).json({ message: 'Failed to delete product.' });
    }
});

module.exports = router;
