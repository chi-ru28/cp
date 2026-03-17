import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 
                   (window.location.hostname.includes('vercel.app') 
                    ? `${window.location.origin}/ai-api` 
                    : 'http://localhost:8000');

const ChatContext = createContext();

export const useChatContext = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState('');
    const [analyses, setAnalyses] = useState([]);

    const loadSessions = async () => {
        try {
            const res = await api.get('/chat/sessions');
            setSessions(res.data.sessions || []);
        } catch (err) {
            console.error("Failed to load sessions", err);
        }
    };

    const loadHistory = async (sessionId) => {
        if (!sessionId) {
            setMessages([]);
            return;
        }
        try {
            const res = await api.get(`/chat/history/${sessionId}`);
            if (res.data.history) {
                const formatted = [];
                res.data.history.forEach(chat => {
                    formatted.push({ id: `u_${chat.id}`, text: chat.message, sender: 'user', timestamp: chat.timestamp });
                    formatted.push({ id: `a_${chat.id}`, text: chat.reply, sender: 'ai', timestamp: chat.timestamp });
                });
                setMessages(formatted);
                setActiveSessionId(sessionId);
            }
        } catch (err) {
            console.error("Failed to load chat history", err);
        }
    };

    const clearHistory = async (sessionId) => {
        if (!sessionId) return;
        try {
            await api.delete(`/chat/history/${sessionId}`);
            if (activeSessionId === sessionId) {
                setMessages([]);
                setActiveSessionId(null);
            }
            await loadSessions();
        } catch (err) {
            console.error("Failed to clear history");
        }
    };

    const createNewChat = () => {
        setActiveSessionId(null);
        setMessages([]);
    };

    const sendMessage = async (text, imageBase64 = null, imageMimeType = null, imagePreview = null) => {
        const userMsg = { id: Date.now().toString(), text: text || '📷 Image', sender: 'user', timestamp: new Date(), imagePreview };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);
        setError('');

        try {
            const token = localStorage.getItem('agri_assist_token');
            
            // STEP 7: Health Check (FastAPI)
            try {
                const healthRes = await fetch(`${FASTAPI_URL}/health`);
                const healthData = await healthRes.json();
                if (healthData.status !== "ok") {
                    throw new Error("Server unhealthy");
                }
            } catch (err) {
                console.warn("FastAPI health check failed, falling back to message attempt");
            }

            // STEP 4 & 6 & 7: Fetch API (FastAPI - Elite Pipeline)
            const message = text || 'Please analyze this image.';
            const response = await fetch(`${FASTAPI_URL}/api/chat`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    message,
                    sessionId: activeSessionId,
                    imageBase64,
                    imageMimeType
                })
            });

            if (!response.ok) {
                // If 8000 fails, try Node.js fallback (5000)
                console.warn("Direct FastAPI call failed, trying Node.js bridge...");
                const bridgeRes = await api.post('/chat', {
                    message,
                    sessionId: activeSessionId,
                    imageBase64,
                    imageMimeType
                });
                
                const aiReply = bridgeRes.data.reply || 'No response received.';
                const aiMsg = { id: (Date.now() + 1).toString(), text: aiReply, sender: 'ai', timestamp: new Date() };
                setMessages(prev => [...prev, aiMsg]);
                if (bridgeRes.data.sessionId) setActiveSessionId(bridgeRes.data.sessionId);
                await loadSessions();
                return;
            }

            const data = await response.json();
            const aiReply = data.reply || 'No response received.';

            if (aiReply === "AI service is temporarily unavailable") {
                setError('⚠️ AI service is temporarily unavailable.');
            }

            const aiMsg = { id: (Date.now() + 1).toString(), text: aiReply, sender: 'ai', timestamp: new Date() };
            setMessages(prev => [...prev, aiMsg]);

            if (data.sessionId) setActiveSessionId(data.sessionId);
            await loadSessions();
        } catch (error) {
            console.error("Chat Error:", error);
            setError('⚠️ Server is not connected. Please try again.');
            const errMsg = { id: (Date.now() + 1).toString(), text: '⚠️ Server is not connected. Please try again.', sender: 'ai', timestamp: new Date() };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const analyzeImage = async (file) => {
        setIsTyping(true);
        setError('');
        
        const userMsg = { 
            id: Date.now().toString(), 
            text: `🔍 Analyzing crop image: ${file.name}`, 
            sender: 'user', 
            timestamp: new Date() 
        };
        setMessages(prev => [...prev, userMsg]);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('agri_assist_token');
            const response = await fetch(`${FASTAPI_URL}/api/chat/analyze-image`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Analysis failed");
            }

            const data = await response.json();
            
            const aiMsg = { 
                id: (Date.now() + 1).toString(), 
                text: `✅ Analysis Complete!`,
                analysisResult: data, 
                sender: 'ai', 
                timestamp: new Date() 
            };
            setMessages(prev => [...prev, aiMsg]);
            
            await loadAnalyses();
        } catch (err) {
            console.error("Analysis Error:", err);
            setError(err.message || 'Unable to analyze image. Please try again.');
            const errMsg = { 
                id: (Date.now() + 1).toString(), 
                text: `⚠️ ${err.message || 'Unable to analyze image. Please try again.'}`, 
                sender: 'ai', 
                timestamp: new Date() 
            };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setIsTyping(false);
        }
    };


    const loadAnalyses = async () => {
        try {
            const res = await api.get('/analysis');
            setAnalyses(res.data.reports || []);
        } catch (err) {
            console.error("Failed to load crop analyses", err);
        }
    };

    const deleteAnalysis = async (id) => {
        try {
            await api.delete(`/analysis/${id}`);
            await loadAnalyses();
        } catch (err) {
            console.error("Failed to delete analysis", err);
        }
    };

    return (
        <ChatContext.Provider value={{
            messages, sessions, activeSessionId, isTyping, error, analyses,
            loadSessions, loadHistory, clearHistory, sendMessage, createNewChat,
            loadAnalyses, deleteAnalysis, analyzeImage
        }}>
            {children}
        </ChatContext.Provider>
    );
};
