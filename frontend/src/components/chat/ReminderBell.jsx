import React, { useState, useEffect } from 'react';
import { Bell, X, Plus, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ReminderBell = () => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [reminders, setReminders] = useState([]);
    const [form, setForm] = useState({ title: '', note: '', dateTime: '' });
    const [adding, setAdding] = useState(false);

    const loadReminders = async () => {
        try {
            const res = await api.get('/reminder');
            setReminders(res.data.reminders || []);
        } catch { /* silent */ }
    };

    // Poll for due reminders every 60s
    useEffect(() => {
        loadReminders();
        const interval = setInterval(async () => {
            try {
                const res = await api.get('/reminder/due');
                const due = res.data.due || [];
                due.forEach(r => {
                    toast(`⏰ ${r.title}${r.note ? ': ' + r.note : ''}`, { duration: 8000, icon: '🔔' });
                });
                if (due.length > 0) loadReminders();
            } catch { /* silent */ }
        }, 60000);
        return () => clearInterval(interval);
    }, []);

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
            setReminders(prev => prev.filter(r => r.id !== id));
        } catch { toast.error('Failed to delete'); }
    };

    const dueCount = reminders.filter(r => !r.sent).length;

    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)} className="relative p-2 text-slate-500 hover:text-agri-600 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell size={20} />
                {dueCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                        {dueCount > 9 ? '9+' : dueCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Bell size={16} className="text-agri-500" /> {t('reminders')}
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={() => setAdding(!adding)} className="p-1.5 bg-agri-50 text-agri-600 rounded-lg hover:bg-agri-100 transition-colors">
                                    <Plus size={14} />
                                </button>
                                <button onClick={() => setOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Add Form */}
                        <AnimatePresence>
                            {adding && (
                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                    <div className="p-4 bg-agri-50 border-b border-agri-100 space-y-2">
                                        <input
                                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-agri-300"
                                            placeholder={t('reminderTitle')}
                                            value={form.title}
                                            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                        />
                                        <input
                                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-agri-300"
                                            placeholder={t('reminderNote')}
                                            value={form.note}
                                            onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                                        />
                                        <input
                                            type="datetime-local"
                                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-agri-300"
                                            value={form.dateTime}
                                            onChange={e => setForm(p => ({ ...p, dateTime: e.target.value }))}
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={addReminder} className="flex-1 py-2 bg-agri-500 text-white text-sm rounded-lg hover:bg-agri-600 font-semibold transition-colors">
                                                {t('save')}
                                            </button>
                                            <button onClick={() => setAdding(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
                                                {t('cancel')}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* List */}
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                            {reminders.length === 0 && (
                                <p className="text-center text-sm text-slate-400 py-6">No reminders yet</p>
                            )}
                            {reminders.map(r => (
                                <div key={r.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 group">
                                    <Clock size={14} className="text-agri-400 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-700 truncate">{r.title}</p>
                                        {r.note && <p className="text-xs text-slate-400 truncate">{r.note}</p>}
                                        <p className="text-xs text-agri-500 mt-0.5">{new Date(r.dateTime).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => deleteReminder(r.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReminderBell;
