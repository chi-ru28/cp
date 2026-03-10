import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChatContext, ChatProvider } from '../context/ChatContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
    Send, Image as ImageIcon, Mic, MicOff, LogOut, Sprout,
    Menu, X, Trash2, Plus, MessageSquare, Globe
} from 'lucide-react';
import ChatMessage from '../components/chat/ChatMessage';
import ReminderBell from '../components/chat/ReminderBell';
import WeatherWidget from '../components/chat/WeatherWidget';
import useVoice from '../hooks/useVoice';

const LANG_OPTIONS = [
    { code: 'en', label: 'EN', full: 'English' },
    { code: 'hi', label: 'हि', full: 'हिन्दी' },
    { code: 'gu', label: 'ગુ', full: 'ગુજરાતી' },
];

const ChatInterface = () => {
    const { user, logout } = useAuth();
    const { messages, sendMessage, isTyping, sessions, loadSessions, loadHistory, clearHistory, createNewChat, activeSessionId } = useChatContext();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [input, setInput] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const [imageMimeType, setImageMimeType] = useState(null);
    const [currentLang, setCurrentLang] = useState(localStorage.getItem('agri_lang') || 'en');
    const [showLangMenu, setShowLangMenu] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const { listening, startListening, stopListening, speak } = useVoice(currentLang);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        loadSessions();
        if (!activeSessionId) createNewChat();
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Auto-speak AI replies when voice is enabled
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.sender === 'ai' && voiceEnabled) {
            speak(lastMsg.text);
        }
    }, [messages]);

    const handleLogout = () => { logout(); navigate('/'); };

    const changeLang = (code) => {
        i18n.changeLanguage(code);
        localStorage.setItem('agri_lang', code);
        setCurrentLang(code);
        setShowLangMenu(false);
    };

    const handleSend = (e) => {
        e?.preventDefault();
        if (!input.trim() && !imageBase64) return;
        sendMessage(input.trim(), imageBase64, imageMimeType, imagePreview);
        setInput('');
        setImagePreview(null);
        setImageBase64(null);
        setImageMimeType(null);
    };

    const toggleVoice = () => {
        if (listening) { stopListening(); }
        else {
            startListening((transcript) => {
                setInput(prev => prev ? prev + ' ' + transcript : transcript);
            });
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            const base64 = dataUrl.split(',')[1];
            setImagePreview(dataUrl);
            setImageBase64(base64);
            setImageMimeType(file.type);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const QUICK_CHIPS = [
        { key: 'quickSoil', msg: 'Analyze my soil and suggest improvements' },
        { key: 'quickFertilizer', msg: 'Recommend the best fertilizer for my crop' },
        { key: 'quickWeather', msg: 'How does today\'s weather affect my farming?' },
        { key: 'quickTools', msg: 'Which farming tools do I need and where to buy?' },
    ];

    const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

    return (
        <div className="h-screen flex overflow-hidden bg-slate-50 font-sans">
            <Toaster position="top-right" />

            {/* Mobile overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 z-20 xl:hidden" onClick={() => setSidebarOpen(false)} />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`fixed xl:static top-0 left-0 z-30 h-full w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 xl:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-5 flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-agri-500 rounded-xl flex items-center justify-center text-white shadow"><Sprout size={20} /></div>
                            <span className="text-lg font-bold text-slate-800">AgriAssist</span>
                        </div>
                        <button className="xl:hidden text-slate-400 hover:text-slate-700" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
                    </div>

                    {/* New chat */}
                    <button onClick={createNewChat} className="w-full flex items-center gap-3 mb-5 px-4 py-3 rounded-xl bg-agri-50 text-agri-700 hover:bg-agri-100 transition-colors border border-agri-100 font-semibold text-sm">
                        <Plus size={16} /> {t('newChat')}
                    </button>

                    {/* Sessions */}
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">{t('recentChats')}</p>
                    <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
                        {sessions.length === 0 && <p className="text-xs text-slate-400 italic px-2 mt-2">{t('noPreviousChats')}</p>}
                        {sessions.map((s, i) => (
                            <div key={i} onClick={() => { loadHistory(s.sessionId); setSidebarOpen(false); }}
                                className={`group relative flex items-center w-full px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${activeSessionId === s.sessionId ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <MessageSquare size={14} className="shrink-0 mr-2.5 opacity-60" />
                                <span className="text-sm truncate flex-1">{s.title}</span>
                                {activeSessionId === s.sessionId && (
                                    <button onClick={e => { e.stopPropagation(); clearHistory(s.sessionId); }}
                                        className="opacity-0 group-hover:opacity-100 ml-1 p-1 text-slate-400 hover:text-red-500 rounded transition-all">
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* User footer */}
                    <div className="pt-4 border-t border-slate-100 mt-auto">
                        <div className="flex items-center gap-3 px-2 mb-2">
                            <div className="w-8 h-8 bg-agri-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{userInitials}</div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-700 truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-colors text-sm">
                            <LogOut size={16} /> {t('logout')}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main area */}
            <main className="flex-1 flex flex-col relative w-full h-full bg-slate-50">
                {/* Header */}
                <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-sm z-10">
                    <button className="xl:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
                    <div className="flex items-center gap-3">
                        <WeatherWidget location="Ahmedabad" />
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Language switcher */}
                        <div className="relative">
                            <button onClick={() => setShowLangMenu(!showLangMenu)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-sm text-slate-600 hover:border-agri-400 transition-colors">
                                <Globe size={14} />
                                {LANG_OPTIONS.find(l => l.code === currentLang)?.label || 'EN'}
                            </button>
                            <AnimatePresence>
                                {showLangMenu && (
                                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 w-32">
                                        {LANG_OPTIONS.map(l => (
                                            <button key={l.code} onClick={() => changeLang(l.code)}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-agri-50 transition-colors ${currentLang === l.code ? 'font-bold text-agri-600' : 'text-slate-600'}`}>
                                                {l.label} {l.full}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <ReminderBell />
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
                            <div className="w-2 h-2 rounded-full bg-agri-500 animate-pulse" />
                            <span className="capitalize">{user?.role} Panel</span>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-36 scroll-smooth w-full">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center pt-16 text-center">
                                <Sprout size={56} className="text-agri-400 mb-4" />
                                <h3 className="text-2xl font-bold text-slate-700">{t('howCanIHelp')}</h3>
                                <p className="text-slate-400 mt-2 mb-8">{t('emptyChatSubtitle')}</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {QUICK_CHIPS.map(chip => (
                                        <button key={chip.key} onClick={() => { setInput(chip.msg); }}
                                            className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:border-agri-400 hover:text-agri-600 hover:bg-agri-50 transition-all shadow-sm font-medium">
                                            {t(chip.key)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <ChatMessage key={idx} msg={msg} onSpeak={(text) => speak(text)} />
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-4 w-20 flex gap-1 justify-center shadow-md">
                                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input area */}
                <div className="absolute bottom-0 w-full left-0 right-0 p-4 md:p-5 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
                    <div className="max-w-4xl mx-auto">
                        {/* Image preview */}
                        {imagePreview && (
                            <div className="mb-2 relative w-20">
                                <img src={imagePreview} alt="preview" className="w-20 h-16 object-cover rounded-xl border border-slate-200" />
                                <button onClick={() => { setImagePreview(null); setImageBase64(null); setImageMimeType(null); }}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600">
                                    <X size={10} />
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSend}
                            className="relative bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-2 flex items-end gap-2 focus-within:ring-2 focus-within:ring-agri-200 focus-within:border-agri-400 transition-all">

                            {/* Image upload */}
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <button type="button" onClick={() => fileInputRef.current?.click()}
                                className="p-3 text-slate-400 hover:text-agri-600 hover:bg-slate-50 rounded-xl transition-colors hidden sm:block shrink-0">
                                <ImageIcon size={20} />
                            </button>

                            {/* Voice */}
                            <button type="button" onClick={toggleVoice}
                                className={`p-3 rounded-xl transition-colors shrink-0 ${listening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-slate-400 hover:text-agri-600 hover:bg-slate-50'}`}>
                                {listening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>

                            <textarea rows="1"
                                className="w-full max-h-32 px-2 py-3 bg-transparent border-0 focus:ring-0 resize-none text-slate-700 placeholder:text-slate-400 self-center text-sm"
                                placeholder={listening ? t('listeningPlaceholder') : t('chatPlaceholder')}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                            />

                            {/* Voice toggle status */}
                            <button type="button" onClick={() => setVoiceEnabled(!voiceEnabled)}
                                className={`p-2 rounded-xl text-xs font-semibold transition-all shrink-0 hidden md:flex items-center gap-1 ${voiceEnabled ? 'text-agri-600 bg-agri-50' : 'text-slate-400 bg-slate-50'}`}>
                                🔊
                            </button>

                            <button type="submit" disabled={(!input.trim() && !imageBase64) || isTyping}
                                className="p-3 bg-agri-500 hover:bg-agri-600 disabled:bg-slate-200 text-white rounded-xl transition-all shadow-md shrink-0">
                                <Send size={18} className={input.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''} />
                            </button>
                        </form>
                        <p className="text-center mt-2 text-xs text-slate-400">{t('chatDisclaimer')}</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

const ChatPage = () => (
    <ChatProvider>
        <ChatInterface />
    </ChatProvider>
);

export default ChatPage;
