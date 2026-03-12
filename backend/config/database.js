const { Sequelize } = require('sequelize');
require('dotenv').config();

// Shared container — sequelize instance is set once in connectDB()
const db = {
    sequelize: null,
    Sequelize,
    modelsDefined: false
};

// Detect if a URL is a local/development connection (no SSL needed)
const isLocalConnection = (url) => {
    return url.includes('localhost') || url.includes('127.0.0.1');
};

/**
 * Connect to database — tries PostgreSQL first, falls back to SQLite.
 * Sets db.sequelize and syncs tables. Is idempotent — returns existing instance if already connected.
 */
const connectDB = async () => {
    // Return existing connection if already established
    if (db.sequelize) {
        return db.sequelize;
    }

    const { defineUserModel } = require('../models/User');
    const { defineChatHistoryModel } = require('../models/ChatHistory');
    const { defineProductModel } = require('../models/Product');
    const { defineReminderModel } = require('../models/Reminder');

    const DATABASE_URL = process.env.DATABASE_URL;

    // 1. Initialize Sequelize instance
    if (DATABASE_URL && DATABASE_URL.trim() !== '') {
        const local = isLocalConnection(DATABASE_URL);
        db.sequelize = new Sequelize(DATABASE_URL, {
            dialect: 'postgres',
            logging: false,
            ...(local ? {} : {
                dialectOptions: {
                    ssl: { require: true, rejectUnauthorized: false }
                }
            })
        });
    } else {
        db.sequelize = new Sequelize({
            dialect: 'postgres',
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT) || 5432,
            database: process.env.POSTGRES_DB || 'AgriAssist',
            username: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || '',
            logging: false
        });
    }

    // 2. Authenticate
    try {
        await db.sequelize.authenticate();
        const dbName = db.sequelize.config?.database || 'PostgreSQL';
        console.log(`✅ Connected to PostgreSQL → ${dbName}`);
    } catch (err) {
        console.warn(`⚠️  PostgreSQL connection failed: ${err.message}. Switching to SQLite.`);
        db.sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: './agriassist.sqlite',
            logging: false
        });
        await db.sequelize.authenticate();
        console.log('✅ SQLite database ready at ./agriassist.sqlite');
    }

    // 3. Define Models and Sync (Only once)
    if (!db.modelsDefined) {
        try {
            defineUserModel(db.sequelize);
            defineChatHistoryModel(db.sequelize);
            defineProductModel(db.sequelize);
            defineReminderModel(db.sequelize);
            db.modelsDefined = true;

            // Sync all tables (alter holds data while adding columns)
            // Note: sync() can be slow, but is useful for initial setup.
            await db.sequelize.sync({ alter: true });
            console.log('✅ Database models synchronized');
        } catch (syncErr) {
            console.error('❌ Model synchronization error:', syncErr.message);
        }
    }

    return db.sequelize;
};

module.exports = { db, connectDB };
