import { useState, useRef } from "react";
import { useMeetingStore } from "../../../stores/meetingStore";
import { useStaffStore } from "../../../stores/staffStore";

export function useStreamingChat(meetingId, setImagesRefreshTrigger) {
    const { addMessage, updateMessage, selectMeeting } = useMeetingStore();
    const { staff } = useStaffStore();
    const [isStreaming, setIsStreaming] = useState(false);
    const abortControllerRef = useRef(null);

    const streamMessage = async (inputMessage, selectedStaffId, systemPromptOverride = null, userContentOverride = null) => {
        if (!inputMessage.trim() || !selectedStaffId) return;

        const userMessage = {
            id: Date.now(),
            meeting_id: parseInt(meetingId),
            sender_type: "user",
            sender_name: "User",
            content: inputMessage,
            created_at: new Date().toISOString(),
        };

        addMessage(userMessage);
        setIsStreaming(true);

        const thinkingMessageId = `thinking-${Date.now()}`;
        const selectedStaff = staff.find((s) => s.id === selectedStaffId);
        const thinkingMessage = {
            id: thinkingMessageId,
            meeting_id: parseInt(meetingId),
            staff_id: selectedStaffId,
            sender_type: "staff",
            sender_name: selectedStaff?.name || "Staff",
            content: "",
            isThinking: true,
            created_at: new Date().toISOString(),
        };
        addMessage(thinkingMessage);

        abortControllerRef.current = new AbortController();

        try {
            const bodyPayload = { content: inputMessage, sender_name: "User" };
            if (systemPromptOverride) bodyPayload.custom_system_prompt = systemPromptOverride;
            if (userContentOverride) bodyPayload.custom_user_content = userContentOverride;

            const response = await fetch(
                `/api/meetings/${meetingId}/messages?staff_id=${selectedStaffId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(bodyPayload),
                    signal: abortControllerRef.current.signal,
                }
            );

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamedContent = "";
            let isFirstChunk = true;

            const staffMessage = {
                id: Date.now() + 1,
                meeting_id: parseInt(meetingId),
                staff_id: selectedStaffId,
                sender_type: "staff",
                sender_name: selectedStaff?.name || "Staff",
                content: "",
                created_at: new Date().toISOString(),
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                streamedContent += chunk;
                staffMessage.content = streamedContent;

                if (isFirstChunk) {
                    updateMessage({
                        ...staffMessage,
                        id: thinkingMessageId,
                        isThinking: false,
                    });
                    isFirstChunk = false;
                } else {
                    updateMessage({ ...staffMessage, id: thinkingMessageId });
                }
            }
            setIsStreaming(false);
            if (setImagesRefreshTrigger) setImagesRefreshTrigger(Date.now());
        } catch (error) {
            if (error.name === "AbortError") {
                selectMeeting(parseInt(meetingId));
            } else {
                console.error("Error sending message:", error);
            }
            setIsStreaming(false);
        }
    };

    const stopStreaming = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };

    return { isStreaming, setIsStreaming, streamMessage, stopStreaming };
}
