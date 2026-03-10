const { DataTypes } = require('sequelize');

let Reminder = null;

const defineReminderModel = (sequelize) => {
    Reminder = sequelize.define('Reminder', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        title: { type: DataTypes.STRING, allowNull: false },
        note: { type: DataTypes.TEXT, defaultValue: '' },
        dateTime: { type: DataTypes.DATE, allowNull: false },
        repeat: { type: DataTypes.ENUM('none', 'daily', 'weekly'), defaultValue: 'none' },
        sent: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, { tableName: 'reminders', timestamps: true });
    return Reminder;
};

const getReminder = () => {
    if (!Reminder) throw new Error('Reminder model not initialized. Call defineReminderModel() first.');
    return Reminder;
};

module.exports = { defineReminderModel, getReminder };
