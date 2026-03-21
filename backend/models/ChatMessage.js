const { DataTypes } = require('sequelize');

let ChatMessage;

const defineChatMessageModel = (sequelize) => {
    ChatMessage = sequelize.define('ChatMessage', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        sessionId: {
            type: DataTypes.STRING(36),
            field: 'session_id'
        },
        sender: {
            type: DataTypes.STRING(10)
        },
        message: {
            type: DataTypes.TEXT
        },
        contextUsed: {
            type: DataTypes.JSON,
            field: 'context_used',
            allowNull: true
        },
        intent: {
            type: DataTypes.STRING(100),
            allowNull: true
        }
    }, {
        tableName: 'chat_messages',
        timestamps: true,
        createdAt: 'timestamp',
        updatedAt: false,
        underscored: true
    });

    return ChatMessage;
};

const getChatMessage = () => ChatMessage;

module.exports = { defineChatMessageModel, getChatMessage };
