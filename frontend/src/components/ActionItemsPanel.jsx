import { useEffect, useState } from 'react';
import { meetingsApi } from '../lib/api';

export default function ActionItemsPanel({ meetingId, isActive }) {
    const [actionItems, setActionItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newItem, setNewItem] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    useEffect(() => {
        if (meetingId) {
            fetchActionItems();
        }
    }, [meetingId]);

    const fetchActionItems = async () => {
        setLoading(true);
        try {
            const response = await meetingsApi.getActionItems(meetingId);
            setActionItems(response.data);
        } catch (error) {
            console.error('Error fetching action items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        try {
            await meetingsApi.createActionItem(meetingId, {
                description: newItem,
            });
            setNewItem('');
            setShowAdd(false);
            fetchActionItems();
        } catch (error) {
            console.error('Error creating action item:', error);
        }
    };

    const handleCompleteItem = async (itemId) => {
        try {
            await meetingsApi.completeActionItem(itemId);
            fetchActionItems();
        } catch (error) {
            console.error('Error completing action item:', error);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Action Items</h3>
                {isActive && (
                    <button
                        onClick={() => setShowAdd(!showAdd)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                    >
                        + Add
                    </button>
                )}
            </div>

            {showAdd && (
                <form onSubmit={handleAddItem} className="mb-4">
                    <input
                        type="text"
                        className="input mb-2"
                        placeholder="Enter action item..."
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button type="submit" className="btn-primary flex-1">
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAdd(false)}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : actionItems.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                    No action items yet
                </div>
            ) : (
                <div className="space-y-2">
                    {actionItems.map((item) => (
                        <div
                            key={item.id}
                            className={`p-3 rounded-lg border ${item.status === 'completed'
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                        >
                            <div className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    checked={item.status === 'completed'}
                                    onChange={() => handleCompleteItem(item.id)}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <p
                                        className={`text-sm ${item.status === 'completed'
                                                ? 'line-through text-gray-500'
                                                : 'text-gray-900'
                                            }`}
                                    >
                                        {item.description}
                                    </p>
                                    {item.assigned_to && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Assigned to: {item.assigned_to}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
