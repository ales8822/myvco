import Breadcrumbs from '../../../components/Breadcrumbs';

export default function MeetingHeader({
    currentMeeting,
    participantStaff,
    showActionItems,
    setShowActionItems,
    onEndMeetingClick
}) {
    return (
        <div className="bg-white border-b border-gray-200 p-6">
            <Breadcrumbs items={[{ label: 'Dashboard', path: '/dashboard' }, { label: currentMeeting?.title || 'Meeting' }]} />
            <div className="flex justify-between items-center mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{currentMeeting?.title}</h1>
                    <p className="text-sm text-gray-600">
                        {currentMeeting?.meeting_type} • {currentMeeting?.status === 'active' ? <span className="text-green-600">Active</span> : <span className="text-gray-600">Ended</span>} • {participantStaff.length} participants
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowActionItems(!showActionItems)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {showActionItems ? 'Hide' : 'Show'} Action Items
                    </button>
                    {currentMeeting?.status === 'active' && (
                        <button
                            onClick={onEndMeetingClick}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            End Meeting
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
