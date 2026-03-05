// /frontend/src/features/meeting/hooks/useMeetingChat.js
import { useState } from "react";
import { useStreamingChat } from "./useStreamingChat";
import { useAutonomousSession } from "./useAutonomousSession";
import { useChatActions } from "./useChatActions";

export function useMeetingChat(
  meetingId,
  currentMeeting,
  setImagesRefreshTrigger
) {
  const [inputMessage, setInputMessage] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [thinkingStaff, setThinkingStaff] = useState([]);

  // Use specialized hooks
  const { isStreaming, setIsStreaming, streamMessage, stopStreaming } = useStreamingChat(
    meetingId,
    setImagesRefreshTrigger
  );

  const { startAutonomous, stopAutonomous } = useAutonomousSession(
    meetingId,
    setIsStreaming
  );

  const { resendMessage, askAll } = useChatActions(
    meetingId,
    setIsStreaming,
    setImagesRefreshTrigger
  );

  // Handlers that orchestrate the specialized logic
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !selectedStaffId) return;

    const message = inputMessage;
    setInputMessage(""); // Clear early for UX
    await streamMessage(message, selectedStaffId);
  };

  const handleStopGeneration = () => {
    stopStreaming();
  };

  const handleResendMessage = async (messageId) => {
    await resendMessage(messageId, selectedStaffId);
  };

  const handleAskAll = async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage;
    setInputMessage("");

    const requests = await askAll(message, currentMeeting);
    if (!requests || requests.length === 0) return;

    setThinkingStaff(requests.map(r => r.member));

    await Promise.all(
      requests.map(async ({ member, fetchFn }) => {
        await fetchFn(member, requests.indexOf(member));
        setThinkingStaff(prev => prev.filter(p => p.id !== member.id));
      })
    );

    setIsStreaming(false);
    if (setImagesRefreshTrigger) setImagesRefreshTrigger(Date.now());
  };

  const handleAutonomousSession = async (targetPath = null) => {
    const message = inputMessage;
    setInputMessage("");
    await startAutonomous(message, targetPath);
  };

  const handleStopAutonomous = async () => {
    await stopAutonomous();
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
    handleAskAll,
    handleAutonomousSession,
    handleStopAutonomous,
  };
}
