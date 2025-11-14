
import React, { useState, useMemo } from 'react';
import { useTimeTracker } from '../hooks/useTimeTracker';
import { TimeEntry } from '../types';

const StatCard: React.FC<{ title: string; value: string; subtext?: string }> = ({ title, value, subtext }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        {subtext && <p className="mt-1 text-sm text-gray-500">{subtext}</p>}
    </div>
);

const Prognose: React.FC = () => {
    const { clients, timeEntries, projects, users } = useTimeTracker();
    const [currentDate, setCurrentDate] = useState(new Date());

    const formatCurrency = (amount: number) => `€ ${amount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prognoseData = useMemo(() => {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        const allTimeEntries = timeEntries.filter(e => e.endTime);
        const uninvoicedTimeEntries = allTimeEntries.filter(e => !e.invoiced);
        
        // Revenue calculations
        const totalProjectBudgetRevenue = projects.reduce((total, project) => {
            const projectBudgetHours = project.userBudgets?.reduce((sum, budget) => sum + budget.hours, 0) || 0;
            return total + (projectBudgetHours * project.rate);
        }, 0);

        const calculateRevenue = (entries: TimeEntry[]): number => {
            return entries.reduce((total, entry) => {
                const project = projects.find(p => p.id === entry.projectId);
                if (project) {
                    const hours = entry.accumulatedDuration / 3600000;
                    return total + (hours * project.rate);
                }
                return total;
            }, 0);
        };

        const monthlyLoggedRevenue = calculateRevenue(
            allTimeEntries.filter(e => {
                const entryDate = new Date(e.startTime);
                return entryDate >= startOfMonth && entryDate <= endOfMonth;
            })
        );
        
        // Hour calculations
        const totalProjectBudgetHours = projects.reduce((total, project) => {
            const projectBudgetHours = project.userBudgets?.reduce((sum, budget) => sum + budget.hours, 0) || 0;
            return total + projectBudgetHours;
        }, 0);

        const totalLoggedUninvoicedHoursAllTime = uninvoicedTimeEntries.reduce((total, entry) => {
            const hours = entry.accumulatedDuration / 3600000;
            return total + hours;
        }, 0);
        
        const totalRemainingHours = totalProjectBudgetHours - totalLoggedUninvoicedHoursAllTime;
        
        // Per-user stats
        const userStats = users.map(user => {
            const userBudgetedHours = projects.reduce((total, project) => {
                const userBudget = project.userBudgets?.find(b => b.userId === user.id);
                return total + (userBudget?.hours || 0);
            }, 0);

            if (userBudgetedHours === 0) return null;

            const userLoggedUninvoicedHours = uninvoicedTimeEntries
                .filter(e => e.userId === user.id)
                .reduce((total, entry) => {
                    const hours = entry.accumulatedDuration / 3600000;
                    return total + hours;
                }, 0);
            
            const remainingHours = userBudgetedHours - userLoggedUninvoicedHours;
            const progress = userBudgetedHours > 0 ? (userLoggedUninvoicedHours / userBudgetedHours) * 100 : 0;

            return { user, budgetedHours: userBudgetedHours, loggedHours: userLoggedUninvoicedHours, remainingHours, progress };
        }).filter((u): u is NonNullable<typeof u> => u !== null);


        // Per-project stats
        const projectStats = projects
            .filter(project => project.userBudgets && project.userBudgets.length > 0)
            .map(project => {
                const totalBudgetHours = project.userBudgets!.reduce((sum, budget) => sum + budget.hours, 0);
                const totalBudgetValue = totalBudgetHours * project.rate;

                const loggedRevenueForProjectThisMonth = calculateRevenue(
                    allTimeEntries.filter(e => e.projectId === project.id && new Date(e.startTime) >= startOfMonth && new Date(e.startTime) <= endOfMonth)
                );
                
                const loggedRevenueForProjectAllTimeUninvoiced = calculateRevenue(
                    uninvoicedTimeEntries.filter(e => e.projectId === project.id)
                );

                const remainingRevenueOnProject = totalBudgetValue - loggedRevenueForProjectAllTimeUninvoiced;
                const progress = totalBudgetValue > 0 ? (loggedRevenueForProjectAllTimeUninvoiced / totalBudgetValue) * 100 : 0;
                const client = clients.find(c => c.id === project.clientId);

                return {
                    project, clientName: client?.name || 'Onbekende Klant',
                    totalBudgetValue, loggedRevenueForProjectThisMonth,
                    loggedRevenueForProjectAllTime: loggedRevenueForProjectAllTimeUninvoiced, 
                    remainingRevenueOnProject, progress
                };
            })
            .sort((a,b) => b.totalBudgetValue - a.totalBudgetValue);

        return {
            totalProjectBudgetRevenue, monthlyLoggedRevenue,
            totalProjectBudgetHours, totalRemainingHours,
            userStats, projectStats
        };

    }, [currentDate, clients, timeEntries, projects, users]);


    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Prognose</h1>
                <div className="flex items-center space-x-4 bg-white p-2 rounded-lg shadow-md">
                    <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-200" aria-label="Vorige maand">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <span className="text-xl font-semibold text-gray-700 w-48 text-center capitalize">
                        {currentDate.toLocaleString('nl-NL', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-200" aria-label="Volgende maand">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Prognose Totaal" 
                    value={formatCurrency(prognoseData.totalProjectBudgetRevenue)}
                    subtext="Totale waarde van gebudgetteerde projecten"
                />
                 <StatCard 
                    title="Realisatie (Deze Maand)" 
                    value={formatCurrency(prognoseData.monthlyLoggedRevenue)}
                    subtext="Omzet uit gelogde uren"
                />
                 <StatCard 
                    title="Totaal Gebudgetteerde Uren" 
                    value={`${prognoseData.totalProjectBudgetHours.toFixed(2)}`}
                    subtext="Totaal uren in alle projectbudgetten"
                />
                 <StatCard 
                    title="Totaal Resterende Uren" 
                    value={`${prognoseData.totalRemainingHours.toFixed(2)}`}
                    subtext={prognoseData.totalRemainingHours < 0 ? "Boven budget" : "Resterend budget over alle projecten"}
                />
            </div>

            <div className="bg-white rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold text-gray-700 p-4 border-b">Resterende Uren per Collega</h2>
                 <div className="p-4 space-y-5">
                    {prognoseData.userStats.length > 0 ? (
                        prognoseData.userStats.map(stat => (
                            <div key={stat.user.id}>
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <p className="font-semibold text-gray-800">{stat.user.name}</p>
                                    </div>
                                    <p className={`font-mono text-lg font-semibold ${stat.remainingHours < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                        {stat.remainingHours.toFixed(2)} uur open
                                    </p>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className={`h-2.5 rounded-full ${stat.progress > 100 ? 'bg-red-500' : 'bg-primary-500'}`} style={{ width: `${Math.min(stat.progress, 100)}%` }}></div>
                                </div>
                                <div className="text-right text-xs text-gray-500 mt-1 font-mono">
                                    {stat.loggedHours.toFixed(2)} / {stat.budgetedHours.toFixed(2)} uur
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-10 text-gray-500">Er zijn geen urenbudgetten per collega ingesteld.</p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 p-4 border-b">Prognose per Project</h2>
                 <div className="p-4 space-y-5">
                    {prognoseData.projectStats.length > 0 ? (
                        prognoseData.projectStats.map(stat => (
                            <div key={stat.project.id}>
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <p className="font-semibold text-gray-800">{stat.project.name}</p>
                                        <p className="text-sm text-primary-500">Realisatie (deze maand): {formatCurrency(stat.loggedRevenueForProjectThisMonth)}</p>
                                    </div>
                                    <p className={`font-mono text-lg font-semibold ${stat.remainingRevenueOnProject < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                        {formatCurrency(stat.remainingRevenueOnProject)} open
                                    </p>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className={`h-2.5 rounded-full ${stat.progress > 100 ? 'bg-red-500' : 'bg-primary-500'}`} style={{ width: `${Math.min(stat.progress, 100)}%` }}></div>
                                </div>
                                <div className="text-right text-xs text-gray-500 mt-1 font-mono">
                                    {formatCurrency(stat.loggedRevenueForProjectAllTime)} / {formatCurrency(stat.totalBudgetValue)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-10 text-gray-500">Er zijn geen projecten met urenbudgetten ingesteld.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Prognose;
