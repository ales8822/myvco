import React, { useEffect } from 'react';
import { useStaffStore } from '../../../stores/staffStore';

export default function HireFromPoolModal({ show, onClose, companyId }) {
    const { globalStaff, fetchGlobalStaff, assignStaff, loading } = useStaffStore();

    useEffect(() => {
        if (show) {
            fetchGlobalStaff();
        }
    }, [show, fetchGlobalStaff]);

    if (!show) return null;

    const handleHire = async (staffId) => {
        await assignStaff(staffId, companyId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Hire from Agent Pool</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-10">Loading agents...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {globalStaff.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                No agents available in the pool. Create some in the Agent Factory!
                            </div>
                        ) : (
                            globalStaff.map((agent) => {
                                const isHiredByThisCompany = agent.companies?.some(c => c.id === companyId);
                                const otherCompanies = agent.companies?.filter(c => c.id !== companyId) || [];
                                
                                return (
                                    <div key={agent.id} className="border border-gray-100 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900">{agent.name}</h3>
                                                {isHiredByThisCompany && (
                                                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                                                        Already Hired
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-primary-600 text-sm">{agent.role}</p>
                                            {otherCompanies.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Also working for:</span>
                                                    {otherCompanies.map(c => (
                                                        <span key={c.id} className="bg-gray-50 text-gray-500 text-[9px] px-1.5 py-0.5 rounded">
                                                            {c.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => !isHiredByThisCompany && handleHire(agent.id)}
                                            disabled={isHiredByThisCompany}
                                            className={`${
                                                isHiredByThisCompany 
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                                : "bg-primary-600 hover:bg-primary-700 text-white"
                                            } px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-4 whitespace-nowrap`}
                                        >
                                            {isHiredByThisCompany ? 'Hired' : 'Hire Agent'}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:bg-gray-50 border border-gray-200 px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
