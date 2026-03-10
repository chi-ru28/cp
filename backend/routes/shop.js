const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getProduct } = require('../models/Product');

// GET /api/shop/inventory — list products for the authenticated shopkeeper
router.get('/inventory', protect, async (req, res) => {
    try {
        const Product = getProduct();
        const products = await Product.findAll({
            where: { userId: req.user.id },
            order: [['category', 'ASC'], ['name', 'ASC']],
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
        const Product = getProduct();
        const { name, category, unit, price, stock, available, description } = req.body;
        if (!name) return res.status(400).json({ message: 'Product name is required.' });

        const product = await Product.create({
            userId: req.user.id,
            name, category: category || 'chemical',
            unit: unit || 'kg',
            price: price || 0,
            stock: stock || 0,
            available: available !== undefined ? available : true,
            description: description || '',
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
        const Product = getProduct();
        const product = await Product.findOne({ where: { id: req.params.id, userId: req.user.id } });
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
        const Product = getProduct();
        const deleted = await Product.destroy({ where: { id: req.params.id, userId: req.user.id } });
        if (!deleted) return res.status(404).json({ message: 'Product not found.' });
        res.json({ message: 'Product deleted.' });
    } catch (err) {
        console.error('Delete product error:', err);
        res.status(500).json({ message: 'Failed to delete product.' });
    }
});

module.exports = router;
