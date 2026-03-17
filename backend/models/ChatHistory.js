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
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        response: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        intent: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        language: {
            type: DataTypes.STRING(10),
            defaultValue: 'en'
        }
    }, {
        tableName: 'chat_history',
        timestamps: true,
        updatedAt: false,
        underscored: true,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['session_id'] }
        ]
    });

    return ChatHistory;
};

const getChatHistory = () => ChatHistory;

module.exports = { defineChatHistoryModel, getChatHistory };
