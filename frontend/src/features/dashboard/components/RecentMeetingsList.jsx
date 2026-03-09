export default function RecentMeetingsList({
  pastMeetings,
  navigate,
  handleDeleteMeeting,
}) {
  if (pastMeetings.length === 0) return null;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Recent Meetings
      </h2>
      <div className="space-y-3">
        {pastMeetings.slice(0, 5).map((meeting) => (
          <div
            key={meeting.id}
            onClick={() => navigate(`/meeting/${meeting.id}`)}
            className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors flex justify-between items-start group border border-transparent dark:border-neutral-700/50"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {meeting.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-neutral-400 mb-2 font-medium">
                {meeting.meeting_type} • Ended{" "}
                {new Date(meeting.ended_at).toLocaleString()}
              </p>
              {meeting.summary && (
                <p className="text-sm text-gray-700 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                  {meeting.summary}
                </p>
              )}
            </div>
            <button
              onClick={(e) => handleDeleteMeeting(e, meeting.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all ml-4"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
