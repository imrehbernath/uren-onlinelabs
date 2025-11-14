import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Invoices from './components/Invoices';
import Clients from './components/Clients';
import Prognose from './components/Prognose';
import Team from './components/Team';
import Login from './components/Login';
import { TimeTrackerProvider, useTimeTracker } from './hooks/useTimeTracker';
import { Page } from './types';

export const LOGO_SVG_BLUE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNTAiPjx0ZXh0IHg9IjEwMCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJNdW90bywgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzNjNmFiMiIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk9ubGluZUxhYnM8L3RleHQ+PC9zdmc+";

const LoadingScreen: React.FC = () => {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
            <img src={LOGO_SVG_BLUE} alt="OnlineLabs Logo" className="w-48 animate-pulse" />
            <p className="mt-4 text-gray-600">Gegevens laden...</p>
        </div>
    );
};

const ConfigErrorScreen: React.FC<{ message: string }> = ({ message }) => {
    const messageParts = message.split('\n\n');

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-red-50 p-4">
            <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-lg text-center">
                <img src={LOGO_SVG_BLUE} alt="OnlineLabs Logo" className="w-40 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-red-600 mb-2">Firebase Configuratie Fout</h1>
                <p className="text-gray-700 mb-6">De applicatie kan geen verbinding maken met de database.</p>
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 text-left rounded">
                    {messageParts.map((part, index) => (
                        <p key={index} className={index > 0 ? 'mt-4' : ''}>{part}</p>
                    ))}
                </div>
                <p className="mt-6 text-sm text-gray-500">
                    Dit probleem wordt meestal veroorzaakt door onjuiste configuratiegegevens.
                </p>
            </div>
        </div>
    );
};


const AppContent: React.FC = () => {
    const [activePage, setActivePage] = useState<Page>('Dashboard');
    const { currentUser } = useTimeTracker();

    useEffect(() => {
        // Redirect away from Projects page if the user is not Imre Bernáth (user-2)
        if (activePage === 'Projecten' && currentUser?.id !== 'user-2') {
            setActivePage('Dashboard');
        }
    }, [activePage, currentUser]);

    const renderPage = () => {
        switch (activePage) {
            case 'Projecten':
                // Extra check to prevent rendering the component while redirecting
                if (currentUser?.id !== 'user-2') return <Dashboard />;
                return <Projects />;
            case 'Facturen':
                return <Invoices />;
            case 'Klanten':
                return <Clients />;
            case 'Prognose':
                return <Prognose />;
            case 'Team':
                return <Team />;
            case 'Dashboard':
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
            <main className="flex-1 overflow-y-auto">
                <div className="p-4 sm:p-6 lg:p-8 h-full">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

const AuthGate: React.FC = () => {
    const { loading, isAuthenticated, configError } = useTimeTracker();

    console.log('AuthGate: Rendering with state:', { loading, isAuthenticated, configError: configError ? `"${configError.substring(0, 30)}..."` : null });

    if (configError) {
        console.log('AuthGate: Rendering ConfigErrorScreen.');
        return <ConfigErrorScreen message={configError} />;
    }

    if (loading) {
        console.log('AuthGate: Rendering LoadingScreen.');
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        console.log('AuthGate: Rendering Login screen.');
        return <Login />;
    }
    
    console.log('AuthGate: Rendering AppContent.');
    return <AppContent />;
};

const App: React.FC = () => {
  return (
    <TimeTrackerProvider>
        <AuthGate />
    </TimeTrackerProvider>
  );
};

export default App;