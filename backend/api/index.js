const express = require('express');
const cors = require('cors');
require('dotenv').config();
const dns = require('dns');

// DNS Override for Neon DB connectivity
const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    if (hostname === 'ep-aged-smoke-a1x581od.ap-southeast-1.aws.neon.tech') {
        if (options.all) return callback(null, [{address: '13.228.46.236', family: 4}]);
        return callback(null, '13.228.46.236', 4);
    }
    return originalLookup(hostname, options, callback);
};

// Updated imports to point up one level
const { connectDB } = require('../config/database');
const authRoutes    = require('../routes/auth');
const chatRoutes    = require('../routes/chat');
const shopRoutes    = require('../routes/shop');
const reminderRoutes = require('../routes/reminder');
const weatherRoutes = require('../routes/weather');
const cropAnalysisRoutes = require('../routes/cropAnalysis');

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
app.use(async (req, res, next) => {
    if (req.path === '/' || req.path === '/api/health' || req.path.startsWith('/ai-api')) return next();
    
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
        const { db } = require('../config/database');
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

// ─────────────────────────────────────────────
//  AI API routes – served directly from Express
//  (Python FastAPI is used for local dev only;
//   on Vercel we call OpenAI directly from Node)
// ─────────────────────────────────────────────
const aiRouter = express.Router();

// GET /ai-api/health
aiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'AgriAssist AI API (Node)' });
});

// GET /ai-api  and  GET /ai-api/
aiRouter.get(['/', ''], (req, res) => {
    res.json({
        message: 'Welcome to AgriAssist AI API',
        status: 'online',
        endpoints: { health: '/ai-api/health', chat: '/ai-api/chat' }
    });
});

// POST /ai-api/chat  – AI chat endpoint (calls OpenAI directly)
aiRouter.post('/chat', async (req, res) => {
    const { message, sessionId, role, location, imageBase64, imageMimeType } = req.body;
    if (!message || !message.trim()) {
        return res.status(400).json({ reply: 'Message is required.' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        return res.json({ reply: 'AI service is temporarily unavailable', sessionId });
    }

    try {
        const messages = [
            {
                role: 'system',
                content: 'You are an expert agricultural assistant. Help farmers with crop issues, fertilizers, pesticides, weather impact, and farming tools. Be concise, practical, and helpful.'
            },
            { role: 'user', content: message.trim() }
        ];

        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY.trim()}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages,
                max_tokens: 800
            })
        });

        if (!openaiRes.ok) {
            const errText = await openaiRes.text();
            console.error('OpenAI Error:', errText);
            return res.json({ reply: 'AI service is temporarily unavailable', sessionId });
        }

        const data = await openaiRes.json();
        const reply = data.choices?.[0]?.message?.content?.trim() || 'No response from AI.';
        return res.json({ reply, sessionId: sessionId || null });
    } catch (err) {
        console.error('AI chat error:', err.message);
        return res.json({ reply: 'AI service is temporarily unavailable', sessionId });
    }
});

app.use('/ai-api', aiRouter);

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
            if (process.env.NODE_ENV !== 'production') process.exit(1);
        });
} else {
    // In serverless, ensure DB is connected
    connectDB().catch(err => console.error('DB connection error in serverless:', err.message));
}
