
import React, { useState, useEffect, useMemo } from 'react';
import { useTimeTracker } from '../hooks/useTimeTracker';
import { TimeEntry, Project } from '../types';

const cleanProjectName = (name: string) => name.replace(/^Werkzaamheden voor /, '');

const Timer: React.FC<{ entry: TimeEntry }> = ({ entry }) => {
    const getDuration = () => {
        if (entry.isPaused || entry.endTime) {
            return entry.accumulatedDuration;
        }
        return entry.accumulatedDuration + (new Date().getTime() - new Date(entry.lastStartTime).getTime());
    };

    const [duration, setDuration] = useState(getDuration());
  
    useEffect(() => {
        if (entry.isPaused || entry.endTime) {
            setDuration(getDuration()); // Set final duration if paused or stopped
            return;
        }
        const interval = setInterval(() => {
            setDuration(getDuration());
        }, 1000);
        return () => clearInterval(interval);
    }, [entry]);
  
    const formatDuration = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    };
  
    return <span className="font-mono text-lg">{formatDuration(duration)}</span>;
};

const ActiveTimerCard: React.FC<{ entry: TimeEntry }> = ({ entry }) => {
    const { projects, stopTimer, pauseTimer, resumeTimer } = useTimeTracker();
    const project = projects.find(p => p.id === entry.projectId);

    return (
        <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
            <div>
                <p className="font-semibold text-gray-800">{entry.description}</p>
                <p className="text-sm text-primary-500">{cleanProjectName(project?.name || 'Onbekend')}</p>
            </div>
            <div className="flex items-center space-x-2">
                <Timer entry={entry} />
                {entry.isPaused ? (
                    <>
                        <button onClick={() => resumeTimer(entry.id)} className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400">Hervatten</button>
                        <button onClick={() => stopTimer(entry.id)} className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400">Stop</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => pauseTimer(entry.id)} className="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400">Pauze</button>
                        <button onClick={() => stopTimer(entry.id)} className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400">Stop</button>
                    </>
                )}
            </div>
        </div>
    );
};

const TimeEntryRow: React.FC<{ entry: TimeEntry; project?: Project }> = ({ entry, project: initialProject }) => {
    const { projects, updateTimeEntry, deleteTimeEntry, startTimer } = useTimeTracker();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [editedDescription, setEditedDescription] = useState(entry.description);
    const [editedProjectId, setEditedProjectId] = useState(entry.projectId);
    
    const getDurationHours = (entry: TimeEntry): string => {
        if (!entry.endTime) return '0';
        return (entry.accumulatedDuration / 3600000).toFixed(2);
    };

    const [editedDate, setEditedDate] = useState(entry.startTime.toISOString().split('T')[0]);
    const [editedDuration, setEditedDuration] = useState(getDurationHours(entry));

    const project = isEditing ? projects.find(p => p.id === editedProjectId) : initialProject;
    
    useEffect(() => {
        if (!isEditing) {
            setEditedDescription(entry.description);
            setEditedProjectId(entry.projectId);
            setEditedDate(entry.startTime.toISOString().split('T')[0]);
            setEditedDuration(getDurationHours(entry));
        }
    }, [entry, isEditing]);

    const handleSave = async () => {
        const durationHours = parseFloat(editedDuration);
        if (isNaN(durationHours) || durationHours < 0) {
            alert('Voer een geldige duur in.');
            return;
        }
        
        setIsSaving(true);
        try {
            const [year, month, day] = editedDate.split('-').map(Number);
            const dateChanged = entry.startTime.toISOString().split('T')[0] !== editedDate;

            let newStartTime = new Date(entry.startTime);
            let newEndTime = entry.endTime ? new Date(entry.endTime) : null;

            if (dateChanged) {
                newStartTime.setFullYear(year, month - 1, day);
                if (newEndTime) {
                    newEndTime = new Date(newStartTime.getTime() + entry.accumulatedDuration);
                }
            }

            const updates: Partial<Omit<TimeEntry, 'id'>> = {
                description: editedDescription,
                projectId: editedProjectId,
                startTime: newStartTime,
                endTime: newEndTime,
                accumulatedDuration: durationHours * 3600 * 1000,
            };

            await updateTimeEntry(entry.id, updates);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update time entry:", error);
            alert("Opslaan van boeking mislukt.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditedDescription(entry.description);
        setEditedProjectId(entry.projectId);
        setEditedDate(entry.startTime.toISOString().split('T')[0]);
        setEditedDuration(getDurationHours(entry));
        setIsEditing(false);
    };

    const formatTime = (date: Date) => date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    const getDuration = () => {
        if (!entry.endTime) return 'Lopend';
        const hours = (entry.accumulatedDuration / 3600000).toFixed(2);
        return `${hours} uur`;
    }
    
    if (isEditing) {
        return (
            <div className="p-4 bg-primary-50 border-b border-primary-200 space-y-3">
                <textarea 
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm !bg-white !text-gray-900"
                    rows={2}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={editedProjectId} onChange={(e) => setEditedProjectId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md !bg-white text-sm !text-gray-900">
                        {projects.map(p => <option key={p.id} value={p.id}>{cleanProjectName(p.name)}</option>)}
                    </select>
                     <div className="flex items-center space-x-2">
                        <input type="date" value={editedDate} onChange={e => setEditedDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm !bg-white !text-gray-900" />
                        <input type="number" value={editedDuration} onChange={e => setEditedDuration(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm !bg-white !text-gray-900" placeholder="Duur (uren)" step="0.01" min="0"/>
                    </div>
                </div>
                <div className="flex justify-end space-x-2">
                    <button onClick={handleCancel} className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-300">Annuleren</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-3 py-1 bg-primary-500 text-white text-sm font-semibold rounded-md hover:bg-primary-600 disabled:bg-primary-300">
                        {isSaving ? 'Opslaan...' : 'Opslaan'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between p-4 bg-white group">
            <div>
                <p className="font-semibold text-gray-800">{entry.description}</p>
                <p className="text-sm text-primary-500">{cleanProjectName(project?.name || 'Onbekend Project')}</p>
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-right">
                    <p className="font-mono text-lg font-semibold text-gray-800">{getDuration()}</p>
                    <p className="text-sm text-gray-500">{formatTime(new Date(entry.startTime))} - {entry.endTime ? formatTime(new Date(entry.endTime)) : ''}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                     <button onClick={() => startTimer(entry.projectId, entry.description)} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md" title="Herstarten">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </button>
                     <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-md">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={() => deleteTimeEntry(entry.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
);

const UserHoursGoalCard: React.FC = () => {
    const { currentUser, timeEntries } = useTimeTracker();

    const stats = useMemo(() => {
        if (!currentUser?.monthlyHourGoal) {
            return { hasGoal: false, loggedHours: 0, goal: 0, remaining: 0, progress: 0 };
        }
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const loggedHours = timeEntries
            .filter(e => e.userId === currentUser.id && e.endTime && new Date(e.startTime) >= startOfMonth && new Date(e.startTime) <= endOfMonth)
            .reduce((acc, e) => acc + (e.accumulatedDuration / 3600000), 0);
        
        const goal = currentUser.monthlyHourGoal;
        const remaining = goal - loggedHours;
        const progress = (loggedHours / goal) * 100;

        return { hasGoal: true, loggedHours, goal, remaining, progress };
    }, [currentUser, timeEntries]);

    if (!stats.hasGoal) {
        return (
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Beschikbare uren (deze maand)</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">-</p>
                <p className="text-xs text-gray-500 mt-2">Geen maanddoel ingesteld.</p>
            </div>
        )
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Beschikbare uren (deze maand)</h3>
            <p className={`mt-1 text-2xl font-semibold ${stats.remaining < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {stats.remaining.toFixed(2)}
            </p>
             <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${Math.min(stats.progress, 100)}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 text-right mt-1 font-mono">{stats.loggedHours.toFixed(2)} / {stats.goal.toFixed(2)}</p>
        </div>
    );
};

const TopClientsCard: React.FC = () => {
    const { currentUser, timeEntries, projects, clients } = useTimeTracker();

    const topClients = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const monthlyEntries = timeEntries.filter(e => 
            e.userId === currentUser?.id && 
            e.endTime && 
            new Date(e.startTime) >= startOfMonth && 
            new Date(e.startTime) <= endOfMonth
        );

        const hoursByClient: Record<string, { name: string, hours: number }> = {};

        monthlyEntries.forEach(entry => {
            const project = projects.find(p => p.id === entry.projectId);
            if (!project) return;
            const client = clients.find(c => c.id === project.clientId);
            if (!client) return;

            const hours = entry.accumulatedDuration / 3600000;

            if (hoursByClient[client.id]) {
                hoursByClient[client.id].hours += hours;
            } else {
                hoursByClient[client.id] = { name: client.name, hours };
            }
        });
        
        return Object.values(hoursByClient)
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 5);
            
    }, [currentUser, timeEntries, projects, clients]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Klanten (Deze Maand)</h2>
            {topClients.length > 0 ? (
                <ul className="space-y-3">
                    {topClients.map(client => (
                        <li key={client.name} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 truncate">{client.name}</span>
                            <span className="font-semibold font-mono text-gray-800">{client.hours.toFixed(2)} uur</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500">Nog geen uren geboekt deze maand.</p>
            )}
        </div>
    );
};

const CalendarView: React.FC = () => {
    const [currentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const weekDayOfFirstDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

    const today = new Date();
    const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

    const calendarDays = [];
    for (let i = 0; i < weekDayOfFirstDay; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="p-1"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isCurrentDay = isSameDay(date, today);

        let dayClasses = "flex items-center justify-center h-8 w-8 rounded-full text-sm ";
        if(isCurrentDay) {
            dayClasses += "bg-primary-500 text-white font-bold";
        } else if (isWeekend) {
            dayClasses += "text-gray-400";
        } else {
            dayClasses += "text-gray-700";
        }

        calendarDays.push(
            <div key={day} className={`p-1 flex justify-center items-center ${!isWeekend ? 'bg-gray-50/50' : ''}`}>
                <div className={dayClasses}>
                    {day}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    {currentDate.toLocaleString('nl-NL', { month: 'long', year: 'numeric' })}
                </h2>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-semibold border-b pb-2">
                <div>Ma</div><div>Di</div><div>Wo</div><div>Do</div><div>Vr</div><div>Za</div><div>Zo</div>
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {calendarDays}
            </div>
        </div>
    );
};

const UserProjectProgress: React.FC = () => {
    const { currentUser, projects, timeEntries, clients } = useTimeTracker();

    const assignedProjects = useMemo(() => {
        if (!currentUser) return [];
        return projects.filter(p => p.userBudgets?.some(b => b.userId === currentUser.id));
    }, [projects, currentUser]);

    const projectStats = useMemo(() => {
        if (!currentUser) return [];
        return assignedProjects.map(project => {
            const userBudget = project.userBudgets?.find(b => b.userId === currentUser.id);
            if (!userBudget) return null;

            const budgetHours = userBudget.hours;

            const loggedHours = timeEntries
                .filter(e => e.userId === currentUser.id && e.projectId === project.id && e.endTime && !e.invoiced)
                .reduce((acc, e) => acc + (e.accumulatedDuration / 3600000), 0);

            const remainingHours = budgetHours - loggedHours;
            const progress = budgetHours > 0 ? (loggedHours / budgetHours) * 100 : 0;
            const client = clients.find(c => c.id === project.clientId);

            return {
                projectId: project.id,
                projectName: project.name,
                clientName: client?.name || 'Onbekende Klant',
                budgetHours,
                loggedHours,
                remainingHours,
                progress,
            };
        }).filter((p): p is NonNullable<typeof p> => p !== null)
          .sort((a,b) => b.budgetHours - a.budgetHours);
    }, [assignedProjects, timeEntries, currentUser, clients]);

    if (projectStats.length === 0) {
        return null;
    }
    
    return (
        <div className="bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 p-4 border-b">Mijn Projecten</h2>
            <div className="p-4 space-y-5">
                {projectStats.map(stat => (
                    <div key={stat.projectId}>
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <p className="font-semibold text-gray-800">{stat.projectName}</p>
                                <p className="text-sm text-primary-500">{stat.clientName}</p>
                            </div>
                            <p className={`font-mono text-lg font-semibold ${stat.remainingHours < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                {stat.remainingHours.toFixed(2)} uur open
                            </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className={`h-2.5 rounded-full ${stat.progress > 100 ? 'bg-red-500' : 'bg-primary-500'}`} style={{ width: `${Math.min(stat.progress, 100)}%` }}></div>
                        </div>
                        <div className="text-right text-xs text-gray-500 mt-1 font-mono">
                            {stat.loggedHours.toFixed(2)} / {stat.budgetHours.toFixed(2)} uur
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const Dashboard: React.FC = () => {
  const { projects, users, timeEntries, activeTimers, startTimer, addManualTimeEntry, currentUser } = useTimeTracker();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [description, setDescription] = useState('');
  const [entryMode, setEntryMode] = useState<'timer' | 'manual'>('timer');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualDuration, setManualDuration] = useState('');
  const [manualUserId, setManualUserId] = useState(currentUser?.id || '');

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
    if (currentUser && !manualUserId) {
      setManualUserId(currentUser.id);
    }
  }, [projects, selectedProject, currentUser, manualUserId]);

  const userTimeEntries = useMemo(() => {
      if (!currentUser) return [];
      return timeEntries.filter(e => e.userId === currentUser.id).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    }, [timeEntries, currentUser]);
  
  const stats = useMemo(() => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday as start of week
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const formatCurrency = (amount: number) => `€ ${amount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const calcTurnover = (entries: TimeEntry[]) => {
          const total = entries.reduce((acc, e) => {
              if (e.endTime) {
                  const project = projects.find(p => p.id === e.projectId);
                  if (project) {
                      const hours = e.accumulatedDuration / 3600000;
                      return acc + (hours * project.rate);
                  }
              }
              return acc;
          }, 0);
          return formatCurrency(total);
      };

      return {
          today: calcTurnover(userTimeEntries.filter(e => new Date(e.startTime) >= today)),
          thisWeek: calcTurnover(userTimeEntries.filter(e => new Date(e.startTime) >= startOfWeek)),
          thisMonth: calcTurnover(userTimeEntries.filter(e => new Date(e.startTime) >= startOfMonth)),
      }
  }, [userTimeEntries, projects]);

  const handleStartTimer = () => {
    if (selectedProject && description) {
      startTimer(selectedProject, description);
      setDescription('');
    } else {
      alert('Selecteer een project en geef een omschrijving op.');
    }
  };
  
  const handleManualSave = () => {
    const duration = parseFloat(manualDuration);
    if (selectedProject && manualUserId && description && manualDate && !isNaN(duration) && duration > 0) {
        addManualTimeEntry({
            projectId: selectedProject,
            userId: manualUserId,
            description: description,
            entryDate: manualDate,
            durationHours: duration,
        });
        setDescription('');
        setManualDuration('');
    } else {
        alert('Selecteer een project, collega en vul een omschrijving, datum en geldige duur in (bv. 1.5).');
    }
  };

  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: TimeEntry[] } = {};
    const finishedEntries = userTimeEntries.filter(e => e.endTime !== null);

    for (const entry of finishedEntries) {
        const entryDate = new Date(entry.startTime);
        const dateKey = entryDate.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(entry);
    }
    return groups;
  }, [userTimeEntries]);

  const formatDateHeader = (dateString: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const entryDate = new Date(dateString);
    // Add time to entryDate to avoid timezone issues when comparing dates
    entryDate.setMinutes(entryDate.getMinutes() + entryDate.getTimezoneOffset());

    if (entryDate.toDateString() === today.toDateString()) {
        return 'Vandaag';
    }
    if (entryDate.toDateString() === yesterday.toDateString()) {
        return 'Gisteren';
    }
    return entryDate.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
  };


  return (
    <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welkom terug, {currentUser?.name}!</h1>
        <p className="text-gray-600 mb-6">Hier is een overzicht van je dag.</p>
      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <UserHoursGoalCard />
            <StatCard title="OMZET VANDAAG" value={stats.today} />
            <StatCard title="OMZET DEZE WEEK" value={stats.thisWeek} />
            <StatCard title="OMZET DEZE MAAND" value={stats.thisMonth} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    {activeTimers.length > 0 && (
                        <div className="space-y-4 mb-6">
                            {activeTimers.map(timer => <ActiveTimerCard key={timer.id} entry={timer} />)}
                        </div>
                    )}
                    
                    {projects.length === 0 ? (
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-700">Welkom!</h3>
                            <p className="text-gray-600 mt-2">Voeg eerst een klant toe via de 'Klanten' pagina.</p>
                            <p className="text-sm text-gray-500 mt-1">Daarna kunt u een project aanmaken en uw uren bijhouden.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex border-b -mx-6 px-6 mb-4">
                                <button onClick={() => setEntryMode('timer')} className={`px-4 py-2 text-sm font-semibold focus:outline-none ${entryMode === 'timer' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                    Timer
                                </button>
                                <button onClick={() => setEntryMode('manual')} className={`px-4 py-2 text-sm font-semibold focus:outline-none ${entryMode === 'manual' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                    Handmatig
                                </button>
                            </div>

                            {entryMode === 'timer' && (
                                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Waar werk je aan?" className="flex-grow w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 !bg-white !text-gray-900" rows={1}/>
                                    <div className="flex items-center space-x-4 w-full md:w-auto">
                                        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="flex-grow px-4 py-2 border border-gray-300 rounded-lg !bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 !text-gray-900">
                                            <option value="" disabled>Selecteer een project</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{cleanProjectName(p.name)}</option>)}
                                        </select>
                                        <button onClick={handleStartTimer} className="px-6 py-2 bg-primary-500 text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-75">
                                            Start
                                        </button>
                                    </div>
                                </div>
                            )}
                            {entryMode === 'manual' && (
                                <div className="space-y-4">
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Waar werk je aan?" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 !bg-white !text-gray-900" rows={1} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg !bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 !text-gray-900">
                                             <option value="" disabled>Selecteer een project</option>
                                             {projects.map(p => <option key={p.id} value={p.id}>{cleanProjectName(p.name)}</option>)}
                                        </select>
                                        <select value={manualUserId} onChange={e => setManualUserId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg !bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 !text-gray-900">
                                             <option value="" disabled>Selecteer een collega</option>
                                             {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                        <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 !bg-white !text-gray-900" />
                                        <input type="number" value={manualDuration} onChange={e => setManualDuration(e.target.value)} placeholder="Duur (bv. 1.5)" step="0.01" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 !bg-white !text-gray-900" />
                                    </div>
                                    <button onClick={handleManualSave} className="w-full px-6 py-2 bg-primary-500 text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-75">
                                        Boeking Opslaan
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 p-4 border-b">Recente Uren</h2>
                     <div>
                        {Object.keys(groupedEntries).length > 0 ? (
                            Object.keys(groupedEntries).map(dateKey => (
                                <div key={dateKey}>
                                    <div className="px-4 py-2 bg-gray-50 border-b border-t">
                                        <h3 className="text-sm font-semibold text-gray-600">{formatDateHeader(dateKey)}</h3>
                                    </div>
                                    <div className="divide-y divide-gray-200">
                                        {groupedEntries[dateKey].map(entry => (
                                            <TimeEntryRow key={entry.id} entry={entry} project={projects.find(p => p.id === entry.projectId)} />
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-10 text-gray-500">Nog geen uren geregistreerd.</p>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="lg:col-span-1 flex flex-col gap-8">
                <UserProjectProgress />
                <TopClientsCard />
                <CalendarView />
            </div>
      </div>
    </div>
  );
};

export default Dashboard;
