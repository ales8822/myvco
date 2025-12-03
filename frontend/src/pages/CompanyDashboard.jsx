import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AssetManager from '../components/AssetManager';

// Features
import DashboardHeader from '../features/dashboard/components/DashboardHeader';
import DashboardStats from '../features/dashboard/components/DashboardStats';
import DepartmentStaffList from '../features/dashboard/components/DepartmentStaffList';
import FiredStaffPanel from '../features/dashboard/components/FiredStaffPanel';
import ActiveMeetingsList from '../features/dashboard/components/ActiveMeetingsList';
import RecentMeetingsList from '../features/dashboard/components/RecentMeetingsList';
import CreateMeetingModal from '../features/dashboard/components/CreateMeetingModal';
import EditStaffModal from '../features/dashboard/components/EditStaffModal';
import FireStaffModal from '../features/dashboard/components/FireStaffModal';
import RestoreStaffModal from '../features/dashboard/components/RestoreStaffModal';
import FiredStaffDetailsModal from '../features/dashboard/components/FiredStaffDetailsModal';

// Hooks
import { useDashboardData } from '../features/dashboard/hooks/useDashboardData';
import { useStaffManagement } from '../features/dashboard/hooks/useStaffManagement';
import { useMeetingManagement } from '../features/dashboard/hooks/useMeetingManagement';
import { useStaffStore } from '../stores/staffStore';
import { useMeetingStore } from '../stores/meetingStore';
import { useDepartmentStore } from '../stores/departmentStore';

export default function CompanyDashboard() {
    const navigate = useNavigate();

    // Hooks
    const { libraryItems, providers, currentCompany } = useDashboardData();
    const staffManagement = useStaffManagement(currentCompany);
    const meetingManagement = useMeetingManagement(currentCompany);

    // Stores
    const { staff, firedStaff } = useStaffStore();
    const { meetings } = useMeetingStore();
    const { departments } = useDepartmentStore();

    // Local State
    const [selectedTab, setSelectedTab] = useState('overview');

    // Derived State
    const activeMeetings = meetings.filter((m) => m.status === 'active');
    const pastMeetings = meetings.filter((m) => m.status === 'ended');

    return (
        <div className="flex">
            <Sidebar />
            <div className="ml-64 flex-1 p-8 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <DashboardHeader currentCompany={currentCompany} />

                    <DashboardStats
                        departments={departments}
                        firedStaff={firedStaff}
                        activeMeetings={activeMeetings}
                        meetings={meetings}
                        setShowFiredStaff={staffManagement.setShowFiredStaff}
                        showFiredStaff={staffManagement.showFiredStaff}
                    />

                    {/* Department/Staff View */}
                    <DepartmentStaffList
                        selectedDepartment={staffManagement.selectedDepartment}
                        departmentStaff={staffManagement.departmentStaff}
                        currentCompany={currentCompany}
                        handleBackToDepartments={staffManagement.handleBackToDepartments}
                        handleEditStaff={staffManagement.handleEditStaff}
                        handleFireClick={staffManagement.handleFireClick}
                        handleDepartmentClick={staffManagement.handleDepartmentClick}
                    />

                    {/* Fired Staff Panel */}
                    {staffManagement.showFiredStaff && (
                        <FiredStaffPanel
                            firedStaff={firedStaff}
                            handleFiredStaffClick={staffManagement.handleFiredStaffClick}
                            handleRestoreClick={staffManagement.handleRestoreClick}
                        />
                    )}

                    {/* Quick Actions */}
                    <div className="card mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="flex gap-4">
                            <button onClick={() => navigate('/staff')} className="btn-primary">👥 Hire Staff</button>
                            <button onClick={() => meetingManagement.setShowMeetingModal(true)} className="btn-primary">💬 Start Meeting</button>
                            <button onClick={() => navigate('/knowledge')} className="btn-secondary">📚 Add Knowledge</button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setSelectedTab('overview')}
                                className={`${selectedTab === 'overview'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setSelectedTab('assets')}
                                className={`${selectedTab === 'assets'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Company Assets
                            </button>
                        </nav>
                    </div>

                    {selectedTab === 'assets' ? (
                        <AssetManager companyId={currentCompany?.id} />
                    ) : (
                        <>
                            <ActiveMeetingsList
                                activeMeetings={activeMeetings}
                                navigate={navigate}
                                handleDeleteMeeting={meetingManagement.handleDeleteMeeting}
                            />

                            <RecentMeetingsList
                                pastMeetings={pastMeetings}
                                navigate={navigate}
                                handleDeleteMeeting={meetingManagement.handleDeleteMeeting}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            <CreateMeetingModal
                showMeetingModal={meetingManagement.showMeetingModal}
                setShowMeetingModal={meetingManagement.setShowMeetingModal}
                handleCreateMeeting={meetingManagement.handleCreateMeeting}
                meetingForm={meetingManagement.meetingForm}
                setMeetingForm={meetingManagement.setMeetingForm}
                staff={staff}
                handleParticipantToggle={meetingManagement.handleParticipantToggle}
                updateParticipantConfig={meetingManagement.updateParticipantConfig}
                providers={providers}
            />

            <EditStaffModal
                showEditModal={staffManagement.showEditModal}
                setShowEditModal={staffManagement.setShowEditModal}
                handleUpdateStaff={staffManagement.handleUpdateStaff}
                editForm={staffManagement.editForm}
                handleInputChange={staffManagement.handleInputChange}
                departments={departments}
                activeDropdown={staffManagement.activeDropdown}
                setActiveDropdown={staffManagement.setActiveDropdown}
                insertTag={staffManagement.insertTag}
                libraryItems={libraryItems}
                setEditingStaff={staffManagement.setEditingStaff}
            />

            <FireStaffModal
                showFireModal={staffManagement.showFireModal}
                setShowFireModal={staffManagement.setShowFireModal}
                staffToFire={staffManagement.staffToFire}
                setStaffToFire={staffManagement.setStaffToFire}
                fireReason={staffManagement.fireReason}
                setFireReason={staffManagement.setFireReason}
                handleConfirmFire={staffManagement.handleConfirmFire}
            />

            <RestoreStaffModal
                showRestoreModal={staffManagement.showRestoreModal}
                setShowRestoreModal={staffManagement.setShowRestoreModal}
                handleConfirmRestore={staffManagement.handleConfirmRestore}
                restoreData={staffManagement.restoreData}
                setRestoreData={staffManagement.setRestoreData}
                departments={departments}
                setStaffToRestore={staffManagement.setStaffToRestore}
            />

            <FiredStaffDetailsModal
                showFiredDetailsModal={staffManagement.showFiredDetailsModal}
                selectedFiredStaff={staffManagement.selectedFiredStaff}
                setShowFiredDetailsModal={staffManagement.setShowFiredDetailsModal}
                handleRestoreClick={staffManagement.handleRestoreClick}
            />
        </div>
    );
}