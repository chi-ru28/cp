const { DataTypes } = require('sequelize');

let ShopInventory = null;

const defineShopInventoryModel = (sequelize) => {
    ShopInventory = sequelize.define('ShopInventory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        shopkeeperId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'shopkeeper_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        productName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'product_name'
        },
        category: {
            type: DataTypes.ENUM('fertilizer', 'pesticide', 'tool'),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('organic', 'chemical'),
            allowNull: false
        },
        quantityAvailable: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'quantity_available'
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        availability: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'shop_inventory',
        timestamps: true,
        underscored: true
    });
    return ShopInventory;
};

const getShopInventory = () => {
    if (!ShopInventory) throw new Error('ShopInventory model not initialized.');
    return ShopInventory;
};

module.exports = { defineShopInventoryModel, getShopInventory };
