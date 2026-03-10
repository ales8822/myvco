import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChatBubble from "../../../components/ChatBubble";

export default function MeetingChatList({
  messages,
  currentMeeting,
  thinkingStaff,
  handleResendMessage,
  messagesEndRef,
  chatContainerRef,
}) {
  return (
    <div
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto p-6 space-y-4"
    >
      {currentMeeting?.status === "ended" && currentMeeting?.summary && (
        <div className="bg-indigo-50/50 dark:bg-neutral-900 border-l-4 border-indigo-500 rounded-r-xl rounded-l-sm p-6 mb-8 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-400 mb-4 flex items-center gap-2">
            <span className="text-xl">📝</span> Meeting Summary Report
          </h3>
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-neutral-300">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                ul: ({ node, ...props }) => (
                  <ul className="list-disc ml-6 space-y-1" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal ml-6 space-y-1" {...props} />
                ),
                h1: ({ node, ...props }) => (
                  <h1
                    className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-white"
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="text-base font-bold mt-4 mb-2 text-gray-900 dark:text-white"
                    {...props}
                  />
                ),
              }}
            >
              {currentMeeting.summary}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {messages.map((message, idx) => {
        const participantInfo = currentMeeting?.participants?.find(
          (p) => p.staff_id === message.staff_id,
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
        <div
          key={`thinking-${member.id}`}
          className="flex justify-start items-start animate-in fade-in slide-in-from-left-2 duration-300"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0 shadow-sm">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div className="max-w-[80%] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
            <div className="text-xs text-gray-500 dark:text-neutral-500 mb-1.5 flex items-center gap-2">
              <span className="font-semibold text-gray-700 dark:text-neutral-300">
                {member.name}
              </span>{" "}
              is thinking...
            </div>
            <div className="flex gap-1.5 h-2 items-center mt-2">
              <span className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full animate-bounce"></span>
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
