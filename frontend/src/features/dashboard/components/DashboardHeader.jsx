import Breadcrumbs from '../../../components/Breadcrumbs';

export default function DashboardHeader({ currentCompany }) {
    return (
        <>
            <Breadcrumbs items={[{ label: currentCompany?.name || 'Dashboard' }]} />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {currentCompany?.name}
                </h1>
                <p className="text-gray-600">{currentCompany?.description}</p>
            </div>
        </>
    );
}
