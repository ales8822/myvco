import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsApi } from '../lib/api';
import Sidebar from '../components/Sidebar';
import { useCompanyStore } from '../stores/companyStore';

const Settings = () => {
    const navigate = useNavigate();
    const { currentCompany } = useCompanyStore(); // Check if we are inside a company context
    
    const [geminiKey, setGeminiKey] = useState('');
    const [runpodUrl, setRunpodUrl] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        settingsApi.get()
            .then(res => {
                setGeminiKey(res.data.gemini_api_key || '');
                setRunpodUrl(res.data.runpod_url || '');
            })
            .catch(err => {
                console.error('Failed to load settings', err);
            });
    }, []);

    const handleSave = async () => {
        setStatus('Saving...');
        try {
            await settingsApi.update({ gemini_api_key: geminiKey, runpod_url: runpodUrl });
            setStatus('Settings saved successfully!');
            setTimeout(() => setStatus(''), 3000);
        } catch (e) {
            console.error(e);
            setStatus('Failed to save settings.');
        }
    };

    return (
        <div className="flex">
            {/* Only show Sidebar if a company is selected */}
            {currentCompany && <Sidebar />}
            
            {/* Adjust margin based on whether Sidebar is visible */}
            <div className={`${currentCompany ? 'ml-64' : 'max-w-3xl mx-auto'} flex-1 p-8 bg-gray-50 min-h-screen`}>
                
                {/* Back button if coming from Main Page */}
                {!currentCompany && (
                    <button 
                        onClick={() => navigate('/')}
                        className="mb-6 flex items-center text-gray-600 hover:text-primary-600 transition-colors"
                    >
                        <span className="mr-2">←</span> Back to Home
                    </button>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Settings</h2>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="geminiKey">
                                Google Gemini API Key
                            </label>
                            <input
                                id="geminiKey"
                                type="password"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                value={geminiKey}
                                onChange={e => setGeminiKey(e.target.value)}
                                placeholder="AIza..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Used for Gemini models.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="runpodUrl">
                                Ollama Base URL (RunPod or Local)
                            </label>
                            <input
                                id="runpodUrl"
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                value={runpodUrl}
                                onChange={e => setRunpodUrl(e.target.value)}
                                placeholder="https://your-pod-id.runpod.io or http://localhost:11434"
                            />
                            <p className="text-xs text-gray-500 mt-1">Used for Ollama models.</p>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <button
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                                onClick={handleSave}
                            >
                                Save Settings
                            </button>
                            {status && (
                                <span className={`text-sm ${status.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                                    {status}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;