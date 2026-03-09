export default function CreateMeetingModal({
  showMeetingModal,
  setShowMeetingModal,
  handleCreateMeeting,
  meetingForm,
  setMeetingForm,
  staff,
  handleParticipantToggle,
  updateParticipantConfig,
  providers,
}) {
  if (!showMeetingModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-8 max-w-2xl w-full my-8 shadow-2xl border border-transparent dark:border-neutral-800 transition-colors">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Start New Meeting
        </h2>
        <form onSubmit={handleCreateMeeting}>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
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
            <div>
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
          </div>

          <div className="mb-6">
            <label className="label">
              Select Participants & Assign Intelligence
            </label>
            <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 dark:border-neutral-800 rounded-lg p-4 bg-gray-50/30 dark:bg-neutral-950/30">
              {staff.map((member) => {
                const participant = meetingForm.participants.find(
                  (p) => p.staff_id === member.id,
                );
                const isSelected = !!participant;

                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isSelected
                        ? "bg-primary-50/30 dark:bg-neutral-800 border-primary-500 dark:border-primary-500/50 shadow-sm"
                        : "bg-white dark:bg-transparent border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleParticipantToggle(member.id)}
                          className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-neutral-700 dark:bg-neutral-900"
                        />
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {member.name}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-neutral-500 ml-2">
                            ({member.role})
                          </span>
                        </div>
                      </label>
                    </div>

                    {isSelected && (
                      <div className="ml-8 grid grid-cols-2 gap-4 mt-4 bg-gray-100 dark:bg-neutral-950 p-4 rounded-lg border border-gray-200 dark:border-neutral-800/50">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-neutral-500 mb-2 block">
                            LLM Provider
                          </label>
                          <select
                            className="w-full text-sm border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 dark:text-gray-200 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-primary-500 outline-none"
                            value={participant.llm_provider}
                            onChange={(e) =>
                              updateParticipantConfig(
                                member.id,
                                "llm_provider",
                                e.target.value,
                              )
                            }
                          >
                            <option value="gemini">Gemini</option>
                            <option value="ollama">Ollama</option>
                          </select>
                        </div>

                        {participant.llm_provider === "ollama" && (
                          <div>
                            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-neutral-500 mb-2 block">
                              Model
                            </label>
                            <select
                              className="w-full text-sm border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 dark:text-gray-200 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-primary-500 outline-none"
                              value={participant.llm_model}
                              onChange={(e) =>
                                updateParticipantConfig(
                                  member.id,
                                  "llm_model",
                                  e.target.value,
                                )
                              }
                            >
                              <option value="">Default</option>
                              {providers?.ollama_models?.map((model) => (
                                <option key={model} value={model}>
                                  {model}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
  );
}
