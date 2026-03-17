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
        const { defineChatSessionModel } = require('../models/ChatSession');
        const { defineChatMessageModel } = require('../models/ChatMessage');
        const { defineCropModel } = require('../models/Crop');
        const { defineFertilizerTypeModel } = require('../models/FertilizerType');
        const { defineCropFertilizerMappingModel } = require('../models/CropFertilizerMapping');
        const { defineSoilDeficiencyModel } = require('../models/SoilDeficiency');
        const { definePesticideSolutionModel } = require('../models/PesticideSolution');
        const { defineFarmingToolModel } = require('../models/FarmingTool');
        const { defineCropIssueReportModel } = require('../models/CropIssueReport');
        const { defineFertilizerKnowledgeModel } = require('../models/FertilizerKnowledge');
        const { defineShopInventoryModel } = require('../models/ShopInventory');
        const { defineReminderModel } = require('../models/Reminder');

        const DATABASE_URL = process.env.DATABASE_URL;
        let sequelize;

        // A. Initialize Sequelize instance
        if (DATABASE_URL && DATABASE_URL.trim() !== '') {
            const local = isLocalConnection(DATABASE_URL);
            
            // Neon connection strings often include 'sslmode' and 'channel_binding'
            // We strip these to avoid conflicts with Sequelize's own SSL dialectOptions
            const cleanedURL = DATABASE_URL.split('?')[0];
            console.log(`📡 Attempting connection for: ${cleanedURL.substring(0, 30)}...`);

            sequelize = new Sequelize(cleanedURL, {
                dialect: 'postgres',
                dialectModule: require('pg'),
                logging: false,
                ...(local ? {} : {
                    dialectOptions: {
                        ssl: {
                            require: true,
                            rejectUnauthorized: false
                        }
                    }
                }),
                pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
                define: {
                    underscored: true,
                    timestamps: true,
                    updatedAt: false,
                    freezeTableName: true
                }
            });
        } else {
            // ... fallback to individual variables or error
            throw new Error('DATABASE_URL is missing.');
        }

        // B. Authenticate
        try {
            await sequelize.authenticate();
            console.log('✅ PostgreSQL connected successfully');
        } catch (err) {
            console.error(`❌ PostgreSQL connection failed: ${err.message}`);
            // Do NOT fallback to SQLite in production/serverless as it's not writable/reliable
            throw err;
        }

        // C. Define Models
        defineUserModel(sequelize);
        defineChatSessionModel(sequelize);
        defineChatMessageModel(sequelize);
        defineCropModel(sequelize);
        defineFertilizerTypeModel(sequelize);
        defineCropFertilizerMappingModel(sequelize);
        defineSoilDeficiencyModel(sequelize);
        definePesticideSolutionModel(sequelize);
        defineFarmingToolModel(sequelize);
        defineCropIssueReportModel(sequelize);
        defineFertilizerKnowledgeModel(sequelize);
        defineShopInventoryModel(sequelize);
        defineReminderModel(sequelize);

        // D. Sync (Only if not in restricted env or if tables missing)
        try {
            // Using alter: true to ensure missing columns like created_at are added
            await sequelize.sync({ alter: true });
            console.log('✅ Database models synchronized');
        } catch (syncErr) {
            console.warn('⚠️ Model synchronization warning:', syncErr.message);
        }

        db.sequelize = sequelize;
        db.modelsDefined = true;
        return sequelize;
    })();

    return db.initializationPromise;
};

module.exports = { db, connectDB };
