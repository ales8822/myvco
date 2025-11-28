import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useCompanyStore } from './stores/companyStore';
import CompanySelector from './pages/CompanySelector';
import CompanyDashboard from './pages/CompanyDashboard';
import StaffManagement from './pages/StaffManagement';
import MeetingRoom from './pages/MeetingRoom';
import KnowledgeBase from './pages/KnowledgeBase';
import Settings from './pages/Settings';

function App() {
    const { currentCompany } = useCompanyStore();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<CompanySelector />} />
                <Route
                    path="/dashboard"
                    element={currentCompany ? <CompanyDashboard /> : <Navigate to="/" />}
                />
                <Route
                    path="/staff"
                    element={currentCompany ? <StaffManagement /> : <Navigate to="/" />}
                />
                <Route
                    path="/meeting/:meetingId"
                    element={currentCompany ? <MeetingRoom /> : <Navigate to="/" />}
                />
                <Route
                    path="/knowledge"
                    element={currentCompany ? <KnowledgeBase /> : <Navigate to="/" />}
                />
                <Route 
                    path="/settings" 
                    element={currentCompany ? <Settings /> : <Navigate to="/" />} 
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;