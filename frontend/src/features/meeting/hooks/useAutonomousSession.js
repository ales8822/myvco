import { useRef } from "react";
import { toast } from "react-hot-toast";
import { useMeetingStore } from "../../../stores/meetingStore";
import { useStaffStore } from "../../../stores/staffStore";
import { meetingsApi } from "../../../lib/api";

export function useAutonomousSession(meetingId, setIsStreaming) {
    const { addMessage, updateMessage } = useMeetingStore();
    const { staff } = useStaffStore();
    const autonomousControllerRef = useRef(null);

    const startAutonomous = async (inputMessage, targetPath = null) => {
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            meeting_id: parseInt(meetingId),
            sender_type: "user",
            sender_name: "User (Mission)",
            content: inputMessage,
            created_at: new Date().toISOString(),
        };
        addMessage(userMessage);

        const messageToSend = inputMessage;
        setIsStreaming(true);
        autonomousControllerRef.current = new AbortController();

        try {
            const bodyData = {
                content: messageToSend,
                sender_name: "User",
                target_path: targetPath,
            };

            const response = await fetch(`/api/meetings/${meetingId}/autonomous`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData),
                signal: autonomousControllerRef.current.signal,
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let currentStaffName = null;
            let streamedContent = "";
            let currentMessageId = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const staffMatch = chunk.match(/---STAFF:(.+?)---/);

                if (staffMatch) {
                    currentStaffName = staffMatch[1];
                    streamedContent = "";
                    const contentAfterHeader = chunk.replace(staffMatch[0], "");
                    streamedContent += contentAfterHeader;

                    const staffMember = staff.find((s) => s.name === currentStaffName || s.name.replace(/ /g, "_") === currentStaffName);
                    currentMessageId = Date.now() + Math.random();

                    const staffMessage = {
                        id: currentMessageId,
                        meeting_id: parseInt(meetingId),
                        staff_id: staffMember?.id,
                        sender_type: "staff",
                        sender_name: staffMember?.name || currentStaffName,
                        content: streamedContent.trim(),
                        created_at: new Date().toISOString(),
                    };
                    addMessage(staffMessage);
                } else {
                    streamedContent += chunk;
                    if (currentStaffName && currentMessageId) {
                        const staffMember = staff.find((s) => s.name === currentStaffName || s.name.replace(/ /g, "_") === currentStaffName);
                        const staffMessage = {
                            id: currentMessageId,
                            meeting_id: parseInt(meetingId),
                            staff_id: staffMember?.id,
                            sender_type: "staff",
                            sender_name: staffMember?.name || currentStaffName,
                            content: streamedContent.trim(),
                            created_at: new Date().toISOString(),
                        };
                        updateMessage(staffMessage);
                    }
                }
            }
            setIsStreaming(false);
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Error in autonomous session:", error);
                toast.error("Autonomous session failed.");
            }
            setIsStreaming(false);
        }
    };

    const stopAutonomous = async () => {
        if (autonomousControllerRef.current) {
            autonomousControllerRef.current.abort();
            autonomousControllerRef.current = null;
        }
        try {
            await meetingsApi.stopAutonomous(meetingId);
            toast.success("Stopping session...");
        } catch (e) {
            console.error("Failed to stop backend session", e);
        }
        setIsStreaming(false);
    };

    return { startAutonomous, stopAutonomous };
}
