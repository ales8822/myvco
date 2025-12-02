import { useEffect, useRef } from 'react';

export function useMeetingScroll(messages, thinkingStaff) {
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const lastMessage = messages[messages.length - 1];
        const isUserMessage = lastMessage?.sender_type === 'user';

        const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        const wasAtBottom = distanceToBottom < 200;

        if (isUserMessage || wasAtBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, thinkingStaff.length]);

    return { messagesEndRef, chatContainerRef };
}
