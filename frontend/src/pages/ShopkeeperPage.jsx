import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChatContext, ChatProvider } from '../context/ChatContext';
import { Sprout, LogOut, Plus, Trash2, Edit3, X, Check, Package, MessageSquare, Send, Menu, Mic, MicOff } from 'lucide-react';
import useVoice from '../hooks/useVoice';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import ChatMessage from '../components/chat/ChatMessage';
import ReminderBell from '../components/chat/ReminderBell';
import api from '../services/api';

// ── Inventory Panel ───────────────────────────────────────────────────────────
const InventoryPanel = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('chemical');
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', category: 'chemical', unit: 'kg', price: '', stock: '', description: '' });

    const loadProducts = async () => {
        try { const res = await api.get('/shop/inventory'); setProducts(res.data.products || []); }
        catch { /* silent */ }
    };

    useEffect(() => { loadProducts(); }, []);

    const filtered = products.filter(p => p.category === activeTab);

    const openAdd = () => { setForm({ name: '', category: activeTab, unit: 'kg', price: '', stock: '', description: '' }); setEditingId(null); setShowModal(true); };
    const openEdit = (p) => { setForm({ name: p.name, category: p.category, unit: p.unit, price: p.price, stock: p.stock, description: p.description }); setEditingId(p.id); setShowModal(true); };

    const saveProduct = async () => {
        if (!form.name) return toast.error('Product name required');
        try {
            if (editingId) await api.put(`/shop/inventory/${editingId}`, form);
            else await api.post('/shop/inventory', form);
            toast.success(editingId ? 'Updated!' : 'Product added!');
            setShowModal(false);
            loadProducts();
        } catch { toast.error('Failed to save product'); }
    };

    const toggleAvailable = async (p) => {
        try { await api.put(`/shop/inventory/${p.id}`, { available: !p.available }); loadProducts(); }
        catch { toast.error('Failed to update'); }
    };

    const deleteProduct = async (id) => {
        try { await api.delete(`/shop/inventory/${id}`); loadProducts(); toast.success('Deleted'); }
        catch { toast.error('Failed to delete'); }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Package size={18} className="text-agri-500" />{t('inventory')}</h2>
                <button onClick={openAdd} className="flex items-center gap-2 px-3 py-2 bg-agri-500 text-white rounded-xl text-sm font-semibold hover:bg-agri-600 transition-colors">
                    <Plus size={14} /> {t('addProduct')}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-xl">
                {['chemical', 'organic'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? 'bg-white shadow text-agri-700' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab === 'chemical' ? `🧪 ${t('chemical')}` : `🌿 ${t('organic')}`}
                    </button>
                ))}
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filtered.length === 0 && <p className="text-center text-slate-400 text-sm py-8">No {activeTab} products yet. Add some!</p>}
                {filtered.map(p => (
                    <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm group">
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.unit} · ₹{p.price} · Stock: {p.stock}</p>
                        </div>
                        <button onClick={() => toggleAvailable(p)}
                            className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${p.available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                            {p.available ? `✅ ${t('available')}` : `❌ ${t('outOfStock')}`}
                        </button>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-agri-600 rounded-lg hover:bg-slate-100"><Edit3 size={14} /></button>
                            <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={14} /></button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800">{editingId ? 'Edit Product' : t('addProduct')}</h3>
                                <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-400" /></button>
                            </div>
                            <div className="space-y-3">
                                {[['name', 'Product Name', 'text'], ['unit', 'Unit (kg/L/pcs)', 'text'], ['price', 'Price (₹)', 'number'], ['stock', 'Stock Quantity', 'number']].map(([field, label, type]) => (
                                    <div key={field}>
                                        <label className="text-xs font-semibold text-slate-600 mb-1 block">{label}</label>
                                        <input type={type} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-agri-300"
                                            value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
                                    </div>
                                ))}
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Category</label>
                                    <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-agri-300"
                                        value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                                        <option value="chemical">🧪 Chemical</option>
                                        <option value="organic">🌿 Organic</option>
                                    </select>
                                </div>
                                <textarea rows={2} placeholder="Description (optional)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-agri-300"
                                    value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={saveProduct} className="flex-1 py-2 bg-agri-500 text-white rounded-xl font-semibold hover:bg-agri-600 transition-colors">{t('save')}</button>
                                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">{t('cancel')}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Shopkeeper Chat ───────────────────────────────────────────────────────────
const ShopkeeperChat = () => {
    const { messages, sendMessage, isTyping } = useChatContext();
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const messagesEndRef = React.useRef(null);
    const { listening, startListening, stopListening, speak } = useVoice('en');

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

    // Auto-speak AI replies
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.sender === 'ai' && voiceEnabled) {
            speak(lastMsg.text);
        }
    }, [messages]);

    const handleSend = (e) => {
        e?.preventDefault();
        if (input.trim()) { sendMessage(input.trim()); setInput(''); }
    };

    const toggleVoice = () => {
        if (listening) stopListening();
        else startListening(transcript => setInput(prev => prev ? prev + ' ' + transcript : transcript));
    };

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 shrink-0">
                <MessageSquare size={18} className="text-agri-500" /> AI Advisory
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {messages.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Ask about inventory trends, pricing advice, seasonal demand...</p>
                    </div>
                )}
                {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
                {isTyping && <div className="flex gap-1 p-3"><span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" /><span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} /></div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="flex gap-2 mt-3 shrink-0 items-end">
                <button type="button" onClick={toggleVoice}
                    className={`p-2.5 rounded-xl transition-all ${listening ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-slate-50 text-slate-400 hover:bg-agri-50 hover:text-agri-600'}`}>
                    {listening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <textarea rows={1} className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-agri-300 bg-white resize-none self-center"
                    placeholder={listening ? "Listening..." : "Ask about your inventory..."} value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}} />
                <button type="button" onClick={() => setVoiceEnabled(!voiceEnabled)} className={`p-2 rounded-xl text-xs ${voiceEnabled ? 'text-agri-600 bg-agri-50' : 'text-slate-400 bg-slate-50'}`}>🔊</button>
                <button type="submit" disabled={!input.trim() || isTyping}
                    className="p-2.5 bg-agri-500 text-white rounded-xl hover:bg-agri-600 disabled:bg-slate-200 transition-colors">
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

// ── Main Shopkeeper Page ──────────────────────────────────────────────────────
const ShopkeeperDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [mobileTab, setMobileTab] = useState('chat');

    useEffect(() => { if (!user) navigate('/login'); }, [user]);

    return (
        <div className="h-screen flex flex-col bg-slate-50 font-sans">
            <Toaster position="top-right" />
            {/* Header */}
            <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-agri-500 rounded-lg flex items-center justify-center"><Sprout size={18} className="text-white" /></div>
                    <span className="font-bold text-slate-800 text-sm">AgriAssist <span className="text-agri-500">B2B</span></span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden sm:block text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{t('shopkeeperPanel')}</span>
                    <ReminderBell />
                    <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* Mobile tabs */}
            <div className="flex md:hidden bg-white border-b border-slate-100 shrink-0">
                {['chat', 'inventory'].map(tab => (
                    <button key={tab} onClick={() => setMobileTab(tab)}
                        className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${mobileTab === tab ? 'text-agri-600 border-b-2 border-agri-500' : 'text-slate-400'}`}>
                        {tab === 'chat' ? '💬 AI Chat' : `📦 ${t('inventory')}`}
                    </button>
                ))}
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden p-4 gap-4">
                {/* Chat — hide on mobile if inventory tab active */}
                <div className={`${mobileTab === 'inventory' ? 'hidden' : 'flex'} md:flex flex-col flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-hidden`}>
                    <ShopkeeperChat />
                </div>

                {/* Inventory — hide on mobile if chat tab active */}
                <div className={`${mobileTab === 'chat' ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-[420px] bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-hidden shrink-0`}>
                    <InventoryPanel />
                </div>
            </div>
        </div>
    );
};

const ShopkeeperPage = () => (
    <ChatProvider>
        <ShopkeeperDashboard />
    </ChatProvider>
);

export default ShopkeeperPage;
