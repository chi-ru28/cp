const { DataTypes } = require('sequelize');

let PesticideSolution;

const definePesticideSolutionModel = (sequelize) => {
    PesticideSolution = sequelize.define('PesticideSolution', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        crop_id: {
            type: DataTypes.UUID,
            references: {
                model: 'crops',
                key: 'id'
            }
        },
        pest_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        organic_pesticide: {
            type: DataTypes.STRING
        },
        chemical_pesticide: {
            type: DataTypes.STRING
        },
        application_method: {
            type: DataTypes.TEXT
        },
        safety_warning: {
            type: DataTypes.TEXT
        }
    }, {
        tableName: 'pesticide_solutions',
        timestamps: false,
        underscored: true
    });
    return PesticideSolution;
};

const getPesticideSolution = () => {
    if (!PesticideSolution) throw new Error('PesticideSolution model not initialized');
    return PesticideSolution;
};

module.exports = { definePesticideSolutionModel, getPesticideSolution };
