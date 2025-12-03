import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../../../stores/meetingStore';

export const useMeetingManagement = (currentCompany) => {
    const navigate = useNavigate();
    const { createMeeting, deleteMeeting } = useMeetingStore();

    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [meetingForm, setMeetingForm] = useState({
        title: '',
        meeting_type: 'general',
        participants: [],
    });

    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        try {
            const meeting = await createMeeting(currentCompany.id, meetingForm);
            setShowMeetingModal(false);
            setMeetingForm({ title: '', meeting_type: 'general', participants: [] });
            navigate(`/meeting/${meeting.id}`);
        } catch (error) {
            console.error('Error creating meeting:', error);
        }
    };

    const handleDeleteMeeting = async (e, meetingId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this meeting? This cannot be undone.')) {
            await deleteMeeting(meetingId);
        }
    };

    const handleParticipantToggle = (staffId) => {
        const isSelected = meetingForm.participants.find(p => p.staff_id === staffId);
        if (isSelected) {
            setMeetingForm({
                ...meetingForm,
                participants: meetingForm.participants.filter(p => p.staff_id !== staffId)
            });
        } else {
            setMeetingForm({
                ...meetingForm,
                participants: [
                    ...meetingForm.participants,
                    { staff_id: staffId, llm_provider: 'gemini', llm_model: '' }
                ]
            });
        }
    };

    const updateParticipantConfig = (staffId, field, value) => {
        setMeetingForm({
            ...meetingForm,
            participants: meetingForm.participants.map(p =>
                p.staff_id === staffId ? { ...p, [field]: value } : p
            )
        });
    };

    return {
        showMeetingModal,
        setShowMeetingModal,
        meetingForm,
        setMeetingForm,
        handleCreateMeeting,
        handleDeleteMeeting,
        handleParticipantToggle,
        updateParticipantConfig
    };
};
