import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

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
            const payload = {
                message: text || 'Please analyze this image.',
                role: 'farmer',
                location: 'Ranuj',
                sessionId: activeSessionId,
                ...(imageBase64 && { imageBase64, imageMimeType }),
            };

            const token = localStorage.getItem('agri_assist_token');
            const res = await fetch("http://localhost:8000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error("Unable to reach AI assistant");
            }

            const data = await res.json();
            const aiReply = data.response || data.reply || 'No response received.';
            const newSessionId = data.sessionId;

            const aiMsg = { id: (Date.now() + 1).toString(), text: aiReply, sender: 'ai', timestamp: new Date() };
            setMessages(prev => [...prev, aiMsg]);

            if (!activeSessionId) {
                setActiveSessionId(newSessionId);
            }
            await loadSessions();
        } catch (error) {
            setError('Unable to reach AI assistant');
            const errMsg = { id: (Date.now() + 1).toString(), text: 'Unable to reach AI assistant', sender: 'ai', timestamp: new Date() };
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
            loadAnalyses, deleteAnalysis
        }}>
            {children}
        </ChatContext.Provider>
    );
};
