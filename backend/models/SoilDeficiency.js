const { DataTypes } = require('sequelize');

let SoilDeficiency;

const defineSoilDeficiencyModel = (sequelize) => {
    SoilDeficiency = sequelize.define('SoilDeficiency', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        deficiency_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        symptoms: {
            type: DataTypes.TEXT
        },
        recommended_fertilizer: {
            type: DataTypes.TEXT
        },
        organic_solution: {
            type: DataTypes.TEXT
        },
        chemical_solution: {
            type: DataTypes.TEXT
        },
        precautions: {
            type: DataTypes.TEXT
        }
    }, {
        tableName: 'soil_deficiency',
        timestamps: false,
        underscored: true
    });
    return SoilDeficiency;
};

const getSoilDeficiency = () => {
    if (!SoilDeficiency) throw new Error('SoilDeficiency model not initialized');
    return SoilDeficiency;
};

module.exports = { defineSoilDeficiencyModel, getSoilDeficiency };
