const { connectDB } = require('./config/database');

const reset = async () => {
    try {
        const sequelize = await connectDB();
        console.log('🔄 Dropping all tables...');
        // This is a more aggressive way to ensure we actually reset.
        await sequelize.query('DROP TABLE IF EXISTS "chat_history" CASCADE;');
        await sequelize.query('DROP TABLE IF EXISTS "crop_analysis" CASCADE;');
        await sequelize.query('DROP TABLE IF EXISTS "crop_reports" CASCADE;');
        await sequelize.query('DROP TABLE IF EXISTS "users" CASCADE;');
        await sequelize.query('DROP TABLE IF EXISTS "shop_inventory" CASCADE;');
        await sequelize.query('DROP TABLE IF EXISTS "reminders" CASCADE;');
        // Add others if needed
        
        console.log('🔄 Syncing models (force: true)...');
        await sequelize.sync({ force: true });
        console.log('✅ Database reset and synced successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Reset failed:', error);
        process.exit(1);
    }
};

reset();
