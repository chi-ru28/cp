const { DataTypes } = require('sequelize');

let ChatHistory;

const defineChatHistoryModel = (sequelize) => {
    ChatHistory = sequelize.define('ChatHistory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'user_id'
        },
        sessionId: {
            type: DataTypes.STRING(36),
            allowNull: false,
            field: 'session_id'
        },
        role: {
            type: DataTypes.STRING(20),
            defaultValue: 'farmer'
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        reply: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'chat_histories',
        timestamps: false,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['session_id'] },
            { fields: ['user_id', 'session_id'] }
        ]
    });

    return ChatHistory;
};

const getChatHistory = () => ChatHistory;

module.exports = { defineChatHistoryModel, getChatHistory };
