const { Sequelize } = require('sequelize');
require('dotenv').config();

// Shared container — sequelize instance is set once in connectDB()
const db = {
    sequelize: null,
    Sequelize
};

// Detect if a URL is a local/development connection (no SSL needed)
const isLocalConnection = (url) => {
    return url.includes('localhost') || url.includes('127.0.0.1');
};

/**
 * Connect to database — tries PostgreSQL first, falls back to SQLite.
 * Sets db.sequelize and syncs tables. Must be called before models are used.
 */
const connectDB = async () => {
    const DATABASE_URL = process.env.DATABASE_URL;

    // 1. Try DATABASE_URL (supports both local and cloud PostgreSQL)
    if (DATABASE_URL && DATABASE_URL.trim() !== '') {
        const local = isLocalConnection(DATABASE_URL);
        db.sequelize = new Sequelize(DATABASE_URL, {
            dialect: 'postgres',
            logging: false,
            // Only enable SSL for cloud-hosted databases (Supabase, Railway, Render, etc.)
            ...(local ? {} : {
                dialectOptions: {
                    ssl: { require: true, rejectUnauthorized: false }
                }
            })
        });
    } else {
        // 2. Try individual PostgreSQL credentials from .env
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

    try {
        await db.sequelize.authenticate();
        const dialect = db.sequelize.getDialect();
        const dbName = db.sequelize.config?.database || DATABASE_URL?.split('/').pop() || 'AgriAssist';
        console.log(`✅ Connected to PostgreSQL → ${dbName}`);
    } catch (err) {
        console.warn(`⚠️  PostgreSQL connection failed: ${err.message}`);
        console.log('🔄  Switching to SQLite (embedded fallback)...');
        db.sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: './agriassist.sqlite',
            logging: false
        });
        await db.sequelize.authenticate();
        console.log('✅ SQLite database ready at ./agriassist.sqlite');
    }

    // Register models with the live sequelize instance
    const { defineUserModel } = require('../models/User');
    const { defineChatHistoryModel } = require('../models/ChatHistory');
    const { defineProductModel } = require('../models/Product');
    const { defineReminderModel } = require('../models/Reminder');

    defineUserModel(db.sequelize);
    defineChatHistoryModel(db.sequelize);
    defineProductModel(db.sequelize);
    defineReminderModel(db.sequelize);


    // Sync all tables (alter: true updates columns without dropping data)
    await db.sequelize.sync({ alter: true });
    const dialect = db.sequelize.getDialect();
    console.log(`✅ Tables synchronized (${dialect})`);

    return db.sequelize;
};

module.exports = { db, connectDB };
