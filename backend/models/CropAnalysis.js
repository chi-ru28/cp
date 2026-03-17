const { DataTypes } = require('sequelize');

let CropAnalysis;

const defineCropAnalysisModel = (sequelize) => {
    CropAnalysis = sequelize.define('CropAnalysis', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        farmerId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'farmer_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        cropName: {
            type: DataTypes.STRING(100),
            field: 'crop_name'
        },
        imagePath: {
            type: DataTypes.STRING(500),
            field: 'image_path'
        },
        detectedIssue: {
            type: DataTypes.TEXT,
            field: 'detected_issue'
        },
        soilCondition: {
            type: DataTypes.TEXT,
            field: 'soil_condition'
        },
        recommendedFertilizer: {
            type: DataTypes.TEXT,
            field: 'recommended_fertilizer'
        },
        organicSolution: {
            type: DataTypes.TEXT,
            field: 'organic_solution'
        },
        chemicalSolution: {
            type: DataTypes.TEXT,
            field: 'chemical_solution'
        },
        precautions: {
            type: DataTypes.TEXT
        },
        analysisReport: {
            type: DataTypes.TEXT,
            field: 'analysis_report'
        },
        referenceLink: {
            type: DataTypes.STRING(500),
            field: 'reference_link'
        }
    }, {
        tableName: 'crop_analysis',
        timestamps: true,
        updatedAt: false,
        underscored: true
    });

    return CropAnalysis;
};

const getCropAnalysis = () => {
    if (!CropAnalysis) {
        throw new Error('CropAnalysis model not defined.');
    }
    return CropAnalysis;
};

module.exports = { defineCropAnalysisModel, getCropAnalysis };
