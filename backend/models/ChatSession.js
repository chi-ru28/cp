const { DataTypes } = require('sequelize');

let ChatSession;

const defineChatSessionModel = (sequelize) => {
    ChatSession = sequelize.define('ChatSession', {
        id: {
            type: DataTypes.STRING(36),
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            field: 'user_id'
        },
        role: {
            type: DataTypes.STRING(20)
        },
        title: {
            type: DataTypes.STRING(255)
        }
    }, {
        tableName: 'chat_sessions',
        timestamps: true,
        updatedAt: false,
        underscored: true
    });

    return ChatSession;
};

const getChatSession = () => ChatSession;

module.exports = { defineChatSessionModel, getChatSession };
