const { DataTypes } = require('sequelize');

let FertilizerKnowledge;
let PesticideKnowledge;
let ToolsDatabase;

const defineKnowledgeModels = (sequelize) => {
    FertilizerKnowledge = sequelize.define('FertilizerKnowledge', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        cropName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'crop_name'
        },
        soilIssue: {
            type: DataTypes.TEXT,
            field: 'soil_issue'
        },
        fertilizerName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'fertilizer_name'
        },
        applicationMethod: {
            type: DataTypes.TEXT,
            field: 'application_method'
        },
        quantityPerAcre: {
            type: DataTypes.STRING(100),
            field: 'quantity_per_acre'
        },
        warning: {
            type: DataTypes.TEXT
        },
        organicAlternative: {
            type: DataTypes.TEXT,
            field: 'organic_alternative'
        }
    }, {
        tableName: 'fertilizer_knowledge',
        timestamps: false,
        underscored: true
    });

    PesticideKnowledge = sequelize.define('PesticideKnowledge', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        cropName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'crop_name'
        },
        pestType: {
            type: DataTypes.TEXT,
            field: 'pest_type'
        },
        organicPesticide: {
            type: DataTypes.STRING(255),
            field: 'organic_pesticide'
        },
        chemicalPesticide: {
            type: DataTypes.STRING(255),
            field: 'chemical_pesticide'
        },
        applicationMethod: {
            type: DataTypes.TEXT,
            field: 'application_method'
        },
        safetyWarning: {
            type: DataTypes.TEXT,
            field: 'safety_warning'
        }
    }, {
        tableName: 'pesticide_knowledge',
        timestamps: false,
        underscored: true
    });

    ToolsDatabase = sequelize.define('ToolsDatabase', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        toolName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'tool_name'
        },
        toolType: {
            type: DataTypes.STRING(100),
            field: 'tool_type'
        },
        recommendedCrop: {
            type: DataTypes.TEXT,
            field: 'recommended_crop'
        },
        usageDescription: {
            type: DataTypes.TEXT,
            field: 'usage_description'
        },
        purchaseLink: {
            type: DataTypes.STRING(500),
            field: 'purchase_link'
        }
    }, {
        tableName: 'tools_database',
        timestamps: false,
        underscored: true
    });

    return { FertilizerKnowledge, PesticideKnowledge, ToolsDatabase };
};

const getFertilizerKnowledge = () => FertilizerKnowledge;
const getPesticideKnowledge = () => PesticideKnowledge;
const getToolsDatabase = () => ToolsDatabase;

module.exports = { defineKnowledgeModels, getFertilizerKnowledge, getPesticideKnowledge, getToolsDatabase };
