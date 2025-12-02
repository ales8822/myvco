import { useState, useEffect } from 'react';
import { meetingsApi, assetsApi } from '../../../lib/api';

export function useMentions(meetingId, currentMeeting, imagesRefreshTrigger) {
    const [availableMentions, setAvailableMentions] = useState([]);
    const [filteredMentions, setFilteredMentions] = useState([]);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionCursorIndex, setMentionCursorIndex] = useState(-1);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

    const loadMentions = async () => {
        try {
            // Fetch images
            const imagesRes = await meetingsApi.getImages(meetingId);

            let assetsRes = { data: [] };
            // Fetch assets if company_id is available
            if (currentMeeting?.company_id) {
                assetsRes = await assetsApi.list(currentMeeting.company_id);
            }

            const mentions = [];

            // Process Meeting Images
            if (imagesRes.data) {
                imagesRes.data.forEach((img, index) => {
                    const label = `img${img.display_order || (index + 1)}`;
                    mentions.push({
                        id: `meeting-img-${img.id}`,
                        label: label,
                        display: `@${label}`,
                        type: 'image',
                        url: `http://localhost:8001${img.image_url}`,
                        description: img.description
                    });
                });
            }

            // Process Company Assets
            if (assetsRes.data) {
                assetsRes.data.forEach(asset => {
                    mentions.push({
                        id: `asset-${asset.id}`,
                        label: asset.asset_name,
                        display: `@${asset.asset_name}`,
                        type: 'asset',
                        url: asset.asset_type === 'image' ? `http://localhost:8001/${asset.file_path}` : null,
                        description: asset.display_name
                    });
                });
            }

            setAvailableMentions(mentions);
        } catch (error) {
            console.error("Error loading mentions:", error);
        }
    };

    // Reload mentions when meetingId, refreshTrigger, or currentMeeting.company_id changes
    useEffect(() => {
        if (meetingId) {
            loadMentions();
        }
    }, [meetingId, imagesRefreshTrigger, currentMeeting?.company_id]);

    const handleMentionInput = (e, inputMessage, setInputMessage) => {
        const newValue = e.target.value;
        setInputMessage(newValue);

        const cursorIndex = e.target.selectionStart;

        // Check if we are currently typing a mention
        const textBeforeCursor = newValue.slice(0, cursorIndex);
        const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtSymbolIndex !== -1) {
            const query = textBeforeCursor.slice(lastAtSymbolIndex + 1);

            // Only allow simple queries without spaces for now
            if (!query.includes(' ')) {
                setMentionQuery(query);
                setMentionCursorIndex(lastAtSymbolIndex);
                setShowMentionDropdown(true);

                // Filter mentions
                const filtered = availableMentions.filter(m =>
                    m.label.toLowerCase().includes(query.toLowerCase()) ||
                    m.display.toLowerCase().includes(query.toLowerCase())
                );
                setFilteredMentions(filtered);
                setSelectedMentionIndex(0);
                return;
            }
        }

        setShowMentionDropdown(false);
    };

    const handleMentionKeyDown = (e, selectMention) => {
        if (showMentionDropdown && filteredMentions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedMentionIndex(prev => (prev + 1) % filteredMentions.length);
                return true;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedMentionIndex(prev => (prev - 1 + filteredMentions.length) % filteredMentions.length);
                return true;
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                selectMention(filteredMentions[selectedMentionIndex]);
                return true;
            } else if (e.key === 'Escape') {
                setShowMentionDropdown(false);
                return true;
            }
        }
        return false;
    };

    return {
        availableMentions,
        filteredMentions,
        showMentionDropdown,
        setShowMentionDropdown,
        mentionQuery,
        mentionCursorIndex,
        selectedMentionIndex,
        handleMentionInput,
        handleMentionKeyDown
    };
}
