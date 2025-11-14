

import React from 'react';
import type { Page, User } from '../types';
import { useTimeTracker } from '../hooks/useTimeTracker';

const LOGO_SVG_WHITE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNTAiPjx0ZXh0IHg9IjEwMCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJNdW90bywgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5PbmxpbmVMYWJzPC90ZXh0Pjwvc3ZnPg==";

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: Page;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors duration-150 ${
      isActive
        ? 'text-white bg-primary-500'
        : 'text-gray-300 hover:text-white hover:bg-primary-600'
    }`}
  >
    {icon}
    <span className="ml-4">{label}</span>
  </button>
);


const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const { currentUser, logout } = useTimeTracker();

  const allNavItems: { label: Page; icon: React.ReactNode }[] = [
    {
      label: 'Dashboard',
      icon: <DashboardIcon />,
    },
    {
      label: 'Klanten',
      icon: <ClientsIcon />,
    },
    {
      label: 'Projecten',
      // FIX: Added missing icon component
      icon: <ProjectsIcon />,
    },
    {
      label: 'Facturen',
      // FIX: Added missing icon component
      icon: <InvoicesIcon />,
    },
    {
      label: 'Prognose',
      // FIX: Added missing icon component
      icon: <PrognoseIcon />,
    },
    {
      label: 'Team',
      // FIX: Added missing icon component
      icon: <TeamIcon />,
    }
  ];

  const navItems = allNavItems.filter(item => {
    if (item.label === 'Projecten') {
        // Only show 'Projecten' for Imre Bernáth (user-2)
        return currentUser?.id === 'user-2';
    }
    return true;
  });

  return (
    <aside className="z-20 hidden w-64 overflow-y-auto bg-primary-800 md:block flex-shrink-0">
      <div className="py-4 text-gray-400 flex flex-col h-full">
        <a className="ml-6 text-lg font-bold text-white flex items-center" href="#">
            <img src={LOGO_SVG_WHITE} alt="OnlineLabs Logo" className="w-44 mr-2" />
        </a>
        <ul className="mt-6">
          {navItems.map(item => (
            <li className="relative" key={item.label}>
              {activePage === item.label && (
                <span className="absolute inset-y-0 left-0 w-1 bg-primary-500 rounded-tr-lg rounded-br-lg" aria-hidden="true"></span>
              )}
              <NavItem
                label={item.label}
                icon={item.icon}
                isActive={activePage === item.label}
                onClick={() => setActivePage(item.label)}
              />
            </li>
          ))}
        </ul>
        <div className="mt-auto p-4 border-t border-primary-700">
             <div className="flex items-center">
                 <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                        {currentUser?.name.charAt(0)}
                    </div>
                </div>
                <div className="ml-3">
                    <p className="font-semibold text-white text-sm">{currentUser?.name}</p>
                    <p className="text-xs text-gray-400">{currentUser?.email}</p>
                </div>
            </div>
             <button 
                onClick={logout}
                className="w-full mt-4 py-2 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-800 focus:ring-white"
             >
                Uitloggen
             </button>
        </div>
      </div>
    </aside>
  );
};

// SVG Icons
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
);
const ClientsIcon = () => (
    // FIX: Replaced incomplete SVG path with a valid one.
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-1.781-4.121M12 11c-3.314 0-6 2.686-6 6v1a1 1 0 001 1h10a1 1 0 001-1v-1c0-3.314-2.686-6-6-6z"></path></svg>
);
// FIX: Added missing icon components.
const ProjectsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
);
const InvoicesIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
);
const PrognoseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
);
const TeamIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-1.657-1.343-3-3-3h-2c-1.657 0-3 1.343-3 3v2M7 20H2v-2a3 3 0 013-3h2a3 3 0 013 3v2m0-10a3 3 0 10-6 0 3 3 0 006 0z"></path></svg>
);
// FIX: Added default export to fix import error in App.tsx.
export default Sidebar;