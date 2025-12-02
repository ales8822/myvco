import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatBubble from '../../../components/ChatBubble';

export default function MeetingChatList({
    messages,
    currentMeeting,
    thinkingStaff,
    handleResendMessage,
    messagesEndRef,
    chatContainerRef
}) {
    return (
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {currentMeeting?.status === 'ended' && currentMeeting?.summary && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2"><span>📝</span> Meeting Summary</h3>
                    <div className="prose prose-sm max-w-none text-gray-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ul: ({ node, ...props }) => <ul className="list-disc ml-4" {...props} />, ol: ({ node, ...props }) => <ol className="list-decimal ml-4" {...props} />, h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-2" {...props} />, h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-2" {...props} /> }}>{currentMeeting.summary}</ReactMarkdown>
                    </div>
                </div>
            )}
            {messages.map((message, idx) => {
                const participantInfo = currentMeeting?.participants?.find(
                    p => p.staff_id === message.staff_id
                );
                return (
                    <ChatBubble
                        key={`${message.id}-${idx}`}
                        message={message}
                        participantInfo={participantInfo}
                        onResend={handleResendMessage}
                    />
                );
            })}

            {thinkingStaff.map((member) => (
                <div key={`thinking-${member.id}`} className="flex justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="max-w-[80%] bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                        <div className="text-xs opacity-70 mb-1">
                            <span className="font-medium">{member.name}</span> is thinking...
                        </div>
                        <div className="flex gap-1 mt-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}
