const { DataTypes } = require('sequelize');

let FarmingTool;

const defineFarmingToolModel = (sequelize) => {
    FarmingTool = sequelize.define('FarmingTool', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        tool_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        tool_category: {
            type: DataTypes.STRING
        },
        recommended_crop: {
            type: DataTypes.TEXT
        },
        description: {
            type: DataTypes.TEXT
        },
        purchase_link: {
            type: DataTypes.STRING(500)
        }
    }, {
        tableName: 'farming_tools',
        timestamps: false,
        underscored: true
    });
    return FarmingTool;
};

const getFarmingTool = () => {
    if (!FarmingTool) throw new Error('FarmingTool model not initialized');
    return FarmingTool;
};

module.exports = { defineFarmingToolModel, getFarmingTool };
