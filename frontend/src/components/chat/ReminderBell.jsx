import React, { useState, useEffect } from 'react';
import { Clock, X, Plus, Trash2, Bell, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useChatContext } from '../../context/ChatContext';

const ReminderBell = () => {
    const { t } = useTranslation();
    const { reminders, loadReminders, setReminders } = useChatContext();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ title: '', note: '', dateTime: '' });
    const [adding, setAdding] = useState(false);

    // Poll for due reminders every 60s
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                // We still poll for due ones to show toasts
                const res = await api.get('/reminder/due');
                const due = res.data.due || [];
                due.forEach(r => {
                    toast.custom((t) => (
                        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white/90 backdrop-blur-xl shadow-2xl rounded-[2rem] pointer-events-auto flex ring-1 ring-black/5 p-4 border border-white/50`}>
                            <div className="flex-1 w-0 p-2">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                        <div className="h-10 w-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                            <Bell size={20} />
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-widest">{r.title}</p>
                                        <p className="mt-1 text-sm font-medium text-slate-500 lowercase first-letter:uppercase">{r.note || 'You have a scheduled task'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ), { duration: 8000 });
                });
                if (due.length > 0) loadReminders();
            } catch { /* silent */ }
        }, 60000);
        return () => clearInterval(interval);
    }, [loadReminders]);

    const addReminder = async () => {
        if (!form.title || !form.dateTime) return toast.error('Title and date/time required');
        try {
            await api.post('/reminder', form);
            toast.success('Reminder set!');
            setForm({ title: '', note: '', dateTime: '' });
            setAdding(false);
            await loadReminders();
        } catch { toast.error('Failed to set reminder'); }
    };

    const deleteReminder = async (id) => {
        try {
            await api.delete(`/reminder/${id}`);
            await loadReminders();
        } catch { toast.error('Failed to delete'); }
    };

    const completeReminder = async (id) => {
        try {
            await api.put(`/reminder/${id}`, { status: "completed" });
            setReminders(prev => prev.map(r => r.id === id ? { ...r, status: "completed" } : r));
            toast.success('Task Marked Done!');
        } catch { toast.error('Failed to complete task'); }
    };

    const pendingReminders = reminders.filter(r => r.status === "pending");
    const dueCount = pendingReminders.length;

    return (
        <div className="relative">
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(!open)} 
                className={`relative p-3 rounded-2xl transition-all ${open ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' : 'bg-white/80 border border-slate-100 text-slate-400 hover:text-amber-600 shadow-sm'}`}
            >
                <Clock size={20} strokeWidth={2.5} />
                <AnimatePresence>
                    {dueCount > 0 && (
                        <motion.span 
                            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-white text-[10px] flex items-center justify-center font-black border-2 border-white shadow-lg shadow-rose-500/20"
                        >
                            {dueCount > 9 ? '9+' : dueCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 top-16 w-80 glass rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border-white/60 z-50 overflow-hidden translate-y-2 pointer-events-auto"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-white/20">
                            <div>
                                <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs">
                                     Reminders
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">{dueCount} active tasks</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setAdding(!adding)} className="w-9 h-9 flex items-center justify-center bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-md">
                                    <Plus size={16} strokeWidth={3} />
                                </button>
                                <button onClick={() => setOpen(false)} className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-slate-200 rounded-xl transition-all">
                                    <X size={16} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        {/* Add Form */}
                        <AnimatePresence>
                            {adding && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white/40">
                                    <div className="p-6 space-y-4">
                                        <div className="space-y-3">
                                            <input
                                                className="w-full text-xs font-bold border-0 bg-white/80 rounded-2xl px-4 py-3 placeholder:text-slate-300 focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                                placeholder={t('reminderTitle')}
                                                value={form.title}
                                                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                            />
                                            <input
                                                className="w-full text-xs font-bold border-0 bg-white/80 rounded-2xl px-4 py-3 placeholder:text-slate-300 focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                                placeholder={t('reminderNote')}
                                                value={form.note}
                                                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                                            />
                                            <input
                                                type="datetime-local"
                                                className="w-full text-xs font-bold border-0 bg-white/80 rounded-2xl px-4 py-3 text-slate-600 focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                                value={form.dateTime}
                                                onChange={e => setForm(p => ({ ...p, dateTime: e.target.value }))}
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={addReminder} className="flex-1 py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                                                {t('save')}
                                            </button>
                                            <button onClick={() => setAdding(false)} className="flex-1 py-3.5 bg-white/80 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all border border-slate-100 shadow-sm">
                                                {t('cancel')}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* List */}
                        <div className="max-h-72 overflow-y-auto custom-scrollbar">
                            {pendingReminders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-200 mb-4"><Clock size={32} /></div>
                                    <p className="text-slate-400 text-xs font-bold tracking-tight">No reminders</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/20">
                                    {pendingReminders.map((r, i) => (
                                        <motion.div 
                                            key={r.id} 
                                            initial={{ x: 20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-start gap-4 p-5 hover:bg-white/40 transition-all group relative"
                                        >
                                            <div className="w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center text-amber-500 shadow-sm shrink-0 mt-0.5 border border-white">
                                                <Clock size={18} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-800 truncate tracking-tight">
                                                    {r.text || r.note || r.title}
                                                </p>
                                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.1em] mt-2 bg-amber-50/50 w-fit px-2 py-0.5 rounded-full border border-amber-100">
                                                    {new Date(r.time || r.dateTime).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                                                </p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-2">
                                                <button onClick={() => completeReminder(r.id)} className="w-8 h-8 flex items-center justify-center text-emerald-400 hover:text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all shadow-sm">
                                                    <CheckCircle size={14} />
                                                </button>
                                                <button onClick={() => deleteReminder(r.id)} className="w-8 h-8 flex items-center justify-center text-rose-300 hover:text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all shadow-sm">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReminderBell;
