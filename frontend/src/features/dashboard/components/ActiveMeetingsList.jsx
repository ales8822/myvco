export default function ActiveMeetingsList({ activeMeetings, navigate, handleDeleteMeeting }) {
    if (activeMeetings.length === 0) return null;

    return (
        <div className="card mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Active Meetings</h2>
            <div className="space-y-3">
                {activeMeetings.map((meeting) => (
                    <div
                        key={meeting.id}
                        onClick={() => navigate(`/meeting/${meeting.id}`)}
                        className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors flex justify-between items-center group border border-transparent dark:border-neutral-700/50"
                    >
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{meeting.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-neutral-400">
                                {meeting.meeting_type} • Started {new Date(meeting.created_at).toLocaleString()}
                            </p>
                        </div>
                        <button
                            onClick={(e) => handleDeleteMeeting(e, meeting.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
