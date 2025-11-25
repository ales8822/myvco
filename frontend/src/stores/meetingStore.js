import { create } from 'zustand';
import { meetingsApi } from '../lib/api';

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

    addMessage: (message) => {
        set((state) => ({
            messages: [...state.messages, message],
        }));
    },

    updateMessage: (message) => {
        set((state) => ({
            messages: state.messages.map((m) =>
                m.id === message.id ? message : m
            ),
        }));
    },

    endMeeting: async (meetingId) => {
        set({ loading: true, error: null });
        try {
            const response = await meetingsApi.updateStatus(meetingId, {
                status: 'ended',
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
