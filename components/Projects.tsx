
import React, { useState, useEffect, useMemo } from 'react';
import { useTimeTracker } from '../hooks/useTimeTracker';
import type { Project, Client, User } from '../types';

const cleanProjectName = (name: string) => name.replace(/^Werkzaamheden voor /, '');

const ProjectCard: React.FC<{ project: Project, client?: Client }> = ({ project, client }) => {
    const { users, currentUser, updateProject } = useTimeTracker();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // State to hold edits
    const [editedRate, setEditedRate] = useState(project.rate.toString());
    const [editedBudgets, setEditedBudgets] = useState<Record<string, string>>(() => {
        const initialMap: Record<string, string> = {};
        project.userBudgets?.forEach(b => {
            initialMap[b.userId] = String(b.hours);
        });
        return initialMap;
    });

    // Reset local state if the project prop changes (e.g., after saving or global refresh)
    // This ensures that if another user changes the data, our view updates, unless we are editing.
    useEffect(() => {
        if (!isEditing) {
            setEditedRate(project.rate.toString());
            const initialMap: Record<string, string> = {};
            project.userBudgets?.forEach(b => {
                initialMap[b.userId] = String(b.hours);
            });
            setEditedBudgets(initialMap);
        }
    }, [project, isEditing]);

    const isOwner = currentUser.id === 'user-2';
    const assignableUsers = users;

    const handleCancel = () => {
        // Reset state to original project values
        setEditedRate(project.rate.toString());
        const initialMap: Record<string, string> = {};
        project.userBudgets?.forEach(b => {
            initialMap[b.userId] = String(b.hours);
        });
        setEditedBudgets(initialMap);
        setIsEditing(false);
    };

    const handleSave = async () => {
        const newRate = parseFloat(editedRate);
        if (isNaN(newRate) || newRate < 0) {
            alert('Voer een geldig, niet-negatief uurtarief in.');
            return;
        }

        const newUserBudgets = Object.entries(editedBudgets)
            .map(([userId, hoursStr]) => ({ userId, hours: parseFloat(String(hoursStr)) }))
            .filter(b => !isNaN(b.hours) && b.hours > 0);

        const updates: Partial<Project> = {
            rate: newRate,
            userBudgets: newUserBudgets,
        };

        setIsSaving(true);
        try {
            await updateProject(project.id, updates);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save project:", error);
            alert("Opslaan mislukt. Controleer uw verbinding en probeer het opnieuw.");
        } finally {
            setIsSaving(false);
        }
    };

    const totalBudgetHours = useMemo(() => {
        if (isEditing) {
            // FIX: Explicitly type the 'sum' accumulator as a number to resolve a TypeScript type inference issue.
            return Object.values(editedBudgets).reduce((sum: number, hoursStr) => sum + (parseFloat(String(hoursStr)) || 0), 0);
        }
        return project.userBudgets?.reduce((sum, budget) => sum + budget.hours, 0) || 0;
    }, [isEditing, editedBudgets, project.userBudgets]);
    
    const displayRate = isEditing ? parseFloat(editedRate) || 0 : project.rate;
    const expectedRevenue = totalBudgetHours * displayRate;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col relative">
            {isOwner && !isEditing && (
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Bewerk project"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"></path></svg>
                </button>
            )}
            <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-800">{cleanProjectName(project.name)}</h3>
                 <p className="text-sm text-gray-500">{client?.name || 'Onbekende Klant'}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Uurtarief</span>
                        {isEditing ? (
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">€</span>
                                <input 
                                    type="number"
                                    value={editedRate}
                                    onChange={(e) => setEditedRate(e.target.value)}
                                    className="w-32 py-1 pl-6 pr-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-lg font-semibold text-primary-700"
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>
                        ) : (
                             <span className="text-lg font-semibold text-primary-700">€{project.rate.toFixed(2)}</span>
                        )}
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Totaal Urenbudget</span>
                        <span className="text-sm font-semibold text-gray-800">
                             {totalBudgetHours > 0 ? `${totalBudgetHours.toFixed(2)} uur` : 'N.v.t.'}
                        </span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Verwachte Omzet</span>
                        <span className="text-sm font-semibold text-gray-800">
                            {totalBudgetHours > 0 ? `€${expectedRevenue.toFixed(2)}` : 'N.v.t.'}
                        </span>
                    </div>
                </div>
                <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-600">Budgetten per collega</h4>
                     {isEditing ? (
                        assignableUsers.map(user => (
                            <div key={user.id} className="flex justify-between items-center text-sm">
                                <span>{user.name}</span>
                                 <input 
                                    type="number"
                                    value={editedBudgets[user.id] || ''}
                                    onChange={(e) => setEditedBudgets(prev => ({ ...prev, [user.id]: e.target.value }))}
                                    className="w-24 py-1 px-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                                    placeholder="Uren"
                                />
                            </div>
                        ))
                    ) : (
                        project.userBudgets && project.userBudgets.length > 0 ? (
                            project.userBudgets.map(budget => {
                                const user = users.find(u => u.id === budget.userId);
                                return (
                                    <div key={budget.userId} className="flex justify-between items-center text-sm">
                                        <span>{user?.name || 'Onbekende Gebruiker'}</span>
                                        <span className="font-mono">{budget.hours.toFixed(2)} uur</span>
                                    </div>
                                );
                            })
                        ) : (
                             <p className="text-xs text-gray-400">Geen budgetten ingesteld.</p>
                        )
                    )}
                </div>
                {isEditing && (
                    <div className="flex justify-end space-x-2 mt-6">
                        <button onClick={handleCancel} className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-300">Annuleren</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-3 py-1 bg-primary-500 text-white text-sm font-semibold rounded-md hover:bg-primary-600 disabled:bg-primary-300">
                            {isSaving ? 'Opslaan...' : 'Opslaan'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const AddProjectModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { clients, addProject } = useTimeTracker();
    const [name, setName] = useState('');
    const [clientId, setClientId] = useState('');
    const [rate, setRate] = useState('120');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (clients.length > 0 && !clientId) {
            setClientId(clients[0].id);
        }
    }, [clients, clientId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedRate = parseFloat(rate);
        if (name && clientId && !isNaN(parsedRate)) {
            setIsSaving(true);
            try {
                await addProject({
                    name: name,
                    clientId,
                    rate: parsedRate,
                    userBudgets: []
                });
                onClose();
            } catch (error) {
                console.error("Failed to add project:", error);
                alert("Project toevoegen mislukt.");
            } finally {
                setIsSaving(false);
            }
        } else {
            alert('Naam, klant en een geldig tarief zijn verplicht.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Nieuw Project</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">Projectnaam*</label>
                        <input type="text" id="projectName" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="client" className="block text-sm font-medium text-gray-700">Klant*</label>
                        <select id="client" value={clientId} onChange={e => setClientId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white">
                            <option value="" disabled>Selecteer een klant</option>
                            {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="rate" className="block text-sm font-medium text-gray-700">Uurtarief*</label>
                        <input type="number" id="rate" value={rate} onChange={e => setRate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" step="0.01" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-800 font-bold py-2 px-4 mr-2">Annuleren</button>
                        <button type="submit" disabled={isSaving} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:bg-primary-300">
                            {isSaving ? 'Opslaan...' : 'Project Opslaan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Projects: React.FC = () => {
    const { projects, clients, currentUser } = useTimeTracker();
    const [isAddingProject, setIsAddingProject] = useState(false);
    
    const isOwner = currentUser?.id === 'user-2';

    if (!isOwner) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h1 className="text-2xl font-bold text-gray-700">Geen Toegang</h1>
                <p className="text-gray-500 mt-2">U heeft geen rechten om deze pagina te bekijken.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Projecten</h1>
                <button 
                    onClick={() => setIsAddingProject(true)} 
                    className="px-5 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-75"
                >
                    Nieuw Project
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <ProjectCard 
                        key={project.id} 
                        project={project} 
                        client={clients.find(c => c.id === project.clientId)} 
                    />
                ))}
            </div>

            {projects.length === 0 && (
                 <div className="text-center py-20 bg-white rounded-lg shadow-md">
                     <h2 className="text-xl font-semibold text-gray-700">Nog geen projecten</h2>
                     <p className="text-gray-500 mt-2">Klik op 'Nieuw Project' om te beginnen.</p>
                 </div>
            )}

            {isAddingProject && <AddProjectModal onClose={() => setIsAddingProject(false)} />}
        </div>
    );
};

export default Projects;
