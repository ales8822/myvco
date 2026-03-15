// frontend\src\stores\meetingStore.js
import { create } from "zustand";
import { meetingsApi } from "../lib/api";

export const useMeetingStore = create((set) => ({
  meetings: [],
  currentMeeting: null,
  messages: [],
  loading: false,
  error: null,
  isStreaming: false, // Track if an agent is talking

  fetchMeetings: async (companyId) => {
    set({ loading: true, error: null });
    try {
      const response = await meetingsApi.list(companyId);
      set({ meetings: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  selectMeeting: async (meetingId) => {
    set({ loading: true, error: null });
    try {
      const [meetingResponse, messagesResponse] = await Promise.all([
        meetingsApi.get(meetingId),
        meetingsApi.getMessages(meetingId),
      ]);
      set({
        currentMeeting: meetingResponse.data,
        messages: messagesResponse.data,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createMeeting: async (companyId, meetingData) => {
    set({ loading: true, error: null });
    try {
      const response = await meetingsApi.create(companyId, meetingData);
      set((state) => ({
        meetings: [...state.meetings, response.data],
        currentMeeting: response.data,
        messages: [],
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteMeeting: async (meetingId) => {
    set({ loading: true, error: null });
    try {
      await meetingsApi.delete(meetingId);
      set((state) => ({
        meetings: state.meetings.filter((m) => m.id !== meetingId),
        currentMeeting:
          state.currentMeeting?.id === meetingId ? null : state.currentMeeting,
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  updateMessage: (message) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === message.id ? message : m)),
    }));
  },

  editMessage: async (messageId, content) => {
    try {
      await meetingsApi.updateMessage(messageId, { content });
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, content } : m
        ),
      }));
    } catch (error) {
      console.error("Failed to update message:", error);
      throw error;
    }
  },

  resendMessage: async (messageId, staffId, meetingId) => {
    set({ loading: true });
    try {
      const response = await meetingsApi.resendMessage(messageId, staffId);
      // The response is a stream, caller will handle it
      // After resend completes, refresh the meeting to get updated messages
      await useMeetingStore.getState().selectMeeting(meetingId);
      set({ loading: false });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Updated to accept config object
  endMeeting: async (meetingId, llmConfig = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await meetingsApi.updateStatus(meetingId, {
        status: "ended",
        summary_llm_provider: llmConfig.provider || "gemini",
        summary_llm_model: llmConfig.model || null,
      });

      set((state) => ({
        currentMeeting: response.data,
        meetings: state.meetings.map((m) =>
          m.id === meetingId ? response.data : m
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

   // 1.1 Added startAutonomousSession
  startAutonomousSession: async (meetingId, content, targetPath) => {
    set({ isStreaming: true, error: null });

    try {
        const response = await fetch(`/api/meetings/${meetingId}/autonomous`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, target_path: targetPath, sender_name: 'User' })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let buffer = "";
        let currentMessageObj = null;

        // 1.2 The Stream Loop
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            const markerRegex = /---STAFF:(.+?)---\n?/;

            while (true) {
                const match = markerRegex.exec(buffer);
                if (!match) break;

                // 1.3 Lock in text before the marker to the existing message
                const textBefore = buffer.substring(0, match.index);
                if (currentMessageObj) {
                    currentMessageObj.content += textBefore;
                    const savedObj = { ...currentMessageObj }; // Isolate object for Zustand
                    set((state) => ({
                        messages: state.messages.map(m => 
                            m.id === savedObj.id ? savedObj : m
                        )
                    }));
                }

                // 1.4 Create the new bubble
                const staffName = match[1];
                currentMessageObj = {
                    id: `auto-${Date.now()}-${Math.random()}`,
                    sender_name: staffName,
                    sender_type: 'staff',
                    content: '',
                    created_at: new Date().toISOString()
                };
                
                const newObj = { ...currentMessageObj }; // Isolate object for Zustand
                set((state) => ({
                    messages: [...state.messages, newObj]
                }));

                // 1.5 Consume the buffer
                buffer = buffer.substring(match.index + match[0].length);
            }

            // 1.6 Show remaining stream data in the active bubble safely
            if (currentMessageObj && buffer) {
                const displayContent = currentMessageObj.content + buffer;
                const idToUpdate = currentMessageObj.id;
                set((state) => ({
                    messages: state.messages.map(m => 
                        m.id === idToUpdate ? { ...m, content: displayContent } : m
                    )
                }));
            }
        }
    } catch (err) {
        set({ error: "Autonomous session failed to stream" });
    } finally {
        set({ isStreaming: false });
        // Wait 500ms to guarantee the SQLite database has finished its commit
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh from DB to get official IDs and clean history
        get().selectMeeting(meetingId); 

    }
  },

  // 1.5 Added stopAutonomousSession
  stopAutonomousSession: async (meetingId) => {
    try {
        await meetingsApi.stopAutonomous(meetingId);
        set({ isStreaming: false });
    } catch (err) {
        console.error("Failed to stop session", err);
    }
  }
}));
