const { DataTypes } = require('sequelize');

let CropIssueReport;

const defineCropIssueReportModel = (sequelize) => {
    CropIssueReport = sequelize.define('CropIssueReport', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        farmer_id: {
            type: DataTypes.UUID,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        crop_name: {
            type: DataTypes.STRING(100)
        },
        issue_description: {
            type: DataTypes.TEXT
        },
        detected_problem: {
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
        reference_link: {
            type: DataTypes.STRING(500)
        },
        report_generated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'crop_issue_reports',
        timestamps: false,
        underscored: true
    });
    return CropIssueReport;
};

const getCropIssueReport = () => {
    if (!CropIssueReport) throw new Error('CropIssueReport model not initialized');
    return CropIssueReport;
};

module.exports = { defineCropIssueReportModel, getCropIssueReport };
