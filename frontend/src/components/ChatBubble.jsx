import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatBubble({ message }) {
    const isUser = message.sender_type === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">
                    {message.sender_name.charAt(0).toUpperCase()}
                </div>
            )}
            
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                isUser 
                    ? 'bg-primary-600 text-white rounded-tr-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
            }`}>
                <div className="text-xs opacity-70 mb-1 flex justify-between gap-4">
                    <span className="font-medium">{message.sender_name}</span>
                    <span>
                        {new Date(message.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                    </span>
                </div>

                {/* Image Attachment */}
                {message.image_url && (
                    <div className="mb-3 mt-1">
                        <img 
                            src={`http://localhost:8000${message.image_url}`} 
                            alt="Uploaded content" 
                            className="rounded-lg max-h-64 object-cover border border-gray-200/50"
                        />
                    </div>
                )}

                {/* Markdown Content */}
                <div className={`markdown-content ${isUser ? 'text-white' : 'text-gray-800'}`}>
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            // Custom styling for markdown elements within the chat bubble
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-3" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1 mt-2" {...props} />,
                            blockquote: ({node, ...props}) => (
                                <blockquote className={`border-l-4 pl-3 italic my-2 ${isUser ? 'border-white/50' : 'border-gray-300 text-gray-600'}`} {...props} />
                            ),
                            code: ({node, inline, className, children, ...props}) => {
                                if (inline) {
                                    return <code className={`px-1 py-0.5 rounded text-sm ${isUser ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-800'}`} {...props}>{children}</code>
                                }
                                return (
                                    <div className="overflow-x-auto my-2 rounded-md">
                                        <code className="block bg-gray-900 text-gray-100 p-3 text-sm font-mono" {...props}>
                                            {children}
                                        </code>
                                    </div>
                                )
                            },
                            table: ({node, ...props}) => (
                                <div className="overflow-x-auto my-2 border rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-300 text-sm" {...props} />
                                </div>
                            ),
                            th: ({node, ...props}) => <th className={`px-3 py-2 text-left font-semibold ${isUser ? 'bg-primary-700' : 'bg-gray-100'}`} {...props} />,
                            td: ({node, ...props}) => <td className={`px-3 py-2 border-t ${isUser ? 'border-primary-500' : 'border-gray-200'}`} {...props} />,
                            a: ({node, ...props}) => <a className="underline decoration-1 underline-offset-2 hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />,
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}