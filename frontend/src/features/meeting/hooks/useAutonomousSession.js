import { useRef } from "react";
import { useMeetingStore } from "../../../stores/meetingStore";
import { useStaffStore } from "../../../stores/staffStore";
import { meetingsApi } from "../../../lib/api";

export function useAutonomousSession(meetingId, setIsStreaming) {
    const { addMessage } = useMeetingStore();
    const { staff } = useStaffStore();
    const autonomousControllerRef = useRef(null);

    const startAutonomous = async (inputMessage, targetPath = null) => {
        if (!inputMessage.trim()) return;

        addMessage({
            id: Date.now(),
            sender_type: "user",
            sender_name: "User (Mission)",
            content: inputMessage,
            created_at: new Date().toISOString(),
        });

        // 1. Force both local and global state to TRUE
        if (typeof setIsStreaming === 'function') setIsStreaming(true);
        useMeetingStore.setState({ isStreaming: true });

        autonomousControllerRef.current = new AbortController();

        try {
            const response = await fetch(`/api/meetings/${meetingId}/autonomous`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: inputMessage, target_path: targetPath }),
                signal: autonomousControllerRef.current.signal
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let buffer = ""; 

            while (true) {
                const { done, value } = await reader.read();
                
                // 2. Handle connection close
                if (done) {
                    // If there's leftover text in the buffer when the stream ends, process it
                    if (buffer.trim()) {
                        try {
                            const event = JSON.parse(buffer);
                            if (event.type === "node_start" && event.node === "END") {
                                useMeetingStore.setState({ isStreaming: false });
                            }
                        } catch (e) {
                            console.error("Final JSON parse error:", e);
                        }
                    }
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); 
                
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const event = JSON.parse(line);
                        
                        if (event.type === "content") {
                            addMessage({
                                id: Date.now() + Math.random(),
                                sender_name: event.speaker || "Agent",
                                content: event.content,
                                sender_type: "staff"
                            });
                        }
                        
                        // 3. Catch the END event directly from the stream
                        if (event.type === "node_start" && event.node === "END") {
                            if (typeof setIsStreaming === 'function') setIsStreaming(false);
                            useMeetingStore.setState({ isStreaming: false });
                        }
                    } catch (e) {
                        console.error("JSON parse error on line:", line, e);
                    }
                }
            }
        } catch (e) {
            if (e.name !== "AbortError") {
                console.error("Stream failed:", e);
            }
        } finally {
            // 4. CRITICAL: Force unlock the UI in the finally block
            // This runs guaranteed when the stream loop breaks or errors out
            if (typeof setIsStreaming === 'function') setIsStreaming(false);
            useMeetingStore.setState({ isStreaming: false });
        }
    };

    const stopAutonomous = async () => {
        if (autonomousControllerRef.current) {
            autonomousControllerRef.current.abort();
            autonomousControllerRef.current = null;
        }
        try {
            await meetingsApi.stopAutonomous(meetingId);
        } catch (e) {
            console.error("Failed to stop backend session", e);
        }
        
        // Ensure UI unlocks when manually stopped
        if (typeof setIsStreaming === 'function') setIsStreaming(false);
        useMeetingStore.setState({ isStreaming: false });
    };

    return { startAutonomous, stopAutonomous };
}