// /frontend/src/features/meeting/hooks/useMeetingChat.js
import { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { useMeetingStore } from "../../../stores/meetingStore";
import { useStaffStore } from "../../../stores/staffStore";
import { meetingsApi } from "../../../lib/api";

export function useMeetingChat(
  meetingId,
  currentMeeting,
  setImagesRefreshTrigger
) {
  const { messages, selectMeeting, addMessage, updateMessage } =
    useMeetingStore();
  const { staff } = useStaffStore();

  const [inputMessage, setInputMessage] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingStaff, setThinkingStaff] = useState([]);

  const abortControllerRef = useRef(null);
  const currentStreamingMessageIdRef = useRef(null);
  const autonomousControllerRef = useRef(null);
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
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
    setInputMessage("");
    setIsStreaming(true);

    const thinkingMessageId = `thinking-${Date.now()}`;
    currentStreamingMessageIdRef.current = thinkingMessageId;
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
      const response = await fetch(
        `/api/meetings/${meetingId}/messages?staff_id=${selectedStaffId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: inputMessage, sender_name: "User" }),
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
      currentStreamingMessageIdRef.current = null;
      if (setImagesRefreshTrigger) setImagesRefreshTrigger(Date.now());
    } catch (error) {
      if (error.name === "AbortError") {
        selectMeeting(parseInt(meetingId));
      } else {
        console.error("Error sending message:", error);
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
      toast.error("Please select a staff member");
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
      sender_type: "staff",
      sender_name: selectedStaff?.name || "Staff",
      content: "",
      isThinking: true,
      created_at: new Date().toISOString(),
    };
    addMessage(thinkingMessage);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `/api/meetings/messages/${messageId}/resend?staff_id=${selectedStaffId}`,
        {
          method: "POST",
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

      await selectMeeting(parseInt(meetingId));
      setIsStreaming(false);
      currentStreamingMessageIdRef.current = null;
      if (setImagesRefreshTrigger) setImagesRefreshTrigger(Date.now());
      toast.success("Message resent successfully");
    } catch (error) {
      if (error.name === "AbortError") {
        selectMeeting(parseInt(meetingId));
      } else {
        console.error("Error resending message:", error);
        toast.error("Failed to resend message");
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
      sender_type: "user",
      sender_name: "User",
      content: inputMessage,
      created_at: new Date().toISOString(),
    };
    addMessage(userMessage);
    const messageToSend = inputMessage;
    setInputMessage("");
    setIsStreaming(true);

    const participants = staff.filter((s) =>
      currentMeeting?.participants?.some((p) => p.staff_id === s.id)
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
            setThinkingStaff((prev) => prev.filter((p) => p.id !== member.id));
            addMessage(staffMessage);
            isFirstChunk = false;
          } else {
            updateMessage({ ...staffMessage });
          }
        }
      } catch (error) {
        console.error(`Error fetching response for ${member.name}:`, error);
        setThinkingStaff((prev) => prev.filter((p) => p.id !== member.id));
      }
    };

    await Promise.all(
      participants.map((member, index) => fetchStaffResponse(member, index))
    );
    setIsStreaming(false);
    if (setImagesRefreshTrigger) setImagesRefreshTrigger(Date.now());
  };

  // NEW: Handle Stop for Autonomous
  const handleStopAutonomous = async () => {
    // 1. Abort local fetch
    if (autonomousControllerRef.current) {
      autonomousControllerRef.current.abort();
      autonomousControllerRef.current = null;
    }

    // 2. Signal Backend to kill thread
    try {
      await meetingsApi.stopAutonomous(meetingId);
      toast.success("Stopping session...");
    } catch (e) {
      console.error("Failed to stop backend session", e);
    }

    setIsStreaming(false);
  };

  // NEW: Handle Autonomous Session
  const handleAutonomousSession = async (targetPath = null) => {
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
    setInputMessage("");
    setIsStreaming(true);

    // Init Controller
    autonomousControllerRef.current = new AbortController();

    try {
      const bodyData = {
        content: messageToSend,
        sender_name: "User",
      };

      if (targetPath) {
        bodyData.target_path = targetPath;
      }

      const response = await fetch(`/api/meetings/${meetingId}/autonomous`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
        signal: autonomousControllerRef.current.signal, // Link signal
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let currentStaffName = null;
      let streamedContent = "";
      let currentMessageId = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        // ... (parsing logic remains exactly the same as previous version) ...
        const staffMatch = chunk.match(/---STAFF:(.+?)---/);

        if (staffMatch) {
          currentStaffName = staffMatch[1];
          streamedContent = "";
          const contentAfterHeader = chunk.replace(staffMatch[0], "");
          streamedContent += contentAfterHeader;

          const staffMember = staff.find(
            (s) =>
              s.name === currentStaffName ||
              s.name.replace(/ /g, "_") === currentStaffName
          );
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
            const staffMember = staff.find(
              (s) =>
                s.name === currentStaffName ||
                s.name.replace(/ /g, "_") === currentStaffName
            );
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
      if (error.name === "AbortError") {
        console.log("Autonomous session aborted");
      } else {
        console.error("Error in autonomous session:", error);
        toast.error("Autonomous session failed.");
      }
      setIsStreaming(false);
    }
  };

  return {
    // ... existing exports
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
    handleStopAutonomous, // <--- Export this new function
  };
}
