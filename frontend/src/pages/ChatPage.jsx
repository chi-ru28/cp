import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChatContext, ChatProvider } from '../context/ChatContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
    Send, Image as ImageIcon, Mic, MicOff, LogOut, Sprout,
    Menu, X, Trash2, Plus, MessageSquare, Globe, Check, Leaf, FileText,
    MapPin, CloudSun, Package, Volume2, Bell
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
    const { 
        messages, sendMessage, isTyping, sessions, loadSessions, 
        loadHistory, clearHistory, createNewChat, activeSessionId,
        analyses, loadAnalyses, deleteAnalysis, analyzeImage
    } = useChatContext();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [input, setInput] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const [imageMimeType, setImageMimeType] = useState(null);
    const [currentLang, setCurrentLang] = useState(localStorage.getItem('agri_lang') || 'en');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [viewMode, setViewMode] = useState('chat'); // 'chat' or 'analysis'
    const [confirmDelete, setConfirmDelete] = useState(null); // sessionId to confirm
    const [selectedFile, setSelectedFile] = useState(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const { listening, startListening, stopListening, speak } = useVoice(currentLang);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        loadSessions();
        loadAnalyses();
        if (!activeSessionId) createNewChat();
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
        setSelectedFile(file);
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

    const handleAnalyze = () => {
        if (!selectedFile) return;
        analyzeImage(selectedFile);
        setSelectedFile(null);
        setImagePreview(null);
        setImageBase64(null);
        setImageMimeType(null);
    };

    const QUICK_CHIPS = [
        { key: 'quickSoil', msg: 'Analyze my soil and suggest improvements', icon: <MapPin size={14} /> },
        { key: 'quickFertilizer', msg: 'Recommend the best fertilizer for my crop', icon: <Leaf size={14} /> },
        { key: 'quickWeather', msg: 'How does today\'s weather affect my farming?', icon: <CloudSun size={14} /> },
        { key: 'quickTools', msg: 'Which farming tools do I need and where to buy?', icon: <Package size={14} /> },
    ];

    const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

    return (
        <div className="h-screen flex overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-agri-50/50 via-slate-50 to-white font-sans">
            <Toaster position="top-right" />

            {/* Mobile overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 xl:hidden" onClick={() => setSidebarOpen(false)} />
                )}
            </AnimatePresence>

            {/* Sidebar (Glassmorphic) */}
            <aside className={`fixed xl:relative top-0 left-0 z-50 h-[100dvh] transition-all duration-300 ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0 xl:w-0 overflow-hidden'}`}>
                <div className="h-full m-3 xl:mr-0 rounded-[2rem] glass border-white/40 shadow-2xl flex flex-col overflow-hidden">
                    <div className="p-7 flex flex-col h-full">
                        {/* Logo */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3.5">
                                <motion.div whileHover={{ rotate: 15 }} className="w-11 h-11 bg-gradient-to-br from-agri-400 to-agri-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-agri-500/20">
                                    <Sprout size={24} />
                                </motion.div>
                                <span className="text-xl font-black text-slate-800 tracking-tight font-display">AgriAssist</span>
                            </div>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors" onClick={() => setSidebarOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* New chat button */}
                        <motion.button 
                            whileHover={{ scale: 1.02 }} 
                            whileTap={{ scale: 0.98 }}
                            onClick={createNewChat} 
                            className="w-full flex items-center justify-center gap-2 mb-8 px-4 py-4 rounded-[1.25rem] bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 font-bold text-sm"
                        >
                            <Plus size={18} /> {t('newChat')}
                        </motion.button>

                        {/* Sessions List */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 px-2">{t('recentChats')}</p>
                            <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                {sessions.length === 0 && <p className="text-xs text-slate-400 italic px-4 mt-4">{t('noPreviousChats')}</p>}
                                {sessions.map((s, i) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, x: -10 }} 
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => { loadHistory(s.sessionId); setSidebarOpen(false); }}
                                        className={`group relative flex items-center w-full px-4 py-3.5 rounded-2xl cursor-pointer transition-all ${activeSessionId === s.sessionId ? 'bg-agri-500/10 text-agri-700 font-bold' : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'}`}
                                    >
                                        <MessageSquare size={16} className={`shrink-0 mr-3 ${activeSessionId === s.sessionId ? 'text-agri-600' : 'opacity-40 group-hover:opacity-70'}`} />
                                        <span className="text-sm truncate flex-1">{s.title}</span>
                                        {activeSessionId === s.sessionId && (
                                            <button onClick={e => { e.stopPropagation(); setConfirmDelete(s.sessionId); }}
                                                className="opacity-0 group-hover:opacity-100 ml-1 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                        {confirmDelete === s.sessionId && (
                                            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-3 px-3 z-10 border border-red-100 animate-in fade-in slide-in-from-right-2">
                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Delete?</span>
                                                <div className="flex gap-1">
                                                    <button onClick={e => { e.stopPropagation(); clearHistory(s.sessionId); setConfirmDelete(null); }} className="px-2 py-1 bg-red-500 text-white rounded-md text-[10px] font-bold">YES</button>
                                                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(null); }} className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold tracking-widest">NO</button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Analysis Reports Link */}
                        {user?.role === 'farmer' && (
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                 <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 px-2">Intelligence</p>
                                 <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => { setViewMode(viewMode === 'analysis' ? 'chat' : 'analysis'); setSidebarOpen(false); }} 
                                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm shadow-sm ${viewMode === 'analysis' ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-xl' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                                 >
                                    <Leaf size={18} /> {viewMode === 'analysis' ? 'Back to Messaging' : 'Disease History'}
                                 </motion.button>
                            </div>
                        )}

                        {/* User Profile */}
                        <div className="pt-6 border-t border-slate-100 mt-6 shrink-0">
                            <div className="flex items-center gap-4 px-2 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-tr from-agri-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-agri-500/20">{userInitials}</div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate leading-tight">{user?.name || 'User'}</p>
                                    <p className="text-[10px] font-black text-agri-500 uppercase tracking-widest mt-0.5">{user?.role}</p>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all text-xs font-bold uppercase tracking-widest">
                                <LogOut size={16} /> {t('logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Messenger Area */}
            <main className="flex-1 flex flex-col min-w-0 chat-page relative">
                {/* Header (Glass) */}
                <header className="header flex items-center justify-between px-6 sm:px-10 shrink-0 border-b border-white/40">
                    <div className="flex items-center gap-6">
                        {!isSidebarOpen && (
                            <button className="w-10 h-10 flex items-center justify-center bg-white rounded-2xl shadow-sm text-slate-600 hover:bg-slate-50 transition-all" onClick={() => setSidebarOpen(true)}>
                                <Menu size={20} />
                            </button>
                        )}
                        <div className="flex items-center gap-1">
                            <div className="hidden sm:block">
                                <WeatherWidget location="Ahmedabad" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-5">
                        <div className="relative">
                            <button onClick={() => setShowLangMenu(!showLangMenu)}
                                className="flex items-center gap-2 px-4 py-2 rounded-[1rem] bg-white/80 border border-slate-100 text-xs font-bold text-slate-600 hover:border-agri-500 transition-all shadow-sm">
                                <Globe size={14} className="text-agri-500" />
                                {LANG_OPTIONS.find(l => l.code === currentLang)?.label || 'EN'}
                            </button>
                            <AnimatePresence>
                                {showLangMenu && (
                                    <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute right-0 top-12 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] w-40 p-1.5 translate-y-2">
                                        {LANG_OPTIONS.map(l => (
                                            <button key={l.code} onClick={() => changeLang(l.code)}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${currentLang === l.code ? 'bg-agri-500 text-white shadow-lg shadow-agri-500/30' : 'text-slate-600 hover:bg-agri-50'}`}>
                                                {l.full}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <ReminderBell />
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 rounded-2xl bg-white/80 border border-slate-100 text-slate-400 hover:text-agri-500 shadow-sm transition-all"
                        >
                            <Bell size={20} strokeWidth={2.5} />
                        </motion.button>
                        <div className="hidden md:flex items-center gap-2.5 bg-slate-900 px-4 py-2.5 rounded-full text-[10px] font-black text-white shadow-xl shadow-slate-900/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-agri-400 animate-pulse shadow-[0_0_8px_var(--color-agri-400)]" />
                            <span className="uppercase tracking-[0.1em]">{user?.role} Mode</span>
                        </div>
                    </div>
                </header>

                {/* Messages Container */}
                <div className="flex-1 px-4 py-8 md:px-10 flex flex-col items-center chat-messages chat-body w-full relative">
                    <div className="w-full max-w-4xl space-y-6">
                        <AnimatePresence mode="wait">
                            {viewMode === 'chat' ? (
                                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {messages.length === 0 && (
                                        <div className="flex flex-col items-center justify-center pt-24 text-center max-w-2xl mx-auto">
                                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="w-24 h-24 bg-gradient-to-tr from-agri-100 to-agri-50 rounded-[2.5rem] flex items-center justify-center text-agri-500 mb-8 border border-agri-100 shadow-xl shadow-agri-500/5"><Sprout size={48} /></motion.div>
                                            <h1 className="text-4xl font-extrabold text-slate-800 font-display tracking-tight leading-tight">{t('howCanIHelp')}</h1>
                                            <p className="text-slate-400 mt-4 mb-14 text-lg font-medium tracking-tight">Your intelligent companion for smarter farming and better yields.</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-4">
                                                {QUICK_CHIPS.map(chip => (
                                                    <motion.button 
                                                        key={chip.key} 
                                                        whileHover={{ scale: 1.02, y: -2 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => { setInput(chip.msg); }}
                                                        className="p-5 bg-white border border-slate-100 rounded-3xl text-left hover:border-agri-400 hover:shadow-xl hover:shadow-agri-500/10 transition-all shadow-premium group flex flex-col gap-4"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-agri-50 text-agri-500 flex items-center justify-center group-hover:bg-agri-500 group-hover:text-white transition-all transform group-hover:rotate-6">
                                                            {chip.icon}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-slate-700 text-sm">{t(chip.key)}</span>
                                                            <Plus size={16} className="text-slate-200 group-hover:text-agri-400 transition-colors" />
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {messages.map((msg, idx) => (
                                        <ChatMessage key={idx} msg={msg} onSpeak={(text) => speak(text)} />
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-start mb-6">
                                            <div className="bg-white border border-slate-100 rounded-[2rem] rounded-tl-[4px] px-6 py-4 w-24 flex gap-1.5 justify-center shadow-premium">
                                                <span className="w-2 h-2 rounded-full bg-agri-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-2 h-2 rounded-full bg-agri-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-2 h-2 rounded-full bg-agri-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="analysis" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                                    <div className="flex flex-col gap-2 mb-10">
                                        <h2 className="text-4xl font-extrabold text-slate-800 font-display tracking-tight">Crop Health Archive</h2>
                                        <p className="text-slate-400 font-medium">History of AI-detected issues and treatment records.</p>
                                    </div>
                                    {analyses.length === 0 ? (
                                        <div className="py-24 text-center bg-white rounded-[3rem] border border-slate-100 shadow-premium">
                                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-6"><FileText size={48} /></div>
                                            <p className="text-slate-400 font-bold tracking-tight">No health reports found yet.</p>
                                            <button onClick={() => setViewMode('chat')} className="mt-8 px-6 py-3 bg-agri-500 text-white rounded-2xl font-bold shadow-lg shadow-agri-500/20 hover:scale-105 transition-all">Start New Diagnosis</button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {analyses.map((report, idx) => (
                                                <motion.div 
                                                    key={idx} 
                                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                                                    className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-premium hover:shadow-2xl hover:-translate-y-1 transition-all group"
                                                >
                                                    <div className="flex items-start justify-between mb-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:-rotate-3 shadow-sm"><Leaf size={24} /></div>
                                                            <div>
                                                                <h4 className="font-extrabold text-slate-800 text-lg line-clamp-1">{report.detected_problem || report.detected_issue || report.diagnosis}</h4>
                                                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{new Date(report.report_generated_at || report.created_at || report.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</p>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => deleteAnalysis(report.id)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                                                    </div>
                                                    <div className="space-y-4 mb-8">
                                                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs text-emerald-800 font-medium">
                                                            <span className="font-black text-emerald-500 uppercase tracking-widest block mb-1 text-[10px]">Natural Control</span>
                                                            <p className="line-clamp-2">{report.organic_solution || report.organicAlternative}</p>
                                                        </div>
                                                        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-xs text-amber-800 font-medium">
                                                            <span className="font-black text-amber-500 uppercase tracking-widest block mb-1 text-[10px]">Professional Action</span>
                                                            <p className="line-clamp-2">{report.chemical_solution || report.chemicalSolution}</p>
                                                        </div>
                                                    </div>
                                                    <motion.button 
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => { setViewMode('chat'); sendMessage(`Show details for my ${report.detected_issue || report.diagnosis} analysis`); }}
                                                        className="w-full py-4 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-slate-100 shadow-sm"
                                                    >
                                                        Open Full Diagnosis
                                                    </motion.button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {!isTyping && messages.length > 0 && <div className="chat-end-spacing" style={{ height: "40px" }} />}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* FAB / Floating Input Area (ChatGPT Style) */}
                <div className="chat-input-container z-40">
                    <div className="max-w-4xl mx-auto pointer-events-auto">
                        <AnimatePresence>
                            {imagePreview && (
                                <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                    className="mb-4 glass p-2 pr-4 rounded-3xl w-fit flex items-center gap-4 shadow-2xl border-white/60"
                                >
                                    <div className="relative group">
                                        <img src={imagePreview} alt="preview" className="w-20 h-20 object-cover rounded-2xl shadow-md border-2 border-white" />
                                        <button onClick={() => { setImagePreview(null); setImageBase64(null); setImageMimeType(null); setSelectedFile(null); }}
                                            className="absolute -top-2 -right-2 w-7 h-7 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-700 hover:scale-110 transition-all border-2 border-white">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Image Loaded</p>
                                        <button onClick={handleAnalyze} className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.1em] rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all">
                                            Analyze Disease
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSend}
                            className="glass rounded-[2.5rem] p-2 flex items-end gap-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border-white/50 focus-within:ring-4 focus-within:ring-agri-500/10 focus-within:border-agri-400 transition-all group">

                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            
                            <div className="flex items-center gap-1.5 p-1">
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" onClick={() => fileInputRef.current?.click()}
                                    className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-agri-500 hover:bg-agri-50 rounded-full transition-all shrink-0">
                                    <ImageIcon size={22} />
                                </motion.button>

                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" onClick={toggleVoice}
                                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all shrink-0 ${listening ? 'text-white bg-rose-500 shadow-xl shadow-rose-500/30' : 'text-slate-400 hover:text-agri-500 hover:bg-agri-50'}`}>
                                    {listening ? <MicOff size={22} /> : <Mic size={22} />}
                                </motion.button>
                            </div>

                            <textarea rows="1"
                                className="flex-1 max-h-48 px-2 py-4 bg-transparent border-0 focus:ring-0 resize-none text-slate-800 placeholder:text-slate-400 self-center text-base font-medium tracking-tight"
                                placeholder={listening ? "I'm listening..." : "Message AgriAssist..."}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                            />

                            <div className="flex items-center gap-2 p-1">
                                <button type="button" onClick={() => setVoiceEnabled(!voiceEnabled)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full text-sm shadow-inner transition-all shrink-0 ${voiceEnabled ? 'bg-agri-50 text-agri-600 font-bold border border-agri-100' : 'bg-slate-50 text-slate-300'}`}>
                                    {voiceEnabled ? <Volume2 size={16} /> : <Volume2 size={16} className="opacity-30" />}
                                </button>

                                <motion.button 
                                    whileHover={{ scale: 1.05 }} 
                                    whileTap={{ scale: 0.95 }}
                                    type="submit" 
                                    disabled={(!input.trim() && !imageBase64) || isTyping}
                                    className="w-12 h-12 bg-agri-500 hover:bg-agri-600 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-full transition-all shadow-xl shadow-agri-500/20 shrink-0 flex items-center justify-center"
                                >
                                    <Send size={20} className={input.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
                                </motion.button>
                            </div>
                        </form>
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
