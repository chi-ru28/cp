import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle, AlertTriangle, MapPin, Leaf, Package, FileText, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Try to parse structured JSON report from AI reply
const parseReport = (text) => {
    try {
        const match = text.match(/```json\s*([\s\S]*?)```/);
        if (match) {
            const parsed = JSON.parse(match[1]);
            if (parsed.type === 'report') return parsed;
        }
    } catch { /* not JSON */ }
    return null;
};

const severityColor = { Low: 'text-green-600 bg-green-50', Medium: 'text-yellow-600 bg-yellow-50', High: 'text-red-600 bg-red-50' };

export const ReportCard = ({ report }) => {
    const { t } = useTranslation();
    return (
        <div id="agri-report-card" className="space-y-3 text-sm">
            {/* Diagnosis */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 font-semibold text-blue-800 mb-1">
                    <CheckCircle size={16} /> Diagnosis
                </div>
                <p className="text-blue-700">{report.diagnosis}</p>
                {report.severity && (
                    <span className={`mt-2 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${severityColor[report.severity] || 'text-slate-600 bg-slate-100'}`}>
                        Severity: {report.severity}
                    </span>
                )}
            </div>

            {/* Recommendation + Dosage */}
            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 font-semibold text-green-800 mb-1">
                    <Leaf size={16} /> Recommendation & Dosage
                </div>
                <p className="text-green-700">{report.recommendation}</p>
                {report.dosage && <p className="text-green-600 mt-1 text-xs">📏 {report.dosage}</p>}
            </div>

            {/* Alternatives */}
            {report.alternatives?.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2 font-semibold text-amber-800 mb-1">
                        <Package size={16} /> Alternatives
                    </div>
                    <ul className="list-disc list-inside text-amber-700 space-y-0.5">
                        {report.alternatives.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                </div>
            )}

            {/* Purchase Locations */}
            {report.purchaseLocations?.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 font-semibold text-purple-800 mb-1">
                        <MapPin size={16} /> Where to Buy
                    </div>
                    <ul className="list-disc list-inside text-purple-700 space-y-0.5">
                        {report.purchaseLocations.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                </div>
            )}

            {/* Warning */}
            {report.warning && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center gap-2 font-semibold text-red-700 mb-1">
                        <AlertTriangle size={16} /> Warning
                    </div>
                    <p className="text-red-600">{report.warning}</p>
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
