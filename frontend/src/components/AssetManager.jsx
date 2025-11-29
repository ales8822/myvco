import { useState, useEffect } from 'react';
import { assetsApi } from '../lib/api';

export default function AssetManager({ companyId }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [newAsset, setNewAsset] = useState({
        asset_name: '',
        display_name: '',
        description: '',
        file: null
    });

    useEffect(() => {
        if (companyId) {
            loadAssets();
        }
    }, [companyId]);

    const loadAssets = async () => {
        setLoading(true);
        try {
            const response = await assetsApi.list(companyId);
            setAssets(response.data);
        } catch (error) {
            console.error('Error loading assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Auto-generate snake_case name from filename if empty
            if (!newAsset.asset_name) {
                const name = file.name.split('.')[0]
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '_');
                setNewAsset(prev => ({ ...prev, file, asset_name: name }));
            } else {
                setNewAsset(prev => ({ ...prev, file }));
            }
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!newAsset.file || !newAsset.asset_name) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('asset_name', newAsset.asset_name);
        formData.append('display_name', newAsset.display_name || newAsset.asset_name);
        formData.append('description', newAsset.description || '');
        formData.append('file', newAsset.file);
        formData.append('asset_type', newAsset.file.type.startsWith('image/') ? 'image' : 'document');

        try {
            await assetsApi.create(companyId, formData);
            await loadAssets();
            setShowUpload(false);
            setNewAsset({ asset_name: '', display_name: '', description: '', file: null });
        } catch (error) {
            console.error('Error uploading asset:', error);
            alert(error.response?.data?.detail || 'Failed to upload asset');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (assetId) => {
        if (!window.confirm('Are you sure you want to delete this asset?')) return;
        try {
            await assetsApi.delete(companyId, assetId);
            setAssets(prev => prev.filter(a => a.id !== assetId));
        } catch (error) {
            console.error('Error deleting asset:', error);
            alert('Failed to delete asset');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Company Assets Library</h2>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="btn-primary"
                >
                    {showUpload ? 'Cancel' : '+ New Asset'}
                </button>
            </div>

            {showUpload && (
                <div className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Upload New Asset</h3>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Asset Name (@name)</label>
                                <div className="flex items-center">
                                    <span className="text-gray-500 mr-1">@</span>
                                    <input
                                        type="text"
                                        className="input"
                                        value={newAsset.asset_name}
                                        onChange={e => setNewAsset({ ...newAsset, asset_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                        placeholder="logo_main"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Lowercase, numbers, underscores only.</p>
                            </div>
                            <div>
                                <label className="label">Display Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newAsset.display_name}
                                    onChange={e => setNewAsset({ ...newAsset, display_name: e.target.value })}
                                    placeholder="Main Logo"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">Description</label>
                            <textarea
                                className="input"
                                value={newAsset.description}
                                onChange={e => setNewAsset({ ...newAsset, description: e.target.value })}
                                placeholder="Context for the LLM about this asset..."
                                rows="2"
                            />
                        </div>
                        <div>
                            <label className="label">File</label>
                            <input
                                type="file"
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                onChange={handleFileChange}
                                required
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={uploading || !newAsset.file}
                            >
                                {uploading ? 'Uploading...' : 'Upload Asset'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">Loading assets...</div>
            ) : assets.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">No assets found. Upload assets to reference them in meetings.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assets.map(asset => (
                        <div key={asset.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                                        @{asset.asset_name}
                                    </span>
                                    <span className="text-xs text-gray-500 uppercase">{asset.asset_type}</span>
                                </div>
                                <button
                                    onClick={() => handleDelete(asset.id)}
                                    className="text-gray-400 hover:text-red-500"
                                    title="Delete asset"
                                >
                                    🗑️
                                </button>
                            </div>

                            <div className="aspect-video bg-gray-100 rounded-md mb-3 overflow-hidden flex items-center justify-center border border-gray-100">
                                {asset.asset_type === 'image' ? (
                                    <img
                                        src={`http://localhost:8001/${asset.file_path}`}
                                        alt={asset.display_name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <span className="text-4xl">📄</span>
                                )}
                            </div>

                            <h4 className="font-medium text-gray-900 truncate">{asset.display_name}</h4>
                            {asset.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{asset.description}</p>
                            )}
                            <div className="mt-3 text-xs text-gray-400">
                                {(asset.file_size / 1024).toFixed(1)} KB • {new Date(asset.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
