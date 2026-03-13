const { DataTypes } = require('sequelize');

let CropReport;

const defineCropReportModel = (sequelize) => {
    CropReport = sequelize.define('CropReport', {
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
        problemDescription: {
            type: DataTypes.TEXT,
            field: 'problem_description'
        },
        diagnosis: {
            type: DataTypes.TEXT
        },
        fertilizerRecommendation: {
            type: DataTypes.TEXT,
            field: 'fertilizer_recommendation'
        },
        pesticideRecommendation: {
            type: DataTypes.TEXT,
            field: 'pesticide_recommendation'
        },
        irrigationAdvice: {
            type: DataTypes.TEXT,
            field: 'irrigation_advice'
        },
        weatherAdvice: {
            type: DataTypes.TEXT,
            field: 'weather_advice'
        },
        solutionExamples: {
            type: DataTypes.TEXT,
            field: 'solution_examples'
        },
        referenceLinks: {
            type: DataTypes.TEXT,
            field: 'reference_links'
        },
        reportGeneratedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'report_generated_at'
        }
    }, {
        tableName: 'crop_reports',
        timestamps: false,
        underscored: true
    });

    return CropReport;
};

const getCropReport = () => {
    if (!CropReport) {
        throw new Error('CropReport model not defined.');
    }
    return CropReport;
};

module.exports = { defineCropReportModel, getCropReport };
