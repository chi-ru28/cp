const { DataTypes } = require('sequelize');

let Reminder = null;

const defineReminderModel = (sequelize) => {
    Reminder = sequelize.define('Reminder', {
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
        reminderType: {
            type: DataTypes.STRING(50),
            field: 'reminder_type'
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        reminderDate: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'reminder_date'
        }
    }, {
        tableName: 'reminders',
        timestamps: true,
        updatedAt: false,
        underscored: true
    });
    return Reminder;
};

const getReminder = () => {
    if (!Reminder) throw new Error('Reminder model not initialized.');
    return Reminder;
};

module.exports = { defineReminderModel, getReminder };
