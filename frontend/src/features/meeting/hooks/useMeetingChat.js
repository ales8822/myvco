import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast'; // Assuming toast is used, need to check imports in original file
import { useMeetingStore } from '../../../stores/meetingStore';
import { useStaffStore } from '../../../stores/staffStore';

export function useMeetingChat(meetingId, currentMeeting, setImagesRefreshTrigger) {
    const { messages, selectMeeting, addMessage, updateMessage } = useMeetingStore();
    const { staff } = useStaffStore();

    const [inputMessage, setInputMessage] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [thinkingStaff, setThinkingStaff] = useState([]);

    const abortControllerRef = useRef(null);
    const currentStreamingMessageIdRef = useRef(null);

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!inputMessage.trim() || !selectedStaffId) return;

        const userMessage = {
            id: Date.now(),
            meeting_id: parseInt(meetingId),
            sender_type: 'user',
            sender_name: 'User',
            content: inputMessage,
            created_at: new Date().toISOString(),
        };

        addMessage(userMessage);
        setInputMessage('');
        setIsStreaming(true);

        const thinkingMessageId = `thinking-${Date.now()}`;
        currentStreamingMessageIdRef.current = thinkingMessageId;
        const selectedStaff = staff.find((s) => s.id === selectedStaffId);
        const thinkingMessage = {
            id: thinkingMessageId,
            meeting_id: parseInt(meetingId),
            staff_id: selectedStaffId,
            sender_type: 'staff',
            sender_name: selectedStaff?.name || 'Staff',
            content: '',
            isThinking: true,
            created_at: new Date().toISOString(),
        };
        addMessage(thinkingMessage);

        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch(
                `/api/meetings/${meetingId}/messages?staff_id=${selectedStaffId}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: inputMessage, sender_name: 'User' }),
                    signal: abortControllerRef.current.signal,
                }
            );

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamedContent = '';
            let isFirstChunk = true;

            const staffMessage = {
                id: Date.now() + 1,
                meeting_id: parseInt(meetingId),
                staff_id: selectedStaffId,
                sender_type: 'staff',
                sender_name: selectedStaff?.name || 'Staff',
                content: '',
                created_at: new Date().toISOString(),
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                streamedContent += chunk;
                staffMessage.content = streamedContent;

                if (isFirstChunk) {
                    updateMessage({ ...staffMessage, id: thinkingMessageId, isThinking: false });
                    isFirstChunk = false;
                } else {
                    updateMessage({ ...staffMessage, id: thinkingMessageId });
                }
            }
            setIsStreaming(false);
            currentStreamingMessageIdRef.current = null;
            if (setImagesRefreshTrigger) setImagesRefreshTrigger(Date.now());
        } catch (error) {
            if (error.name === 'AbortError') {
                // Remove the partial message from UI
                // const updatedMessages = messages.filter(m => m.id !== thinkingMessageId); // Store update handles this via selectMeeting usually
                // Force re-render by updating the store
                selectMeeting(parseInt(meetingId));
            } else {
                console.error('Error sending message:', error);
            }
            setIsStreaming(false);
            currentStreamingMessageIdRef.current = null;
        }
    };

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };

    const handleResendMessage = async (messageId) => {
        if (!selectedStaffId) {
            toast.error('Please select a staff member');
            return;
        }

        setIsStreaming(true);
        const thinkingMessageId = `thinking-${Date.now()}`;
        currentStreamingMessageIdRef.current = thinkingMessageId;
        const selectedStaff = staff.find((s) => s.id === selectedStaffId);

        const thinkingMessage = {
            id: thinkingMessageId,
            meeting_id: parseInt(meetingId),
            staff_id: selectedStaffId,
            sender_type: 'staff',
            sender_name: selectedStaff?.name || 'Staff',
            content: '',
            isThinking: true,
            created_at: new Date().toISOString(),
        };
        addMessage(thinkingMessage);

        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch(
                `/api/meetings/messages/${messageId}/resend?staff_id=${selectedStaffId}`,
                {
                    method: 'POST',
                    signal: abortControllerRef.current.signal,
                }
            );

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamedContent = '';
            let isFirstChunk = true;

            const staffMessage = {
                id: Date.now() + 1,
                meeting_id: parseInt(meetingId),
                staff_id: selectedStaffId,
                sender_type: 'staff',
                sender_name: selectedStaff?.name || 'Staff',
                content: '',
                created_at: new Date().toISOString(),
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                streamedContent += chunk;
                staffMessage.content = streamedContent;

                if (isFirstChunk) {
                    updateMessage({ ...staffMessage, id: thinkingMessageId, isThinking: false });
                    isFirstChunk = false;
                } else {
                    updateMessage({ ...staffMessage, id: thinkingMessageId });
                }
            }

            // Refresh messages to get the updated list after cascade delete
            await selectMeeting(parseInt(meetingId));
            setIsStreaming(false);
            currentStreamingMessageIdRef.current = null;
            if (setImagesRefreshTrigger) setImagesRefreshTrigger(Date.now());
            toast.success('Message resent successfully');
        } catch (error) {
            if (error.name === 'AbortError') {
                selectMeeting(parseInt(meetingId));
            } else {
                console.error('Error resending message:', error);
                toast.error('Failed to resend message');
            }
            setIsStreaming(false);
            currentStreamingMessageIdRef.current = null;
        }
    };

    const handleAskAll = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            meeting_id: parseInt(meetingId),
            sender_type: 'user',
            sender_name: 'User',
            content: inputMessage,
            created_at: new Date().toISOString(),
        };
        addMessage(userMessage);
        const messageToSend = inputMessage;
        setInputMessage('');
        setIsStreaming(true);

        const participants = staff.filter(s =>
            currentMeeting?.participants?.some(p => p.staff_id === s.id)
        );

        if (participants.length === 0) {
            setIsStreaming(false);
            return;
        }

        setThinkingStaff(participants);

        const fetchStaffResponse = async (member, index) => {
            try {
                const saveUserMsg = index === 0;
                const response = await fetch(
                    `/api/meetings/${meetingId}/messages?staff_id=${member.id}&save_user_message=${saveUserMsg}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: messageToSend, sender_name: 'User' }),
                    }
                );

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let streamedContent = '';
                let isFirstChunk = true;

                const staffMessage = {
                    id: Date.now() + Math.random(),
                    meeting_id: parseInt(meetingId),
                    staff_id: member.id,
                    sender_type: 'staff',
                    sender_name: member.name,
                    content: '',
                    created_at: new Date().toISOString(),
                };

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    streamedContent += chunk;
                    staffMessage.content = streamedContent;

                    if (isFirstChunk) {
                        setThinkingStaff(prev => prev.filter(p => p.id !== member.id));
                        addMessage(staffMessage);
                        isFirstChunk = false;
                    } else {
                        updateMessage({ ...staffMessage });
                    }
                }
            } catch (error) {
                console.error(`Error fetching response for ${member.name}:`, error);
                setThinkingStaff(prev => prev.filter(p => p.id !== member.id));
            }
        };

        await Promise.all(participants.map((member, index) => fetchStaffResponse(member, index)));
        setIsStreaming(false);
        if (setImagesRefreshTrigger) setImagesRefreshTrigger(Date.now());
    };

    return {
        inputMessage,
        setInputMessage,
        selectedStaffId,
        setSelectedStaffId,
        isStreaming,
        thinkingStaff,
        handleSendMessage,
        handleStopGeneration,
        handleResendMessage,
        handleAskAll
    };
}
