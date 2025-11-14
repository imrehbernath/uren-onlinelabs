
import React, { useState, useMemo } from 'react';
import { useTimeTracker } from '../hooks/useTimeTracker';
import type { User } from '../types';

// Modal component for adding/editing users
const UserModal: React.FC<{
    user?: User;
    onClose: () => void;
}> = ({ user, onClose }) => {
    const { addUser, updateUser } = useTimeTracker();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [monthlyHourGoal, setMonthlyHourGoal] = useState(user?.monthlyHourGoal?.toString() || '');
    const [isSaving, setIsSaving] = useState(false);

    const isEditing = !!user;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) {
            alert('Naam en e-mail zijn verplicht.');
            return;
        }

        setIsSaving(true);
        try {
            const goal = monthlyHourGoal ? parseFloat(monthlyHourGoal) : undefined;
            const userData = { name, email, monthlyHourGoal: goal };

            if (isEditing) {
                await updateUser({ ...user, ...userData });
            } else {
                await addUser(userData);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save user:", error);
            alert("Opslaan van collega mislukt.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    {isEditing ? 'Collega Bewerken' : 'Nieuwe Collega'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="userName" className="block text-sm font-medium text-gray-700">Naam*</label>
                        <input type="text" id="userName" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700">E-mail*</label>
                        <input type="email" id="userEmail" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="monthlyHourGoal" className="block text-sm font-medium text-gray-700">Maandelijks Urendoel (optioneel)</label>
                        <input type="number" id="monthlyHourGoal" value={monthlyHourGoal} onChange={e => setMonthlyHourGoal(e.target.value)} placeholder="bv. 160" min="0" step="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-800 font-bold py-2 px-4 mr-2">Annuleren</button>
                        <button type="submit" disabled={isSaving} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:bg-primary-300">
                            {isSaving ? 'Opslaan...' : (isEditing ? 'Opslaan' : 'Toevoegen')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EmployeeMonthlyGoals: React.FC = () => {
    const { users, timeEntries } = useTimeTracker();

    const monthlyStats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const relevantEntries = timeEntries.filter(e => {
            const entryDate = e.startTime;
            return entryDate >= startOfMonth && entryDate <= endOfMonth && e.endTime;
        });

        return users.map(user => {
            if (!user.monthlyHourGoal) {
                return { user, loggedHours: 0, remainingHours: 0, progress: 0, hasGoal: false };
            }

            const userEntries = relevantEntries.filter(e => e.userId === user.id);
            const loggedHours = userEntries.reduce((acc, e) => acc + (e.accumulatedDuration / 3600000), 0);
            const remainingHours = user.monthlyHourGoal - loggedHours;
            const progress = user.monthlyHourGoal > 0 ? (loggedHours / user.monthlyHourGoal) * 100 : 0;

            return { user, loggedHours, remainingHours, progress, hasGoal: true };
        });

    }, [users, timeEntries]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Maandelijkse Uren (Teamoverzicht)</h2>
            <div className="space-y-4">
                {monthlyStats.filter(s => s.hasGoal).map(stat => (
                    <div key={stat.user.id}>
                        <div className="flex justify-between items-center mb-1 text-sm">
                            <p className="font-semibold text-gray-700">{stat.user.name}</p>
                            <p className={`font-mono ${stat.remainingHours < 0 ? 'text-red-600 font-bold' : 'text-primary-700'}`}>
                                {stat.remainingHours > 0 ? `${stat.remainingHours.toFixed(2)} uur te gaan` : `${Math.abs(stat.remainingHours).toFixed(2)} uur over`}
                            </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${Math.min(stat.progress, 100)}%` }}></div>
                        </div>
                        <div className="text-right text-xs text-gray-500 mt-1 font-mono">
                            {stat.loggedHours.toFixed(2)} / {stat.user.monthlyHourGoal!.toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Main component for the Team page
const Team: React.FC = () => {
    const { users, deleteUser, resetAllTimeEntries } = useTimeTracker();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

    const handleOpenModal = (user?: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingUser(undefined);
        setIsModalOpen(false);
    };
    
    const handleResetTimeEntries = () => {
        const confirmation = window.confirm(
            "WAARSCHUWING!\n\nU staat op het punt om ALLE urenboekingen in de hele applicatie permanent te verwijderen.\n\nDit kan niet ongedaan worden gemaakt.\n\nWeet u zeker dat u wilt doorgaan?"
        );
        if (confirmation) {
            resetAllTimeEntries();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Team</h1>
                <div className="flex items-center space-x-2">
                    <button onClick={handleResetTimeEntries} className="px-5 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75">
                        Reset Urenregistraties
                    </button>
                    <button onClick={() => handleOpenModal()} className="px-5 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-75">
                        Nieuwe Collega
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Naam</th>
                                <th scope="col" className="px-6 py-3">E-mail</th>
                                <th scope="col" className="px-6 py-3">Maanddoel</th>
                                <th scope="col" className="px-6 py-3 text-right">Acties</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">{user.monthlyHourGoal ? `${user.monthlyHourGoal} uur` : '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center space-x-2">
                                            <button onClick={() => handleOpenModal(user)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-md" aria-label={`Bewerk ${user.name}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"></path></svg>
                                            </button>
                                            <button onClick={() => deleteUser(user.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md" aria-label={`Verwijder ${user.name}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <EmployeeMonthlyGoals />

            {isModalOpen && <UserModal user={editingUser} onClose={handleCloseModal} />}
        </div>
    );
};

export default Team;
