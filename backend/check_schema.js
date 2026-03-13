const { connectDB } = require('./config/database');

const check = async () => {
    try {
        const sequelize = await connectDB();
        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'password_hash';
        `);
        if (results.length > 0) {
            console.log('✅ Column password_hash EXISTS in users table.');
        } else {
            console.log('❌ Column password_hash DOES NOT EXIST in users table.');
            const [all] = await sequelize.query(`
                SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
            `);
            console.log('Available columns:', all.map(c => c.column_name).join(', '));
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Check failed:', error);
        process.exit(1);
    }
};

check();
