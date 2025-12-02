import ImageSidebarPanel from '../../../components/ImageSidebarPanel';
import ActionItemsPanel from '../../../components/ActionItemsPanel';

export default function MeetingSidebar({
    meetingId,
    currentMeeting,
    participantStaff,
    imagesRefreshTrigger,
    onInsertMention,
    showActionItems
}) {
    return (
        <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
            <div className="mb-6">
                <ImageSidebarPanel
                    meetingId={parseInt(meetingId)}
                    companyId={currentMeeting?.company_id}
                    isActive={currentMeeting?.status === 'active'}
                    refreshTrigger={imagesRefreshTrigger}
                    onInsertMention={onInsertMention}
                />
            </div>
            <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Participants ({participantStaff.length})</h3>
                <div className="space-y-3">
                    {participantStaff.map((member) => {
                        const participantInfo = currentMeeting?.participants?.find(
                            p => p.staff_id === member.id
                        );
                        return (
                            <div key={member.id} className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-white">{member.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm truncate">{member.name}</p>
                                    <p className="text-xs text-gray-600 truncate">{member.role}</p>
                                    {participantInfo?.department_name && (
                                        <p className="text-xs text-gray-500 truncate">📂 {participantInfo.department_name}</p>
                                    )}
                                    <p className="text-xs text-gray-500 truncate">
                                        🤖 {participantInfo?.llm_provider === 'ollama' && participantInfo?.llm_model
                                            ? participantInfo.llm_model
                                            : participantInfo?.llm_provider || 'gemini'
                                        }
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {showActionItems && <ActionItemsPanel meetingId={parseInt(meetingId)} isActive={currentMeeting?.status === 'active'} />}
        </div>
    );
}
