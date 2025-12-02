// frontend\src\components\ChatBubble.jsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Pencil, Check, X, ClipboardCheck } from 'lucide-react';
import { useState } from 'react';
import { useMeetingStore } from '../stores/meetingStore';
import toast from 'react-hot-toast';

export default function ChatBubble({ message, participantInfo }) {
    const isUser = message.sender_type === 'user';
    const { editMessage } = useMeetingStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [isHovered, setIsHovered] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        toast.success('Message copied');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveEdit = async () => {
        if (editContent.trim() === message.content) {
            setIsEditing(false);
            return;
        }
        try {
            await editMessage(message.id, editContent);
            setIsEditing(false);
            toast.success('Message updated');
        } catch (error) {
            toast.error('Failed to update message');
        }
    };

    const CodeBlock = ({ node, inline, className, children, ...props }) => {
        const [codeCopied, setCodeCopied] = useState(false);
        const codeContent = String(children).replace(/\n$/, '');

        const handleCodeCopy = () => {
            navigator.clipboard.writeText(codeContent);
            setCodeCopied(true);
            toast.success('Code copied');
            setTimeout(() => setCodeCopied(false), 2000);
        };

        if (inline) {
            return <code className={`px-1.5 py-0.5 rounded text-sm font-mono ${isUser ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-800 border border-gray-200'}`} {...props}>{children}</code>
        }
        return (
            <div className="overflow-hidden my-3 rounded-lg border border-gray-700 shadow-sm relative group">
                <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-mono">code</span>
                        <button
                            onClick={handleCodeCopy}
                            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
                            title="Copy code"
                        >
                            {codeCopied ? <ClipboardCheck size={14} /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto bg-[#1e1e1e]">
                    <code className="block text-gray-100 p-4 text-sm font-mono leading-relaxed" {...props}>
                        {children}
                    </code>
                </div>
            </div>
        )
    };

    return (
        <div
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} group/bubble`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">
                    {message.sender_name.charAt(0).toUpperCase()}
                </div>
            )}

            <div className={`max-w-[80%] rounded-2xl px-4 py-3 relative ${isUser
                ? 'bg-primary-600 text-white rounded-tr-none'
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                }`}>

                {/* Header */}
                <div className="text-xs opacity-70 mb-1 flex justify-between gap-4 items-center">
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{message.sender_name}</span>
                        {participantInfo && (
                            <span className="text-xs opacity-60">
                                {participantInfo.department_name && `📂 ${participantInfo.department_name} • `}
                                {participantInfo.llm_provider === 'ollama' && participantInfo.llm_model
                                    ? `🤖 ${participantInfo.llm_model}`
                                    : `🤖 ${participantInfo.llm_provider}`
                                }
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span>
                            {new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                        {/* Action Buttons */}
                        {(isHovered || isEditing) && (
                            <div className={`flex gap-1 ${isUser ? 'text-white/80' : 'text-gray-500'}`}>
                                <button
                                    onClick={handleCopy}
                                    className="p-1 hover:bg-black/10 rounded transition-colors"
                                    title="Copy message"
                                >
                                    {copied ? <ClipboardCheck size={14} /> : <Copy size={14} />}
                                </button>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="p-1 hover:bg-black/10 rounded transition-colors"
                                    title="Edit message"
                                >
                                    <Pencil size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Image Attachment */}
                {message.image_url && (
                    <div className="mb-3 mt-1">
                        <img
                            src={`http://localhost:8001${message.image_url}`}
                            alt="Uploaded content"
                            className="rounded-lg max-h-64 object-cover border border-gray-200/50"
                        />
                    </div>
                )}

                {/* Content */}
                {isEditing ? (
                    <div className="mt-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className={`w-full p-2 rounded text-sm ${isUser ? 'bg-primary-700 text-white placeholder-white/50' : 'bg-gray-50 text-gray-900 border border-gray-200'} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500`}
                            rows={Math.max(3, editContent.split('\n').length)}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditContent(message.content);
                                }}
                                className="p-1 rounded hover:bg-black/10 transition-colors"
                                title="Cancel"
                            >
                                <X size={16} />
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="p-1 rounded hover:bg-black/10 transition-colors"
                                title="Save"
                            >
                                <Check size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={`markdown-content ${isUser ? 'text-white' : 'text-gray-800'}`}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
                                li: ({ node, ...props }) => <li className="" {...props} />,
                                h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2 mt-3" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-1 mt-2" {...props} />,
                                blockquote: ({ node, ...props }) => (
                                    <blockquote className={`border-l-4 pl-3 italic my-2 ${isUser ? 'border-white/50' : 'border-gray-300 text-gray-600'}`} {...props} />
                                ),
                                code: CodeBlock,
                                table: ({ node, ...props }) => (
                                    <div className="overflow-x-auto my-2 border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-300 text-sm" {...props} />
                                    </div>
                                ),
                                th: ({ node, ...props }) => <th className={`px-3 py-2 text-left font-semibold ${isUser ? 'bg-primary-700' : 'bg-gray-100'}`} {...props} />,
                                td: ({ node, ...props }) => <td className={`px-3 py-2 border-t ${isUser ? 'border-primary-500' : 'border-gray-200'}`} {...props} />,
                                a: ({ node, ...props }) => <a className="underline decoration-1 underline-offset-2 hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />,
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
