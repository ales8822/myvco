// frontend\src\stores\meetingStore.js
import { create } from "zustand";
import { meetingsApi } from "../lib/api";

export const useMeetingStore = create((set) => ({
  meetings: [],
  currentMeeting: null,
  messages: [],
  loading: false,
  error: null,

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
}));
