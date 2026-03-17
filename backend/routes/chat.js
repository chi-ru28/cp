const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { protect } = require('../middleware/auth');
const { getChatSession } = require('../models/ChatSession');
const { getChatMessage } = require('../models/ChatMessage');
const { detectLanguage, isGreeting } = require('../services/gemini');
const { getWeather } = require('../services/weather');
const axios = require('axios');

// POST /api/chat/ — Send message, get AI reply
router.post('/', protect, async (req, res) => {
    try {
        const ChatSession = getChatSession();
        const ChatMessage = getChatMessage();
        const { message, sessionId, location = 'Ranuj', imageBase64, imageMimeType } = req.body;

        const { id: userId, role, name } = req.user;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required.' });
        }

        const trimmedMessage = message.trim();
        const language = detectLanguage(trimmedMessage);
        let currentSessionId = sessionId;

        // Ensure session exists
        if (!currentSessionId) {
            currentSessionId = uuidv4();
            await ChatSession.create({
                id: currentSessionId,
                userId,
                role: role || 'farmer',
                title: trimmedMessage.substring(0, 40)
            });
        } else {
            const session = await ChatSession.findByPk(currentSessionId);
            if (!session) {
                await ChatSession.create({
                    id: currentSessionId,
                    userId,
                    role: role || 'farmer',
                    title: trimmedMessage.substring(0, 40)
                });
            }
        }

        // Handle greeting shortcut
        if (isGreeting(trimmedMessage)) {
            const menu = role === 'shopkeeper'
                ? '🏪 Welcome Shopkeeper!\n\n1️⃣ Inventory update\n2️⃣ Stock limits & advisory\n3️⃣ View chat history\n\nHow can I assist your agri-business today?'
                : '👨‍🌾 Welcome to AgriAssist!\n\n1️⃣ Detect crop issue\n2️⃣ Fertilizer advice\n3️⃣ Tool suggestions\n4️⃣ Check weather impact\n5️⃣ View history\n\nWhat can I help you with today?';

            await ChatMessage.create({
                sessionId: currentSessionId,
                sender: 'user',
                message: trimmedMessage,
                intent: 'greeting'
            });

            await ChatMessage.create({
                sessionId: currentSessionId,
                sender: 'ai',
                message: menu,
                intent: 'greeting'
            });

            return res.json({ reply: menu, sessionId: currentSessionId, language });
        }

        // Get weather context if requested
        let weatherInfo = '';
        if (role === 'farmer' && trimmedMessage.toLowerCase().includes('weather')) {
            weatherInfo = await getWeather(location);
        }

        // Save User Message
        await ChatMessage.create({
            sessionId: currentSessionId,
            sender: 'user',
            message: trimmedMessage,
            intent: 'query'
        });

        // Generate AI reply using Python FastAPI Engine
        let finalReply = '🙏 I\'m having trouble connecting to the AI right now. Please try again shortly.';
        try {
            const pythonResponse = await axios.post('http://127.0.0.1:8000/api/chat', {
                message: trimmedMessage,
                sessionId: currentSessionId,
                role: role,
                location: location,
                imageBase64: imageBase64,
                imageMimeType: imageMimeType
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization // Forward the token
                },
                timeout: 30000 
            });
            
            if (pythonResponse.data && pythonResponse.data.reply) {
                finalReply = pythonResponse.data.reply;
            }
        } catch (pyError) {
            console.error('Failed to reach Python Chatbot Engine at 8000:', pyError.message);
        }

        // Save AI Response
        await ChatMessage.create({
            sessionId: currentSessionId,
            sender: 'ai',
            message: finalReply,
            intent: 'query'
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
        const ChatSession = getChatSession();
        const { id: userId } = req.user;

        const sessions = await ChatSession.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            raw: true
        });

        const formatted = sessions.map(s => ({
            sessionId: s.id,
            title: s.title || 'New Chat',
            updatedAt: s.createdAt
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
        const ChatMessage = getChatMessage();
        const { sessionId } = req.params;

        const chats = await ChatMessage.findAll({
            where: { sessionId },
            order: [['timestamp', 'ASC']],
            raw: true
        });

        const history = chats.map(c => ({
            id: c.id,
            message: c.sender === 'user' ? c.message : null,
            reply: c.sender === 'ai' ? c.message : null,
            sender: c.sender,
            text: c.message,
            timestamp: c.timestamp
        }));

        // Group into user/ai pairs for the frontend if needed, 
        // but current frontend expects an array of messages
        res.json({ history, sessionId });
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ message: 'Failed to load chat history.' });
    }
});

// DELETE /api/chat/history/:sessionId — Delete a chat session
router.delete('/history/:sessionId', protect, async (req, res) => {
    try {
        const ChatSession = getChatSession();
        const ChatMessage = getChatMessage();
        const { id: userId } = req.user;
        const { sessionId } = req.params;

        await ChatMessage.destroy({ where: { sessionId } });
        const deleted = await ChatSession.destroy({ where: { id: sessionId, userId } });
        res.json({ message: 'Session deleted.', deletedCount: deleted });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ message: 'Failed to delete session.' });
    }
});

module.exports = router;
