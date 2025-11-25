// frontend/src/pages/CompanyDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';
import { useStaffStore } from '../stores/staffStore';
import { useMeetingStore } from '../stores/meetingStore';
import Sidebar from '../components/Sidebar';

export default function CompanyDashboard() {
    const navigate = useNavigate();
    const { currentCompany } = useCompanyStore();
    const { staff, fetchStaff } = useStaffStore();
    const { meetings, fetchMeetings, createMeeting } = useMeetingStore();
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [meetingForm, setMeetingForm] = useState({
        title: '',
        meeting_type: 'general',
        participant_ids: [],
    });

    useEffect(() => {
        if (currentCompany) {
            fetchStaff(currentCompany.id);
            fetchMeetings(currentCompany.id);
        }
    }, [currentCompany]);

    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        try {
            const meeting = await createMeeting(currentCompany.id, meetingForm);
            setShowMeetingModal(false);
            setMeetingForm({ title: '', meeting_type: 'general', participant_ids: [] });
            navigate(`/meeting/${meeting.id}`);
        } catch (error) {
            console.error('Error creating meeting:', error);
        }
    };

    const activeMeetings = meetings.filter((m) => m.status === 'active');
    const pastMeetings = meetings.filter((m) => m.status === 'ended');

    return (
        <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {currentCompany?.name}
                        </h1>
                        <p className="text-gray-600">{currentCompany?.description}</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Staff Members</p>
                                    <p className="text-3xl font-bold text-gray-900">{staff.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">👥</span>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Active Meetings</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {activeMeetings.length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">💬</span>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Meetings</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {meetings.length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">📊</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Quick Actions
                        </h2>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/staff')}
                                className="btn-primary"
                            >
                                👥 Hire Staff
                            </button>
                            <button
                                onClick={() => setShowMeetingModal(true)}
                                className="btn-primary"
                            >
                                💬 Start Meeting
                            </button>
                            <button
                                onClick={() => navigate('/knowledge')}
                                className="btn-secondary"
                            >
                                📚 Add Knowledge
                            </button>
                        </div>
                    </div>

                    {/* Active Meetings */}
                    {activeMeetings.length > 0 && (
                        <div className="card mb-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Active Meetings
                            </h2>
                            <div className="space-y-3">
                                {activeMeetings.map((meeting) => (
                                    <div
                                        key={meeting.id}
                                        onClick={() => navigate(`/meeting/${meeting.id}`)}
                                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                    >
                                        <h3 className="font-semibold text-gray-900">
                                            {meeting.title}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {meeting.meeting_type} • Started{' '}
                                            {new Date(meeting.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Meetings */}
                    {pastMeetings.length > 0 && (
                        <div className="card">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Recent Meetings
                            </h2>
                            <div className="space-y-3">
                                {pastMeetings.slice(0, 5).map((meeting) => (
                                    <div
                                        key={meeting.id}
                                        onClick={() => navigate(`/meeting/${meeting.id}`)}
                                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                    >
                                        <h3 className="font-semibold text-gray-900">
                                            {meeting.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {meeting.meeting_type} • Ended{' '}
                                            {new Date(meeting.ended_at).toLocaleString()}
                                        </p>
                                        {meeting.summary && (
                                            <p className="text-sm text-gray-700 line-clamp-2">
                                                {meeting.summary}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Meeting Modal */}
            {showMeetingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Start New Meeting
                        </h2>
                        <form onSubmit={handleCreateMeeting}>
                            <div className="mb-4">
                                <label className="label">Meeting Title *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={meetingForm.title}
                                    onChange={(e) =>
                                        setMeetingForm({ ...meetingForm, title: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label">Meeting Type</label>
                                <select
                                    className="input"
                                    value={meetingForm.meeting_type}
                                    onChange={(e) =>
                                        setMeetingForm({
                                            ...meetingForm,
                                            meeting_type: e.target.value,
                                        })
                                    }
                                >
                                    <option value="general">General Discussion</option>
                                    <option value="brainstorm">Brainstorming</option>
                                    <option value="decision">Decision Making</option>
                                    <option value="review">Review</option>
                                </select>
                            </div>
                            <div className="mb-6">
                                <label className="label">Participants</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {staff.map((member) => (
                                        <label
                                            key={member.id}
                                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={meetingForm.participant_ids.includes(
                                                    member.id
                                                )}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setMeetingForm({
                                                            ...meetingForm,
                                                            participant_ids: [
                                                                ...meetingForm.participant_ids,
                                                                member.id,
                                                            ],
                                                        });
                                                    } else {
                                                        setMeetingForm({
                                                            ...meetingForm,
                                                            participant_ids:
                                                                meetingForm.participant_ids.filter(
                                                                    (id) => id !== member.id
                                                                ),
                                                        });
                                                    }
                                                }}
                                                className="rounded"
                                            />
                                            <span className="text-sm">
                                                {member.name} - {member.role}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn-primary flex-1">
                                    Start Meeting
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowMeetingModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}