const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/database');
const authRoutes    = require('./routes/auth');
const chatRoutes    = require('./routes/chat');
const shopRoutes    = require('./routes/shop');
const reminderRoutes = require('./routes/reminder');
const weatherRoutes = require('./routes/weather');
const cropAnalysisRoutes = require('./routes/cropAnalysis');

const app = express();

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'AgriAssist Backend API is running.',
        docs: '/api/health',
        status: 'Active'
    });
});

// Middleware
app.use(cors({
    origin: [/vercel\.app$/, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure DB is connected before any API request is processed
// This is critical for Vercel (serverless) to prevent "User is not defined" errors.
app.use(async (req, res, next) => {
    // Skip DB check for general health/root if preferred, but safer to include it.
    if (req.path === '/' || req.path === '/api/health') return next();
    
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('Database connection middleware error:', err.message);
        res.status(503).json({ 
            message: `Database connection failed: ${err.message}`,
            error: err.message 
        });
    }
});

// Routes
app.use('/api/auth',     authRoutes);
app.use('/api/chat',     chatRoutes);
app.use('/api/shop',     shopRoutes);
app.use('/api/reminder', reminderRoutes);
app.use('/api/weather',  weatherRoutes);
app.use('/api/analysis', cropAnalysisRoutes);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await connectDB();
        const { db } = require('./config/database');
        res.json({
            status: 'OK',
            message: 'AgriAssist backend running',
            db: db.sequelize ? db.sequelize.getDialect() : 'not connected'
        });
    } catch (err) {
        res.status(500).json({
            status: 'ERROR',
            message: 'AgriAssist backend running but DB connection failed',
            error: err.message
        });
    }
});

// 404
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.url} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;

// Export the app for serverless environments (like Vercel)
module.exports = app;

if (require.main === module || process.env.NODE_ENV === 'development') {
    connectDB()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`🚀 AgriAssist backend running on http://localhost:${PORT}`);
            });
        })
        .catch(err => {
            console.error('❌ Failed to start database:', err.message);
            // Don't exit if we just want to see the error in logs or if Vercel handles it
            if (process.env.NODE_ENV !== 'production') process.exit(1);
        });
} else {
    // In serverless, ensure DB is connected
    connectDB().catch(err => console.error('DB connection error in serverless:', err.message));
}