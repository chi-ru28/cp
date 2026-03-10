const { DataTypes } = require('sequelize');

let Product = null;

const defineProductModel = (sequelize) => {
    Product = sequelize.define('Product', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        category: { type: DataTypes.ENUM('chemical', 'organic'), defaultValue: 'chemical' },
        unit: { type: DataTypes.STRING, defaultValue: 'kg' },
        price: { type: DataTypes.FLOAT, defaultValue: 0 },
        stock: { type: DataTypes.FLOAT, defaultValue: 0 },
        available: { type: DataTypes.BOOLEAN, defaultValue: true },
        description: { type: DataTypes.TEXT, defaultValue: '' },
    }, { tableName: 'products', timestamps: true });
    return Product;
};

const getProduct = () => {
    if (!Product) throw new Error('Product model not initialized. Call defineProductModel() first.');
    return Product;
};

module.exports = { defineProductModel, getProduct };
