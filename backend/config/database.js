const { Sequelize } = require('sequelize');
require('dotenv').config();

// Shared container — sequelize instance is set once in connectDB()
const db = {
    sequelize: null,
    Sequelize,
    modelsDefined: false,
    initializationPromise: null
};

// Detect if a URL is a local/development connection (no SSL needed)
const isLocalConnection = (url) => {
    return url.includes('localhost') || url.includes('127.0.0.1');
};

/**
 * Connect to database — tries PostgreSQL first, falls back to SQLite.
 * Is idempotent — returns existing instance if already connected.
 * Uses a singleton promise to prevent race conditions during parallel initialization.
 */
const connectDB = async () => {
    // 1. If we already have a completed initialization, return it
    if (db.sequelize && db.modelsDefined) {
        return db.sequelize;
    }

    // 2. If an initialization is already in progress, wait for it
    if (db.initializationPromise) {
        return db.initializationPromise;
    }

    // 3. Start a new initialization and track it in the container
    db.initializationPromise = (async () => {
        const { defineUserModel } = require('../models/User');
        const { defineChatHistoryModel } = require('../models/ChatHistory');
        const { defineProductModel } = require('../models/Product');
        const { defineReminderModel } = require('../models/Reminder');

        const DATABASE_URL = process.env.DATABASE_URL;
        let sequelize;

        // A. Initialize Sequelize instance
        if (DATABASE_URL && DATABASE_URL.trim() !== '') {
            const local = isLocalConnection(DATABASE_URL);
            
            sequelize = new Sequelize(DATABASE_URL, {
                dialect: 'postgres',
                dialectModule: require('pg'),
                logging: false,
                ...(local ? {} : {
                    dialectOptions: {
                        ssl: { require: true, rejectUnauthorized: false }
                    }
                }),
                pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
            });
        } else {
            sequelize = new Sequelize({
                dialect: 'postgres',
                host: process.env.POSTGRES_HOST || 'localhost',
                port: parseInt(process.env.POSTGRES_PORT) || 5432,
                database: process.env.POSTGRES_DB || 'AgriAssist',
                username: process.env.POSTGRES_USER || 'postgres',
                password: process.env.POSTGRES_PASSWORD || '',
                logging: false
            });
        }

        // B. Authenticate
        try {
            await sequelize.authenticate();
            console.log('✅ Connected to PostgreSQL');
        } catch (err) {
            console.warn(`⚠️  PostgreSQL connection failed: ${err.message}. Switching to SQLite.`);
            sequelize = new Sequelize({
                dialect: 'sqlite',
                storage: './agriassist.sqlite',
                logging: false
            });
            await sequelize.authenticate();
        }

        // C. Define Models
        defineUserModel(sequelize);
        defineChatHistoryModel(sequelize);
        defineProductModel(sequelize);
        defineReminderModel(sequelize);

        // D. Sync (Optional but useful for schema updates)
        try {
            await sequelize.sync({ alter: true });
            console.log('✅ Database models synchronized');
        } catch (syncErr) {
            console.error('❌ Model synchronization error:', syncErr.message);
        }

        db.sequelize = sequelize;
        db.modelsDefined = true;
        return sequelize;
    })();

    return db.initializationPromise;
};

module.exports = { db, connectDB };
