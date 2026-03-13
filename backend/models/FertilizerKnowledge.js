const { DataTypes } = require('sequelize');

let FertilizerKnowledge;

const defineFertilizerKnowledgeModel = (sequelize) => {
    FertilizerKnowledge = sequelize.define('FertilizerKnowledge', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        plant_name: {
            type: DataTypes.STRING(100)
        },
        plant_type: {
            type: DataTypes.STRING(50)
        },
        issue: {
            type: DataTypes.STRING(255)
        },
        recommended_fertilizer: {
            type: DataTypes.STRING(255)
        },
        organic_alternative: {
            type: DataTypes.STRING(255)
        },
        application_stage: {
            type: DataTypes.STRING(255)
        },
        precaution: {
            type: DataTypes.TEXT
        }
    }, {
        tableName: 'fertilizer_knowledge',
        timestamps: false,
        underscored: true
    });
    return FertilizerKnowledge;
};

const getFertilizerKnowledge = () => {
    if (!FertilizerKnowledge) throw new Error('FertilizerKnowledge model not initialized');
    return FertilizerKnowledge;
};

module.exports = { defineFertilizerKnowledgeModel, getFertilizerKnowledge };
