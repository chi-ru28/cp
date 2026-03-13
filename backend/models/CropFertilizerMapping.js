const { DataTypes } = require('sequelize');

let CropFertilizerMapping;

const defineCropFertilizerMappingModel = (sequelize) => {
    CropFertilizerMapping = sequelize.define('CropFertilizerMapping', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        crop_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'crops',
                key: 'id'
            }
        },
        fertilizer_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'fertilizer_types',
                key: 'id'
            }
        },
        recommended_quantity_per_acre: {
            type: DataTypes.STRING
        },
        application_stage: {
            type: DataTypes.STRING // sowing / growth / flowering / fruiting
        },
        application_method: {
            type: DataTypes.TEXT
        }
    }, {
        tableName: 'crop_fertilizer_mapping',
        timestamps: false,
        underscored: true
    });
    return CropFertilizerMapping;
};

const getCropFertilizerMapping = () => {
    if (!CropFertilizerMapping) throw new Error('CropFertilizerMapping model not initialized');
    return CropFertilizerMapping;
};

module.exports = { defineCropFertilizerMappingModel, getCropFertilizerMapping };
