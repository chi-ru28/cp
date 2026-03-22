import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ChatContext = createContext();

export const useChatContext = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState('');
    const [analyses, setAnalyses] = useState([]);
    const [reminders, setReminders] = useState([]);

    const [loading, setLoading] = useState(true);

    // Initial Health Check to wake up Render (Cold Start handling)
    useEffect(() => {
        const wakeUpServer = async () => {
            try {
                // Timeout after 10 seconds for the wake-up call
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                await fetch(`${API_URL}/health`, { signal: controller.signal });
                clearTimeout(timeoutId);
            } catch (err) {
                console.log("Server waking up or unreachable...");
            } finally {
                setLoading(false);
            }
        };
        wakeUpServer();
    }, []);

    const loadReminders = async () => {
        try {
            const res = await api.get('/reminder');
            setReminders(res.data.reminders || []);
        } catch (err) {
            console.error("Failed to load reminders", err);
        }
    };

    useEffect(() => {
        loadReminders();
    }, []);

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
                res.data.history.forEach((chat, idx) => {
                    // Node.js format: { message (user text), reply (ai text) }
                    if (chat.message !== undefined || chat.reply !== undefined) {
                        if (chat.message) {
                            formatted.push({
                                id: `u_${chat.id || idx}`,
                                text: chat.message,
                                sender: 'user',
                                timestamp: chat.timestamp
                            });
                        }
                        if (chat.reply) {
                            formatted.push({
                                id: `a_${chat.id || idx}`,
                                text: chat.reply,
                                sender: 'ai',
                                timestamp: chat.timestamp
                            });
                        }
                    }
                    // Python FastAPI format: { sender: 'user'|'ai', message }
                    else if (chat.sender && chat.message) {
                        formatted.push({
                            id: `${chat.sender}_${chat.id || idx}`,
                            text: chat.message,
                            sender: chat.sender === 'user' ? 'user' : 'ai',
                            timestamp: chat.timestamp
                        });
                    }
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
            const token = localStorage.getItem('token');
            const messageStr = text || 'Please analyze this image.';
            
            // Use the unified API_URL for chat
            const res = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: messageStr,
                    sessionId: activeSessionId,
                    imageBase64,
                    imageMimeType
                })
            });

            if (!res.ok) {
                throw new Error("API error");
            }

            const data = await res.json();
            const aiReply = data.reply || 'No response received.';
            
            const aiMsg = { 
                id: (Date.now() + 1).toString(), 
                text: aiReply, 
                sender: 'ai', 
                timestamp: new Date(),
                intent: data.type,
                source: data.source,
                images: data.images
            };
            setMessages(prev => [...prev, aiMsg]);
            
            if (data.sessionId) setActiveSessionId(data.sessionId);
            if (data.reminder_created && data.reminder) {
                setReminders(prev => {
                    if (prev.find(r => r.id === data.reminder.id)) return prev;
                    return [...prev, data.reminder];
                });
            } else if (data.reminder_created) {
                await loadReminders();
            }
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

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/chat/analyze-image`, {
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
            messages, sessions, activeSessionId, isTyping, error, analyses, reminders, loading, setReminders, setMessages,
            loadSessions, loadHistory, clearHistory, sendMessage, createNewChat,
            loadAnalyses, deleteAnalysis, analyzeImage, loadReminders
        }}>
            {children}
        </ChatContext.Provider>
    );
};
