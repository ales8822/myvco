import React, { useState, useEffect } from 'react';
import { X, Send, Eye, Cpu, CheckSquare, Square as SquareIcon, Settings2 } from 'lucide-react';
import { estimateTokenCount } from '../utils/tokenUtils';
import { meetingsApi } from '../../../lib/api';

export default function PromptPreviewModal({
    isOpen,
    onClose,
    previewData,
    onSend,
    isStreaming,
    meetingId,
    staffId
}) {
    const [blocks, setBlocks] = useState([]);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [userContent, setUserContent] = useState('');
    const [maxTokens, setMaxTokens] = useState(8192);
    const [llmInfo, setLlmInfo] = useState('');
    const [imageUrls, setImageUrls] = useState([]);

    useEffect(() => {
        if (previewData) {
            setBlocks(previewData.context_blocks || []);
            setSystemPrompt(previewData.system_prompt || '');
            setUserContent(previewData.user_content || '');
            setMaxTokens(previewData.max_tokens || 8192);
            setLlmInfo(`${previewData.llm_provider || 'gemini'} / ${previewData.llm_model || 'default'}`);
            setImageUrls(previewData.image_urls || []);
        }
    }, [previewData]);

    const toggleBlock = (id) => {
        const newBlocks = blocks.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b);
        setBlocks(newBlocks);
        
        // Re-construct system prompt string based on toggles
        const enabledParts = newBlocks.filter(b => b.enabled).map(b => b.content);
        enabledParts.push("\nRespond naturally as this character.");
        setSystemPrompt(enabledParts.join('\n'));
    };

    const systemTokens = estimateTokenCount(systemPrompt);
    const userTokens = estimateTokenCount(userContent);
    const imageTokens = estimateTokenCount('', imageUrls);
    const totalTokens = systemTokens + userTokens + imageTokens;
    const isOverLimit = totalTokens > maxTokens;
    
    // Calculate percentage for progress bar (cap at 100%)
    const percentage = Math.min(100, (totalTokens / maxTokens) * 100);
    
    // Choose color based on usage
    let progressColor = "bg-green-500";
    if (isOverLimit) progressColor = "bg-red-500";
    else if (percentage > 80) progressColor = "bg-amber-500";

    if (!isOpen) return null;

    const handleSend = async () => {
        // Persist settings to backend
        try {
            const context_settings = {};
            blocks.forEach(b => {
                context_settings[b.id] = b.enabled;
            });
            await meetingsApi.updateContextSettings(meetingId, staffId, { context_settings });
        } catch (e) {
            console.error("Failed to persist context settings", e);
        }

        onSend({
            systemPrompt,
            userContent
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
                {/* Header Section with Token Bar */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <Eye size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Prompt Preview</h2>
                            {llmInfo && (
                                <span className="ml-2 text-xs font-medium text-gray-500 px-2 py-1 bg-gray-100 rounded border border-gray-200 flex items-center gap-1">
                                    <Cpu size={12} /> {llmInfo}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Token Usage Bar */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-gray-600 uppercase tracking-wider">Token Usage Estimation</span>
                            <span className={`${isOverLimit ? 'text-red-600' : 'text-gray-900'} font-mono`}>
                                {totalTokens.toLocaleString()} <span className="text-gray-400">/ {maxTokens.toLocaleString()} Max</span>
                            </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                            <div 
                                className={`h-full transition-all duration-300 ${progressColor}`} 
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        {isOverLimit && (
                            <p className="text-xs text-red-600 font-medium">⚠️ Warning: Complete prompt exceeds the model's context window. It may fail to send.</p>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Image Attachments Section */}
                    {imageUrls.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Attached Assets</label>
                                <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded font-mono">+{imageTokens} TOKENS</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {imageUrls.map((url, index) => (
                                    <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                                        <img 
                                            src={url} 
                                            alt={`Attachment ${index + 1}`} 
                                            className="h-24 w-24 object-cover hover:scale-105 transition-transform duration-300"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/96?text=Asset'; }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Context Block Toggles */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            <Settings2 size={16} />
                            <span>Context Block Toggles</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {blocks.map(block => (
                                <button
                                    key={block.id}
                                    onClick={() => toggleBlock(block.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                        block.enabled 
                                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                        : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60'
                                    }`}
                                >
                                    {block.enabled ? <CheckSquare size={18} /> : <SquareIcon size={18} />}
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-bold leading-tight">{block.label}</div>
                                        <div className="text-[10px] uppercase font-mono mt-0.5">
                                            {estimateTokenCount(block.content)} tokens
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* System Prompt Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Final System Prompt (Full Output)</label>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">EDITABLE</span>
                        </div>
                        <textarea
                            className="w-full h-60 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm resize-none"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="Constructed system prompt will appear here..."
                        />
                    </div>

                    {/* User Content Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">User Message</label>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">EDITABLE</span>
                        </div>
                        <textarea
                            className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm resize-none"
                            value={userContent}
                            onChange={(e) => setUserContent(e.target.value)}
                            placeholder="User message will appear here..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isStreaming}
                        className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                    >
                        <Send size={18} />
                        Send Prompt Now
                    </button>
                </div>
            </div>
        </div>
    );
}
