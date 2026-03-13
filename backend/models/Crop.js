const { DataTypes } = require('sequelize');

let Crop;

const defineCropModel = (sequelize) => {
    Crop = sequelize.define('Crop', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        crop_name: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        crop_category: {
            type: DataTypes.STRING
        },
        growing_season: {
            type: DataTypes.STRING
        },
        soil_type: {
            type: DataTypes.TEXT
        }
    }, {
        tableName: 'crops',
        timestamps: false,
        underscored: true
    });
    return Crop;
};

const getCrop = () => {
    if (!Crop) throw new Error('Crop model not initialized');
    return Crop;
};

module.exports = { defineCropModel, getCrop };
