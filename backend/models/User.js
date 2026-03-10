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
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('farmer', 'shopkeeper', 'admin'),
            defaultValue: 'farmer'
        }
    }, {
        tableName: 'users',
        timestamps: true
    });

    User.beforeCreate(async (user) => {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    });

    User.beforeUpdate(async (user) => {
        if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }
    });

    User.prototype.matchPassword = async function (enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
    };

    return User;
};

// Getter so routes can import the model after it's defined
const getUser = () => User;

module.exports = { defineUserModel, getUser };
