import { toast } from "react-hot-toast";
import { useMeetingStore } from "../../../stores/meetingStore";
import { useStaffStore } from "../../../stores/staffStore";

export function useChatActions(meetingId, setIsStreaming, setImagesRefreshTrigger) {
    const { addMessage, updateMessage, selectMeeting } = useMeetingStore();
    const { staff } = useStaffStore();

    const resendMessage = async (messageId, selectedStaffId) => {
        if (!selectedStaffId) {
            toast.error("Please select a staff member");
            return;
        }

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

        const abortController = new AbortController();

        try {
            const response = await fetch(
                `/api/meetings/messages/${messageId}/resend?staff_id=${selectedStaffId}`,
                {
                    method: "POST",
                    signal: abortController.signal,
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

            await selectMeeting(parseInt(meetingId));
            setIsStreaming(false);
            if (setImagesRefreshTrigger) setImagesRefreshTrigger(Date.now());
            toast.success("Message resent successfully");
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Error resending message:", error);
                toast.error("Failed to resend message");
            }
            setIsStreaming(false);
        }
    };

    const askAll = async (inputMessage, currentMeeting) => {
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            meeting_id: parseInt(meetingId),
            sender_type: "user",
            sender_name: "User",
            content: inputMessage,
            created_at: new Date().toISOString(),
        };
        addMessage(userMessage);
        const messageToSend = inputMessage;
        setIsStreaming(true);

        const participants = staff.filter((s) =>
            currentMeeting?.participants?.some((p) => p.staff_id === s.id)
        );

        if (participants.length === 0) {
            setIsStreaming(false);
            return [];
        }

        const fetchStaffResponse = async (member, index) => {
            try {
                const saveUserMsg = index === 0;
                const response = await fetch(
                    `/api/meetings/${meetingId}/messages?staff_id=${member.id}&save_user_message=${saveUserMsg}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            content: messageToSend,
                            sender_name: "User",
                        }),
                    }
                );

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let streamedContent = "";
                let isFirstChunk = true;

                const staffMessage = {
                    id: Date.now() + Math.random(),
                    meeting_id: parseInt(meetingId),
                    staff_id: member.id,
                    sender_type: "staff",
                    sender_name: member.name,
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
                        addMessage(staffMessage);
                        isFirstChunk = false;
                    } else {
                        updateMessage({ ...staffMessage });
                    }
                }
                return member;
            } catch (error) {
                console.error(`Error fetching response for ${member.name}:`, error);
                return null;
            }
        };

        return participants.map((member, index) => ({ member, index, fetchFn: fetchStaffResponse }));
    };

    return { resendMessage, askAll };
}
