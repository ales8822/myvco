import { useState, useEffect } from 'react';
import { meetingsApi } from '../lib/api';

export default function ImageSidebarPanel({ meetingId, isActive, refreshTrigger }) {
    const [images, setImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);

    useEffect(() => {
        if (meetingId) {
            loadImages();
        }
    }, [meetingId, refreshTrigger]); // Added refreshTrigger

    const loadImages = async () => {
        try {
            const response = await meetingsApi.getImages(meetingId);
            setImages(response.data);
            if (response.data.length > 0 && currentImageIndex >= response.data.length) {
                setCurrentImageIndex(response.data.length - 1);
            }
        } catch (error) {
            console.error('Error loading images:', error);
        }
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);

        try {
            // Upload each image
            for (const file of files) {
                const reader = new FileReader();
                await new Promise((resolve, reject) => {
                    reader.onloadend = async () => {
                        try {
                            await meetingsApi.uploadImage(meetingId, {
                                image_data: reader.result,
                                description: file.name
                            });
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

            // Reload images
            await loadImages();
            setShowUpload(false);
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    const currentImage = images[currentImageIndex];

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Current Image</h3>
                {isActive && (
                    <button
                        onClick={() => setShowUpload(!showUpload)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                    >
                        {showUpload ? 'Cancel' : '+ Upload'}
                    </button>
                )}
            </div>

            {showUpload && (
                <div className="mb-4">
                    <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                        <div className="text-center">
                            <span className="text-2xl mb-1 block">🖼️</span>
                            <span className="text-xs text-gray-600">
                                {uploading ? 'Uploading...' : 'Click or drop images'}
                            </span>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            disabled={uploading}
                        />
                    </label>
                </div>
            )}

            {images.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                    No images uploaded yet
                </div>
            ) : (
                <>
                    {/* Current Image Display */}
                    <div className="mb-4">
                        <img
                            src={`http://localhost:8001${currentImage.image_url}`}
                            alt={currentImage.description || 'Meeting image'}
                            className="w-full rounded-lg border border-gray-200"
                        />
                        {currentImage.description && (
                            <p className="text-sm text-gray-600 mt-2">
                                {currentImage.description}
                            </p>
                        )}
                    </div>

                    {/* Image Navigation */}
                    {images.length > 1 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Image {currentImageIndex + 1} of {images.length}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                                        disabled={currentImageIndex === 0}
                                        className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ←
                                    </button>
                                    <button
                                        onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                                        disabled={currentImageIndex === images.length - 1}
                                        className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        →
                                    </button>
                                </div>
                            </div>

                            {/* Thumbnail Strip */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {images.map((img, idx) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${idx === currentImageIndex
                                            ? 'border-primary-500'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={`http://localhost:8001${img.image_url}`}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                        💡 All agents can see this image and will reference it in their responses
                    </div>
                </>
            )}
        </div>
    );
}