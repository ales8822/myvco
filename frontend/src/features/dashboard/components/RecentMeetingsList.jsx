export default function RecentMeetingsList({ pastMeetings, navigate, handleDeleteMeeting }) {
    if (pastMeetings.length === 0) return null;

    return (
        <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Meetings</h2>
            <div className="space-y-3">
                {pastMeetings.slice(0, 5).map((meeting) => (
                    <div
                        key={meeting.id}
                        onClick={() => navigate(`/meeting/${meeting.id}`)}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors flex justify-between items-start group"
                    >
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">
                                {meeting.meeting_type} • Ended {new Date(meeting.ended_at).toLocaleString()}
                            </p>
                            {meeting.summary && <p className="text-sm text-gray-700 line-clamp-2">{meeting.summary}</p>}
                        </div>
                        <button
                            onClick={(e) => handleDeleteMeeting(e, meeting.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded transition-all ml-4"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
