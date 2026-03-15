// 1. Updated frontend/src/features/meeting/hooks/useAutonomousSession.js
import { useRef } from "react";
import { toast } from "react-hot-toast";
import { useMeetingStore } from "../../../stores/meetingStore";
import { useStaffStore } from "../../../stores/staffStore";
import { meetingsApi } from "../../../lib/api";

export function useAutonomousSession(meetingId, setIsStreaming) {
    const { addMessage, updateMessage, selectMeeting } = useMeetingStore();
    const { staff } = useStaffStore();
    const autonomousControllerRef = useRef(null);

    const startAutonomous = async (inputMessage, targetPath = null) => {
        if (!inputMessage.trim()) return;

        // FEATURE PRESERVED: Mission Initialization
        const userMessage = {
            id: Date.now(),
            meeting_id: parseInt(meetingId),
            sender_type: "user",
            sender_name: "User (Mission)",
            content: inputMessage,
            created_at: new Date().toISOString(),
        };
        addMessage(userMessage);

        setIsStreaming(true);
        autonomousControllerRef.current = new AbortController();

        try {
            const bodyData = {
                content: inputMessage,
                sender_name: "User",
                target_path: targetPath && targetPath.trim() !== "" ? targetPath : null,
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
            
            // 1.1 Initialize buffer and a tracking object for the active message
            let buffer = ""; 
            let currentMessageObj = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // 1.2 Non-global regex ensures we process one marker at a time. 
                // (\n? allows it to work even if the chunk cuts off exactly after the dashes)
                const staffDelimiterRegex = /---STAFF:(.+?)---\n?/;

                while (true) {
                    const match = staffDelimiterRegex.exec(buffer);
                    if (!match) break; // Break inner loop if no complete marker is found yet

                    // 1.3 Commit any text BEFORE the marker to the PREVIOUS speaker
                    const textBefore = buffer.substring(0, match.index);
                    if (currentMessageObj) {
                        currentMessageObj.content += textBefore;
                        updateMessage({ ...currentMessageObj });
                    }

                    // 1.4 Start a NEW speaker turn
                    const staffNameFromStream = match[1];
                    const staffMember = staff.find((s) => 
                        s.name === staffNameFromStream || 
                        s.name.replace(/ /g, "_") === staffNameFromStream ||
                        s.name.replace(/["']/g, "") === staffNameFromStream.replace(/["']/g, "")
                    );

                    currentMessageObj = {
                        id: `auto-${Date.now()}-${Math.random()}`,
                        meeting_id: parseInt(meetingId),
                        staff_id: staffMember?.id,
                        sender_type: "staff",
                        sender_name: staffMember?.name || staffNameFromStream,
                        content: "", // Base content starts empty
                        created_at: new Date().toISOString(),
                    };

                    addMessage(currentMessageObj);

                    // 1.5 CONSUME: Remove processed text and the marker from the buffer
                    buffer = buffer.substring(match.index + match[0].length);
                }

                // 1.6 Live update: Display the remaining buffer in the active bubble
                // We don't permanently add it to currentMessageObj.content yet!
                if (currentMessageObj && buffer) {
                    updateMessage({
                        ...currentMessageObj,
                        content: currentMessageObj.content + buffer
                    });
                }
            }

            setIsStreaming(false);
            // Wait 500ms to guarantee the SQLite database has finished its commit
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Fetch the finalized messages
            await selectMeeting(meetingId);

        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Error in autonomous session:", error);
                toast.error("Autonomous session failed.");
            }
            setIsStreaming(false);
        }
    };

    const stopAutonomous = async () => {
        // FEATURE PRESERVED: AbortController management
        if (autonomousControllerRef.current) {
            autonomousControllerRef.current.abort();
            autonomousControllerRef.current = null;
        }
        try {
            // FEATURE PRESERVED: API signal to stop AutoGen
            await meetingsApi.stopAutonomous(meetingId);
        } catch (e) {
            console.error("Failed to stop backend session", e);
        }
        setIsStreaming(false);
    };

    return { startAutonomous, stopAutonomous };
}