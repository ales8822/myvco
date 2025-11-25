import React from 'react';

export default function ChatBubble({ message }) {
    const isUser = message.sender_type === 'user';

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
            <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm mt-1
                    ${isUser
                        ? 'bg-primary-600 text-white'
                        : 'bg-gradient-to-br from-white to-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                    {message.sender_name.charAt(0).toUpperCase()}
                </div>

                {/* Bubble Container */}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Header */}
                    <div className={`flex items-baseline gap-2 mb-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-xs font-semibold text-gray-700">
                            {message.sender_name}
                        </span>
                        <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {/* Bubble */}
                    <div className={`relative px-4 py-3 rounded-2xl shadow-sm
                        ${isUser
                            ? 'bg-primary-600 text-white rounded-tr-sm'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                        }`}>
                        {message.image_url && (
                            <div className="mb-3 overflow-hidden rounded-lg bg-black/5">
                                <img
                                    src={`http://localhost:8000${message.image_url}`}
                                    alt="Uploaded content"
                                    className="max-w-full h-auto object-cover"
                                    loading="lazy"
                                />
                            </div>
                        )}
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
