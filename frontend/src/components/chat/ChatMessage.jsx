import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { 
    CheckCircle, AlertTriangle, MapPin, Leaf, Package, FileText, 
    Copy, Check, Volume2, Info, Database, CloudSun, Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Utility for parsing report from text if not structured
const parseReport = (text) => {
    try {
        const match = text.match(/```json\s*([\s\S]*?)```/);
        if (match) {
            const parsed = JSON.parse(match[1]);
            if (parsed.type === 'report') return parsed;
        }
    } catch { /* not JSON */ }

    if (text.includes('Diagnosis:')) {
        const sections = ['Diagnosis', 'Recommended Fertilizer', 'Organic Alternative', 'Chemical Solution', 'Precaution Warnings'];
        const report = {};
        sections.forEach(s => {
            const regex = new RegExp(`${s}:\\s*([\\s\\S]*?)(?=\\n\\w+:|$)`, 'i');
            const m = text.match(regex);
            if (m) report[s.toLowerCase().replace(/ /g, '_')] = m[1].trim();
        });
        return Object.keys(report).length > 0 ? report : null;
    }
    return null;
};

const SourceBadge = ({ source }) => {
    const configs = {
        logic: { icon: Zap, label: 'Logic', color: 'text-amber-600 bg-amber-50 border-amber-100' },
        db: { icon: Database, label: 'Database', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
        api: { icon: CloudSun, label: 'Live API', color: 'text-sky-600 bg-sky-50 border-sky-100' },
        system: { icon: Info, label: 'System', color: 'text-slate-600 bg-slate-50 border-slate-100' }
    };
    const config = configs[source] || configs.system;
    const Icon = config.icon;

    return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${config.color} shadow-sm-light mb-2 w-fit`}>
            <Icon size={10} /> {config.label}
        </div>
    );
};

export const AnalysisResultCard = ({ result }) => (
    <div className="space-y-4 text-sm mt-3 animate-fade-in">
        <div className="p-5 glass-card rounded-2xl border-indigo-100/50 bg-gradient-to-br from-indigo-50/50 to-white/50">
            <div className="flex items-center gap-2 font-bold text-indigo-800 mb-2 font-display">
                <CheckCircle size={20} className="text-indigo-600" /> Detected Disease
            </div>
            <p className="text-xl font-extrabold text-indigo-950 tracking-tight">{result.disease}</p>
            <div className="mt-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Symptoms Observed</span>
                <p className="text-indigo-800/80 italic text-sm leading-relaxed">{result.symptoms}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 glass-card border-emerald-100/50 bg-emerald-50/30 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-emerald-800 mb-3 font-display">
                    <Leaf size={18} className="text-emerald-600" /> Organic Path
                </div>
                <p className="text-emerald-900 leading-relaxed font-medium">{result.organic}</p>
                <div className="mt-4 p-3 bg-white/60 rounded-xl text-xs text-emerald-700 border border-emerald-100/50 flex gap-2">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>{result.solution}</span>
                </div>
            </div>
            <div className="p-5 glass-card border-amber-100/50 bg-amber-50/30 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-amber-800 mb-3 font-display">
                    <Package size={18} className="text-amber-600" /> Professional Treatment
                </div>
                <div className="space-y-3">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-amber-500/70">Fertilizer</span>
                        <p className="text-amber-900 font-medium">{result.fertilizer}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-amber-500/70">Pesticide</span>
                        <p className="text-amber-900 font-medium">{result.pesticide}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-4 bg-rose-50/50 border border-rose-100/80 rounded-2xl flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle size={20} />
            </div>
            <div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-0.5">Critical Precautions</span>
                <p className="text-rose-700 font-semibold leading-snug">{result.warning}</p>
            </div>
        </div>
    </div>
);

export const ReportCard = ({ report }) => (
    <div className="space-y-4 text-sm mt-3 animate-fade-in">
        <div className="p-5 glass-card border-blue-100/50 bg-gradient-to-r from-blue-50/40 to-white/40 rounded-2xl">
            <div className="flex items-center gap-2 font-bold text-blue-900 mb-2 font-display uppercase tracking-wider text-xs">
                <CheckCircle size={16} className="text-blue-500" /> Intelligent Diagnosis
            </div>
            <p className="text-blue-950 font-medium leading-relaxed">{report.diagnosis}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 glass-card border-emerald-100/50 bg-emerald-50/20 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-emerald-800 mb-2 font-display uppercase tracking-wider text-xs">
                    <Leaf size={16} className="text-emerald-500" /> Organic Info
                </div>
                <p className="text-emerald-900 font-medium">{report.organic_alternative || report.recommendation}</p>
            </div>
            <div className="p-5 glass-card border-amber-100/50 bg-amber-50/20 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-amber-800 mb-2 font-display uppercase tracking-wider text-xs">
                    <Package size={16} className="text-amber-500" /> Chemical Path
                </div>
                <p className="text-amber-900 font-medium">{report.chemical_solution || 'N/A'}</p>
            </div>
        </div>

        {report.precaution_warnings && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex gap-3 italic text-slate-600">
                <AlertTriangle size={18} className="shrink-0 text-amber-500" />
                <span>{report.precaution_warnings}</span>
            </div>
        )}
    </div>
);

const ChatMessage = ({ msg, onSpeak }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const isUser = msg.sender === 'user';
    const report = !isUser ? parseReport(msg.text) : null;

    const handleCopy = () => {
        navigator.clipboard.writeText(msg.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, cubicBezier: [0.16, 1, 0.3, 1] }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} group mb-4`}
        >
            <div className={`max-w-[85%] md:max-w-[70%] mb-4 rounded-[2rem] p-5 relative shadow-sm ${
                isUser
                    ? 'bg-gradient-to-br from-agri-500 to-agri-600 text-white rounded-tr-[4px] shadow-lg shadow-agri-500/10'
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-[4px] shadow-premium'
            }`}>
                {!isUser && msg.source && <SourceBadge source={msg.source} />}

                {msg.imagePreview && (
                    <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition-all group-hover:shadow-md">
                        <img src={msg.imagePreview} alt="uploaded" className="w-full h-auto max-h-64 object-cover" />
                    </div>
                )}

                <div className="relative">
                    {msg.analysisResult ? (
                        <AnalysisResultCard result={msg.analysisResult} />
                    ) : report ? (
                        <ReportCard report={report} />
                    ) : (
                        <div className={`prose prose-sm max-w-none leading-relaxed ${isUser ? 'prose-invert font-medium' : 'prose-slate'}`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                        </div>
                    )}
                    
                    {msg.intent === 'tools' && msg.images && msg.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            {msg.images.map((img, i) => (
                                <img
                                    key={i}
                                    src={typeof img === 'string' ? img : img.url}
                                    alt={typeof img === 'string' ? 'tool' : img.title || 'tool'}
                                    onError={(e) => { e.target.src = "https://picsum.photos/seed/agriculture/400/400"; }}
                                    className="w-full max-w-full aspect-square object-cover rounded-xl shadow-lg border tool-image"
                                />
                            ))}
                        </div>
                    )}
                </div>

                {!isUser && (
                    <div className="flex gap-4 mt-4 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 text-[11px] font-bold uppercase tracking-wider">
                        <button onClick={handleCopy} className="flex items-center gap-1.5 text-slate-400 hover:text-agri-600 transition-colors">
                            {copied ? <Check size={13} className="text-agri-500" /> : <Copy size={13} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                        {onSpeak && (
                            <button onClick={() => onSpeak(msg.text)} className="flex items-center gap-1.5 text-slate-400 hover:text-agri-600 transition-colors">
                                <Volume2 size={13} /> Speak
                            </button>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ChatMessage;
