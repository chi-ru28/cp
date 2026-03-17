const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

let User;

const defineUserModel = (sequelize) => {
    User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: { notEmpty: true }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        passwordHash: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'password_hash'
        },
        role: {
            type: DataTypes.ENUM('farmer', 'shopkeeper', 'admin'),
            defaultValue: 'farmer'
        },
        location: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    }, {
        tableName: 'users',
        timestamps: true,
        updatedAt: false,
        underscored: true
    });

    User.beforeCreate(async (user) => {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
    });

    User.beforeUpdate(async (user) => {
        if (user.changed('passwordHash')) {
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
    });

    User.prototype.matchPassword = async function (enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.passwordHash);
    };

    return User;
};

// Getter so routes can import the model after it's defined
const getUser = () => {
    if (!User) {
        throw new Error('Database not connected. Please check your DATABASE_URL environment variable.');
    }
    return User;
};

module.exports = { defineUserModel, getUser };
