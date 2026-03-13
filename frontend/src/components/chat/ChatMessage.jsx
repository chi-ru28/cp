import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle, AlertTriangle, MapPin, Leaf, Package, FileText, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Try to parse structured report from AI reply (either JSON or Plain Text)
const parseReport = (text) => {
    // 1. Try JSON first
    try {
        const match = text.match(/```json\s*([\s\S]*?)```/);
        if (match) {
            const parsed = JSON.parse(match[1]);
            if (parsed.type === 'report') return parsed;
        }
    } catch { /* not JSON */ }

    // 2. Try Plain Text Structured Format (Diagnosis:, etc.)
    if (text.includes('Diagnosis:')) {
        const sections = ['Diagnosis', 'Recommended Fertilizer', 'Organic Alternative', 'Chemical Solution', 'Precaution Warnings', 'Reference Links'];
        const report = {};
        sections.forEach(s => {
            const regex = new RegExp(`${s}:\\s*([\\s\\S]*?)(?=\\n\\w+:|$)`, 'i');
            const m = text.match(regex);
            if (m) report[s.toLowerCase().replace(/ /g, '_')] = m[1].trim();
        });
        if (Object.keys(report).length > 0) return report;
    }
    return null;
};

const severityColor = { Low: 'text-green-600 bg-green-50', Medium: 'text-yellow-600 bg-yellow-50', High: 'text-red-600 bg-red-50' };

export const ReportCard = ({ report }) => {
    const { t } = useTranslation();
    return (
        <div id="agri-report-card" className="space-y-4 text-sm mt-2">
            {/* Diagnosis */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-blue-800 mb-2">
                    <CheckCircle size={18} className="text-blue-600" /> Diagnosis
                </div>
                <p className="text-blue-700 leading-relaxed">{report.diagnosis}</p>
            </div>

            {/* Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-emerald-800 mb-2">
                        <Leaf size={18} className="text-emerald-600" /> {t('organicAlternative') || 'Organic Alternative'}
                    </div>
                    <p className="text-emerald-700">{report.organic_alternative || report.recommendation}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-amber-800 mb-2">
                        <Package size={18} className="text-amber-600" /> {t('chemicalSolution') || 'Chemical Solution'}
                    </div>
                    <p className="text-amber-700">{report.chemical_solution || 'Not provided'}</p>
                </div>
            </div>

            {/* Warnings */}
            {report.precaution_warnings && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-rose-700 mb-2">
                        <AlertTriangle size={18} className="text-rose-600" /> {t('precautionWarnings') || 'Safety Warnings'}
                    </div>
                    <p className="text-rose-600 italic">{report.precaution_warnings}</p>
                </div>
            )}

            {/* Links */}
            {report.reference_links && (
                <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <FileText size={12} /> References:
                    </span>
                    <p className="text-xs text-blue-500 underline cursor-pointer truncate max-w-xs">{report.reference_links}</p>
                </div>
            )}
        </div>
    );
};

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
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
            <div className={`max-w-[88%] md:max-w-[78%] rounded-3xl p-4 shadow-sm relative ${
                isUser
                    ? 'bg-gradient-to-br from-agri-500 to-agri-600 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-md'
            }`}>
                {/* Image preview */}
                {msg.imagePreview && (
                    <img src={msg.imagePreview} alt="uploaded" className="w-48 h-36 object-cover rounded-xl mb-2 border" />
                )}

                {/* Content */}
                {report ? (
                    <ReportCard report={report} />
                ) : (
                    <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate'}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                )}

                {/* Action buttons for AI messages */}
                {!isUser && (
                    <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? t('copied') : t('copyMessage')}
                        </button>
                        {onSpeak && (
                            <button onClick={() => onSpeak(msg.text)} className="text-xs text-slate-400 hover:text-slate-600">
                                🔊 Speak
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
