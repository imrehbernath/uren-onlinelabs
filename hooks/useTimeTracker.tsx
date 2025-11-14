import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Project, Client, TimeEntry, Invoice, User, InvoiceLineItem } from '../types';
import { firebaseService, auth } from '../services/firebaseService';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { generateInvoice } from '../services/invoiceService';
import * as geminiService from '../services/geminiService';

interface TimeTrackerContextType {
  loading: boolean;
  isAuthenticated: boolean;
  configError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: User[];
  currentUser: User | null;
  clients: Client[];
  projects: Project[];
  timeEntries: TimeEntry[];
  invoices: Invoice[];
  activeTimers: TimeEntry[];
  startTimer: (projectId: string, description: string) => Promise<void>;
  stopTimer: (entryId: string) => Promise<void>;
  pauseTimer: (entryId: string) => Promise<void>;
  resumeTimer: (entryId: string) => Promise<void>;
  updateTimeEntry: (entryId: string, updates: Partial<Omit<TimeEntry, 'id'>>) => Promise<void>;
  deleteTimeEntry: (entryId: string) => Promise<void>;
  addManualTimeEntry: (details: { projectId: string; userId: string; description: string; entryDate: string; durationHours: number; }) => Promise<void>;
  createInvoice: (clientId: string, projectId: string, entryIds: string[], manualItems: Omit<InvoiceLineItem, 'total'>[], taxRate: number) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  refineInvoiceWithAI: (invoice: Invoice, userRequest: string) => Promise<void>;
  resetAllTimeEntries: () => Promise<void>;
}

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(undefined);

export const TimeTrackerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const refreshData = useCallback(async () => {
    try {
      const { 
          users: fetchedUsers, 
          clients: fetchedClients, 
          projects: fetchedProjects, 
          timeEntries: fetchedTimeEntries, 
          invoices: fetchedInvoices 
      } = await firebaseService.getAllCollections();

      const sortedTimeEntries = fetchedTimeEntries.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      const sortedClients = fetchedClients.sort((a, b) => a.name.localeCompare(b.name));
      
      setUsers(fetchedUsers);
      setClients(sortedClients);
      setProjects(fetchedProjects);
      setTimeEntries(sortedTimeEntries);
      setInvoices(fetchedInvoices);
      
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  }, []);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    if (!auth) {
        console.error("Firebase Auth service is not available.");
        return false;
    }
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
    } catch (error) {
        console.error("Firebase login error:", error);
        return false;
    }
  };

  const logout = async () => {
    const userActiveTimers = timeEntries.filter(entry => entry.endTime === null && entry.userId === currentUser?.id);
    if (userActiveTimers.length > 0) {
        alert('Stop alstublieft uw actieve timer voordat u uitlogt.');
        return;
    }
    if (!auth) {
        console.error("Firebase Auth service is not available.");
        return;
    }
    await signOut(auth);
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    console.log('useTimeTracker: Setup effect started.');

    const setup = async () => {
        setLoading(true);
        console.log('useTimeTracker: setup() called.');
        try {
            console.log('useTimeTracker: Calling firebaseService.bootstrapApplication()');
            const { 
                users: fetchedUsers, 
                clients: fetchedClients, 
                projects: fetchedProjects, 
                timeEntries: fetchedTimeEntries, 
                invoices: fetchedInvoices 
            } = await firebaseService.bootstrapApplication();
            console.log('useTimeTracker: bootstrapApplication() successful.');

            const sortedTimeEntries = fetchedTimeEntries.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
            const sortedClients = fetchedClients.sort((a, b) => a.name.localeCompare(b.name));
            
            setUsers(fetchedUsers);
            setClients(sortedClients);
            setProjects(fetchedProjects);
            setTimeEntries(sortedTimeEntries);
            setInvoices(fetchedInvoices);

            if (auth) {
                console.log('useTimeTracker: Subscribing to auth state changes.');
                unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                    console.log('useTimeTracker: onAuthStateChanged triggered. User:', firebaseUser ? firebaseUser.email : 'null');
                    if (firebaseUser) {
                        const profile = fetchedUsers.find(u => u.email.toLowerCase() === firebaseUser.email?.toLowerCase());
                        if (profile) {
                            setCurrentUser(profile);
                            setIsAuthenticated(true);
                        } else {
                            console.warn("User logged in with Firebase, but no profile found in Firestore.", firebaseUser.email);
                            signOut(auth);
                            setCurrentUser(null);
                            setIsAuthenticated(false);
                        }
                    } else {
                        setCurrentUser(null);
                        setIsAuthenticated(false);
                    }
                    setLoading(false);
                    console.log('useTimeTracker: State updated after auth change, loading set to false.');
                });
            } else {
                console.error('useTimeTracker: Auth object is null, throwing error.');
                throw new Error("Firebase Auth not initialized. Cannot track authentication state.");
            }
        } catch (error: any) {
            console.error("useTimeTracker: FATAL error during setup:", error);
            
            let userMessage = "Fout bij het laden van gegevens. Controleer uw internetverbinding en probeer het opnieuw.";
            if (error.message?.includes('permission-denied') || error.message?.includes('insufficient permissions')) {
                userMessage = "Firebase Fout: Toegang geweigerd (permission-denied).\n\nDit komt waarschijnlijk door uw Firestore-veiligheidsregels.\n\nRaadpleeg de instructies in het bestand 'docs/firestore-rules.md' om dit op te lossen.";
            } else if (error.message?.includes('Failed to fetch')) {
                 userMessage = "Netwerkfout. Controleer uw internetverbinding en Firebase-configuratie.";
            } else if (error.message?.includes('Firestore is niet geïnitialiseerd')) {
                 userMessage = "Firebase is niet correct geconfigureerd. Controleer de `firebaseConfig` in 'services/firebaseService.ts'.\n\nDe API-sleutel (apiKey) is waarschijnlijk onjuist. Kopieer de juiste configuratie vanuit uw Firebase-project.";
            }
            
            setConfigError(userMessage);
            console.log('useTimeTracker: configError set to:', userMessage);

            // Set a safe state to prevent app crash
            setIsAuthenticated(false);
            setCurrentUser(null);
            setLoading(false);
        }
    };

    setup();

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, []);


  const activeTimers = timeEntries.filter(entry => entry.endTime === null && entry.userId === currentUser?.id);

  const startTimer = async (projectId: string, description: string) => {
    if (!currentUser) return;
    const now = new Date();
    const newEntryData: Omit<TimeEntry, 'id'> = {
      projectId,
      userId: currentUser.id,
      description,
      startTime: now,
      lastStartTime: now,
      endTime: null,
      invoiced: false,
      isPaused: false,
      accumulatedDuration: 0,
    };
    await firebaseService.addDocument('timeEntries', newEntryData);
    await refreshData();
  };

  const pauseTimer = async (entryId: string) => {
    const entry = timeEntries.find(e => e.id === entryId && !e.isPaused && e.endTime === null);
    if (!entry) return;
    const elapsed = new Date().getTime() - new Date(entry.lastStartTime).getTime();
    const newAccumulated = entry.accumulatedDuration + elapsed;
    await firebaseService.updateDocument('timeEntries', entryId, { isPaused: true, accumulatedDuration: newAccumulated });
    await refreshData();
  };

  const resumeTimer = async (entryId: string) => {
    const entry = timeEntries.find(e => e.id === entryId && e.isPaused && e.endTime === null);
    if (!entry) return;
    await firebaseService.updateDocument('timeEntries', entryId, { isPaused: false, lastStartTime: new Date() });
    await refreshData();
  };

  const stopTimer = async (entryId: string) => {
    const entry = timeEntries.find(e => e.id === entryId && e.endTime === null);
    if (!entry) return;

    let finalAccumulated = entry.accumulatedDuration;
    if (!entry.isPaused) {
        finalAccumulated += new Date().getTime() - new Date(entry.lastStartTime).getTime();
    }
    await firebaseService.updateDocument('timeEntries', entryId, { endTime: new Date(), accumulatedDuration: finalAccumulated, isPaused: false });
    await refreshData();
  };
  
  const updateTimeEntry = async (entryId: string, updates: Partial<Omit<TimeEntry, 'id'>>) => {
      await firebaseService.updateDocument('timeEntries', entryId, updates);
      await refreshData();
  };
  
  const addManualTimeEntry = async (details: { projectId: string; userId: string; description: string; entryDate: string; durationHours: number; }) => {
      if (!currentUser) return;
      
      const [year, month, day] = details.entryDate.split('-').map(Number);
      const startTime = new Date(year, month - 1, day, 9, 0, 0); 
      
      const durationMs = details.durationHours * 3600 * 1000;
      const endTime = new Date(startTime.getTime() + durationMs);

      const newEntryData: Omit<TimeEntry, 'id'> = {
          projectId: details.projectId,
          userId: details.userId,
          description: details.description,
          startTime,
          lastStartTime: startTime,
          endTime,
          invoiced: false,
          isPaused: false,
          accumulatedDuration: durationMs,
      };
      await firebaseService.addDocument('timeEntries', newEntryData);
      await refreshData();
  };


  const deleteTimeEntry = async (entryId: string) => {
      if (window.confirm('Weet je zeker dat je deze boeking wilt verwijderen?')) {
        await firebaseService.deleteDocument('timeEntries', entryId);
        await refreshData();
      }
  };

  const addProject = async (project: Omit<Project, 'id'>) => {
    await firebaseService.addDocument('projects', project);
    await refreshData();
  };

  const addClient = async (client: Omit<Client, 'id'>) => {
    await firebaseService.addDocument('clients', client);
    await refreshData();
  };

  const deleteClient = async (clientId: string) => {
    if (window.confirm('Weet u zeker dat u deze klant wilt verwijderen? Alle bijbehorende projecten, urenboekingen en facturen worden ook permanent verwijderd.')) {
        await firebaseService.deleteClientAndRelatedData(clientId);
        await refreshData();
    }
  };
  
  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    await firebaseService.updateDocument('projects', projectId, updates);
    await refreshData();
  };

  const createInvoice = async (clientId: string, projectId: string, entryIds: string[], manualItems: Omit<InvoiceLineItem, 'total'>[], taxRate: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Zoek het eerste beschikbare factuurnummer vanaf 2942.
    // Dit maakt het mogelijk een nummer opnieuw te gebruiken als een factuur is verwijderd.
    const existingNumbers = new Set(invoices.map(inv => parseInt(inv.number, 10)).filter(n => !isNaN(n)));
    let nextNumber = 2942;
    while (existingNumbers.has(nextNumber)) {
        nextNumber++;
    }
    const newInvoiceNumber = nextNumber.toString();

    const entriesToInvoice = timeEntries.filter(entry => entryIds.includes(entry.id));
    const newInvoice = generateInvoice(clientId, project, entriesToInvoice, manualItems, newInvoiceNumber, taxRate, entryIds);
    
    newInvoice.subject = `Werkzaamheden voor project ${project.name}`;

    await firebaseService.addDocument('invoices', newInvoice);
    await Promise.all(
        entryIds.map(id => firebaseService.updateDocument('timeEntries', id, { invoiced: true }))
    );
    await refreshData();
  };

  const deleteInvoice = async (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        alert("Kan de factuur niet vinden. Probeer de pagina te vernieuwen.");
        return;
    }

    const confirmationMessage = invoice.timeEntryIds && invoice.timeEntryIds.length > 0
        ? 'Weet u zeker dat u deze factuur wilt verwijderen? De gekoppelde urenboekingen worden weer als "niet gefactureerd" gemarkeerd.'
        : 'Weet u zeker dat u deze factuur wilt verwijderen?';

    if (window.confirm(confirmationMessage)) {
        try {
            await firebaseService.deleteInvoice(invoiceId, invoice.timeEntryIds || []);
            await refreshData();
        } catch (error: any) {
            console.error("================ DEBUG INFO: Factuur Verwijderen Mislukt ================");
            console.error("Fout opgetreden bij het verwijderen van factuur ID:", invoiceId);
            console.error("Factuurdetails:", JSON.stringify(invoice, null, 2));
            console.error("Gerelateerde urenboeking IDs:", invoice.timeEntryIds || []);
            console.error("Volledige Foutmelding:", error);
            console.error("====================== EINDE DEBUG INFO ======================");
            
            const userMessage = `Het verwijderen van de factuur is mislukt.\n\nTechnische details: ${error.message}\n\nOm dit probleem op te lossen, open de developer console (druk op F12), kopieer de volledige foutmelding die begint met 'DEBUG INFO', en stuur deze door.`;
            
            alert(userMessage);
        }
    }
  };

  const updateClient = async (updatedClient: Client) => {
    await firebaseService.updateDocument('clients', updatedClient.id, updatedClient);
    await refreshData();
  };

  const updateInvoice = async (updatedInvoice: Invoice) => {
    await firebaseService.updateDocument('invoices', updatedInvoice.id, updatedInvoice);
    await refreshData();
  };
  
  const addUser = async (user: Omit<User, 'id'>) => {
    await firebaseService.addDocument('users', user);
    await refreshData();
  };

  const updateUser = async (updatedUser: User) => {
    await firebaseService.updateDocument('users', updatedUser.id, updatedUser);
    await refreshData();
  };
  
  const deleteUser = async (userId: string) => {
    if (currentUser && userId === currentUser.id) {
        alert("U kunt uzelf niet verwijderen.");
        return;
    }
    if (timeEntries.some(e => e.userId === userId)) {
        alert("Kan gebruiker niet verwijderen. Er zijn nog urenboekingen gekoppeld aan deze gebruiker.");
        return;
    }

    if (window.confirm('Weet u zeker dat u deze collega wilt verwijderen? Eventuele projectbudgetten voor deze persoon worden ook verwijderd.')) {
        await firebaseService.deleteDocument('users', userId);
        
        const projectsToUpdate = projects.filter(p => p.userBudgets?.some(b => b.userId === userId));
        await Promise.all(projectsToUpdate.map(p => {
             const newUserBudgets = p.userBudgets?.filter(b => b.userId !== userId);
             return firebaseService.updateDocument('projects', p.id, { userBudgets: newUserBudgets });
        }));
        await refreshData();
    }
  };

  const refineInvoiceWithAI = async (invoice: Invoice, userRequest: string) => {
    const project = projects.find(p => p.id === invoice.projectId);
    if (!project) {
        throw new Error("Project niet gevonden voor deze factuur.");
    }
    
    const { newSubject } = await geminiService.refineInvoiceText(project, invoice, userRequest);

    const updates = {
        subject: newSubject,
    };

    await firebaseService.updateDocument('invoices', invoice.id, updates);
    await refreshData();
  };

  const resetAllTimeEntries = async () => {
    await firebaseService.resetTimeEntries();
    await refreshData();
  };

  const value = {
      loading,
      isAuthenticated,
      configError,
      login,
      logout,
      users,
      currentUser,
      clients,
      projects,
      timeEntries,
      invoices,
      activeTimers,
      startTimer,
      stopTimer,
      pauseTimer,
      resumeTimer,
      updateTimeEntry,
      deleteTimeEntry,
      addManualTimeEntry,
      createInvoice,
      deleteInvoice,
      addProject,
      addClient,
      deleteClient,
      updateClient,
      updateInvoice,
      updateProject,
      addUser,
      updateUser,
      deleteUser,
      refineInvoiceWithAI,
      resetAllTimeEntries,
  };

  return (
    <TimeTrackerContext.Provider value={value}>
      {children}
    </TimeTrackerContext.Provider>
  );
};

export const useTimeTracker = () => {
  const context = useContext(TimeTrackerContext);
  if (context === undefined) {
    throw new Error('useTimeTracker must be used within a TimeTrackerProvider');
  }
  return context;
};