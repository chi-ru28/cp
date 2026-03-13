const { DataTypes } = require('sequelize');

let FertilizerType;

const defineFertilizerTypeModel = (sequelize) => {
    FertilizerType = sequelize.define('FertilizerType', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        fertilizer_name: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        fertilizer_category: {
            type: DataTypes.STRING // organic / chemical
        },
        main_nutrients: {
            type: DataTypes.STRING // nitrogen, phosphorus, potassium
        },
        description: {
            type: DataTypes.TEXT
        },
        usage_warning: {
            type: DataTypes.TEXT
        }
    }, {
        tableName: 'fertilizer_types',
        timestamps: false,
        underscored: true
    });
    return FertilizerType;
};

const getFertilizerType = () => {
    if (!FertilizerType) throw new Error('FertilizerType model not initialized');
    return FertilizerType;
};

module.exports = { defineFertilizerTypeModel, getFertilizerType };
