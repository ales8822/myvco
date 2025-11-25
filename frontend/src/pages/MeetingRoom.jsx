import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../stores/meetingStore';
import { useStaffStore } from '../stores/staffStore';
import { meetingsApi } from '../lib/api';
import Sidebar from '../components/Sidebar';

export default function MeetingRoom() {
    const { meetingId } = useParams();
    const navigate = useNavigate();
    const { currentMeeting, messages, selectMeeting, addMessage, endMeeting } =
        useMeetingStore();
    const { staff } = useStaffStore();
    const [inputMessage, setInputMessage] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        selectMeeting(parseInt(meetingId));
    }, [meetingId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        // Auto-select first participant
        if (currentMeeting?.participants && currentMeeting.participants.length > 0) {
            setSelectedStaffId(currentMeeting.participants[0].staff_id);
        }
    }, [currentMeeting]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !selectedStaffId) return;

        const userMessage = {
            id: Date.now(),
            meeting_id: parseInt(meetingId),
            sender_type: 'user',
            sender_name: 'User',
            content: inputMessage,
            created_at: new Date().toISOString(),
        };

        addMessage(userMessage);
        setInputMessage('');
        setIsStreaming(true);

        try {
            const response = await fetch(
                `/api/meetings/${meetingId}/messages?staff_id=${selectedStaffId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content: inputMessage,
                        sender_name: 'User',
                    }),
                }
            );

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamedContent = '';

            const selectedStaff = staff.find((s) => s.id === selectedStaffId);

            // Create a placeholder message for streaming
            const staffMessage = {
                id: Date.now() + 1,
                meeting_id: parseInt(meetingId),
                staff_id: selectedStaffId,
                sender_type: 'staff',
                sender_name: selectedStaff?.name || 'Staff',
                content: '',
                created_at: new Date().toISOString(),
            };

            addMessage(staffMessage);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                streamedContent += chunk;

                // Update the message content
                staffMessage.content = streamedContent;
                addMessage({ ...staffMessage });
            }

            setIsStreaming(false);
        } catch (error) {
            console.error('Error sending message:', error);
            setIsStreaming(false);
        }
    };

    const handleEndMeeting = async () => {
        if (confirm('Are you sure you want to end this meeting?')) {
            await endMeeting(parseInt(meetingId));
            navigate('/dashboard');
        }
    };

    const participants = currentMeeting?.participants || [];
    const participantStaff = staff.filter((s) =>
        participants.some((p) => p.staff_id === s.id)
    );

    return (
        <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1 flex flex-col h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {currentMeeting?.title}
                            </h1>
                            <p className="text-sm text-gray-600">
                                {currentMeeting?.meeting_type} •{' '}
                                {currentMeeting?.status === 'active' ? (
                                    <span className="text-green-600">Active</span>
                                ) : (
                                    <span className="text-gray-600">Ended</span>
                                )}
                            </p>
                        </div>
                        {currentMeeting?.status === 'active' && (
                            <button
                                onClick={handleEndMeeting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                End Meeting
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Messages Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((message, idx) => (
                                <div
                                    key={`${message.id}-${idx}`}
                                    className={`flex ${message.sender_type === 'user'
                                            ? 'justify-end'
                                            : 'justify-start'
                                        }`}
                                >
                                    <div
                                        className={`max-w-2xl ${message.sender_type === 'user'
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-white border border-gray-200'
                                            } rounded-lg p-4 shadow-sm`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${message.sender_type === 'user'
                                                        ? 'bg-primary-700 text-white'
                                                        : 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white'
                                                    }`}
                                            >
                                                {message.sender_name.charAt(0).toUpperCase()}
                                            </div>
                                            <span
                                                className={`font-semibold text-sm ${message.sender_type === 'user'
                                                        ? 'text-white'
                                                        : 'text-gray-900'
                                                    }`}
                                            >
                                                {message.sender_name}
                                            </span>
                                        </div>
                                        <p
                                            className={`whitespace-pre-wrap ${message.sender_type === 'user'
                                                    ? 'text-white'
                                                    : 'text-gray-800'
                                                }`}
                                        >
                                            {message.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        {currentMeeting?.status === 'active' && (
                            <div className="bg-white border-t border-gray-200 p-6">
                                <form onSubmit={handleSendMessage} className="space-y-4">
                                    <div>
                                        <label className="label">Responding Staff Member</label>
                                        <select
                                            className="input"
                                            value={selectedStaffId || ''}
                                            onChange={(e) =>
                                                setSelectedStaffId(parseInt(e.target.value))
                                            }
                                            required
                                        >
                                            <option value="">Select staff member</option>
                                            {participantStaff.map((member) => (
                                                <option key={member.id} value={member.id}>
                                                    {member.name} - {member.role}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            className="input flex-1"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            disabled={isStreaming}
                                        />
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={isStreaming || !selectedStaffId}
                                        >
                                            {isStreaming ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Participants Sidebar */}
                    <div className="w-64 bg-white border-l border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">
                            Participants ({participantStaff.length})
                        </h3>
                        <div className="space-y-3">
                            {participantStaff.map((member) => (
                                <div key={member.id} className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-bold text-white">
                                            {member.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">
                                            {member.name}
                                        </p>
                                        <p className="text-xs text-gray-600">{member.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
