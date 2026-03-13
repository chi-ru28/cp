const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Op, fn, col, literal } = require('sequelize');
const { protect } = require('../middleware/auth');
const { getChatHistory } = require('../models/ChatHistory');
const { generateReply, detectLanguage, isGreeting } = require('../services/gemini');
const { getWeather } = require('../services/weather');
const axios = require('axios');

// POST /api/chat/ — Send message, get AI reply
router.post('/', protect, async (req, res) => {
    try {
        const ChatHistory = getChatHistory();
        const { message, sessionId, location = 'Ranuj', imageBase64, imageMimeType } = req.body;

        const { id: userId, role } = req.user;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required.' });
        }

        const trimmedMessage = message.trim();
        const language = detectLanguage(trimmedMessage);
        const currentSessionId = sessionId || uuidv4();

        // Handle greeting shortcut
        if (isGreeting(trimmedMessage)) {
            const menu = role === 'shopkeeper'
                ? '🏪 Welcome Shopkeeper!\n\n1️⃣ Inventory update\n2️⃣ Stock limits & advisory\n3️⃣ View chat history\n\nHow can I assist your agri-business today?'
                : '👨‍🌾 Welcome to AgriAssist!\n\n1️⃣ Detect crop issue\n2️⃣ Fertilizer advice\n3️⃣ Tool suggestions\n4️⃣ Check weather impact\n5️⃣ View history\n\nWhat can I help you with today?';

            await ChatHistory.create({
                userId, sessionId: currentSessionId,
                message: trimmedMessage, response: menu,
                intent: 'greeting', language
            });

            return res.json({ reply: menu, sessionId: currentSessionId, language });
        }

        // Get weather context if requested
        let weatherInfo = '';
        if (role === 'farmer' && trimmedMessage.toLowerCase().includes('weather')) {
            weatherInfo = await getWeather(location);
        }

        // Fetch recent conversation history for this session (last 5)
        const pastChats = await ChatHistory.findAll({
            where: { userId, sessionId: currentSessionId },
            order: [['timestamp', 'DESC']],
            limit: 5,
            raw: true
        });

        const historyText = pastChats.length > 0
            ? pastChats.reverse().map(c => `User: ${c.message}\nAssistant: ${c.response}`).join('\n\n')
            : '';

        // Generate AI reply using Python FastAPI Engine
        let finalReply = '🙏 I\'m having trouble connecting to the AI right now. Please try again shortly.';
        try {
            const pythonResponse = await axios.post('http://127.0.0.1:8000/api/chat', {
                message: trimmedMessage,
                sessionId: currentSessionId,
                role: role,
                location: location
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 20000 // 20s timeout for deep DB lookups
            });
            
            if (pythonResponse.data && pythonResponse.data.response) {
                finalReply = pythonResponse.data.response;
            }
        } catch (pyError) {
            console.error('Failed to reach Python Chatbot Engine at 8000:', pyError.message);
        }

        // Save to PostgreSQL
        await ChatHistory.create({
            userId, sessionId: currentSessionId,
            message: trimmedMessage, response: finalReply,
            intent: 'query', language
        });

        res.json({ reply: finalReply, sessionId: currentSessionId, language, weather: weatherInfo });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ message: 'Server error processing your message.' });
    }
});

// GET /api/chat/sessions — List all chat sessions for user
router.get('/sessions', protect, async (req, res) => {
    try {
        const ChatHistory = getChatHistory();
        const { id: userId } = req.user;

        // Use raw SQL-compatible approach: get first message and last timestamp per session
        const sessions = await ChatHistory.findAll({
            where: { userId },
            attributes: [
                'sessionId',
                [fn('MIN', col('timestamp')), 'createdAt'],
                [fn('MAX', col('timestamp')), 'updatedAt'],
                [fn('MIN', col('message')), 'firstMessage']
            ],
            group: ['session_id'],
            order: [[literal('"updatedAt"'), 'DESC']],
            raw: true
        });

        const formatted = sessions.map(s => ({
            sessionId: s.sessionId || s.session_id,
            title: (s.firstMessage || 'New Chat').length > 40
                ? (s.firstMessage || 'New Chat').substring(0, 40) + '...'
                : (s.firstMessage || 'New Chat'),
            updatedAt: s.updatedAt
        }));

        res.json({ sessions: formatted });
    } catch (error) {
        console.error('Sessions error:', error);
        res.status(500).json({ message: 'Failed to load sessions.' });
    }
});

// GET /api/chat/history/:sessionId — Load all messages for a session
router.get('/history/:sessionId', protect, async (req, res) => {
    try {
        const ChatHistory = getChatHistory();
        const { id: userId } = req.user;
        const { sessionId } = req.params;

        const chats = await ChatHistory.findAll({
            where: { userId, sessionId },
            order: [['timestamp', 'ASC']],
            raw: true
        });

        const history = chats.map(c => ({
            id: c.id,
            message: c.message,
            reply: c.response,
            timestamp: c.createdAt
        }));

        res.json({ history, sessionId });
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ message: 'Failed to load chat history.' });
    }
});

// DELETE /api/chat/history/:sessionId — Delete a chat session
router.delete('/history/:sessionId', protect, async (req, res) => {
    try {
        const ChatHistory = getChatHistory();
        const { id: userId } = req.user;
        const { sessionId } = req.params;

        const deleted = await ChatHistory.destroy({ where: { userId, sessionId } });
        res.json({ message: 'Session deleted.', deletedCount: deleted });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ message: 'Failed to delete session.' });
    }
});

module.exports = router;
