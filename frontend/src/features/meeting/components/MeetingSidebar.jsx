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
        // 1.1 Updated Background to Neutral-900 and Border to Neutral-800
        <div className="w-80 bg-white dark:bg-neutral-900 border-l border-gray-200 dark:border-neutral-800 p-6 overflow-y-auto transition-colors">
            
            <div className="mb-8">
                <ImageSidebarPanel
                    meetingId={parseInt(meetingId)}
                    companyId={currentMeeting?.company_id}
                    isActive={currentMeeting?.status === 'active'}
                    refreshTrigger={imagesRefreshTrigger}
                    onInsertMention={onInsertMention}
                />
            </div>

            <div className="mb-8">
                {/* 1.2 Updated Header style for consistency */}
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500 mb-6">
                    Participants ({participantStaff.length})
                </h3>
                
                <div className="space-y-4">
                    {participantStaff.map((member) => {
                        const participantInfo = currentMeeting?.participants?.find(
                            p => p.staff_id === member.id
                        );
                        return (
                            <div key={member.id} className="flex items-start gap-3 group">
                                {/* 1.3 Avatar gradient will now be Teal-to-Indigo */}
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                    <span className="text-sm font-bold text-white">{member.name.charAt(0).toUpperCase()}</span>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate leading-tight">
                                        {member.name}
                                    </p>
                                    
                                    {/* 1.4 Indigo-tinted Role for better distinction */}
                                    <p className="text-[11px] font-medium text-secondary-600 dark:text-secondary-400/80 truncate mt-0.5 uppercase tracking-tight">
                                        {member.role}
                                    </p>
                                    
                                    {/* 1.5 Subtler Metadata logic */}
                                    <div className="mt-1 space-y-0.5 opacity-80 dark:opacity-60 hover:opacity-100 transition-opacity">
                                        {participantInfo?.department_name && (
                                            <p className="text-[10px] text-gray-500 dark:text-neutral-400 flex items-center gap-1.5 truncate">
                                                <span>📂</span> {participantInfo.department_name}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-gray-500 dark:text-neutral-400 flex items-center gap-1.5 truncate">
                                            <span>🤖</span> {participantInfo?.llm_provider === 'ollama' && participantInfo?.llm_model
                                                ? participantInfo.llm_model
                                                : participantInfo?.llm_provider || 'gemini'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 1.6 Action Items Section */}
            {showActionItems && (
                <div className="mt-4 pt-6 border-t border-gray-100 dark:border-neutral-800">
                    <ActionItemsPanel 
                        meetingId={parseInt(meetingId)} 
                        isActive={currentMeeting?.status === 'active'} 
                        participants={currentMeeting?.participants || []} 
                    />
                </div>
            )}
        </div>
    );
}