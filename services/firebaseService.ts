// ===================================================================================
// KOPPELEN MET UW ECHTE FIREBASE DATABASE
// ===================================================================================
//
// STAP 1: VUL UW FIREBASE CONFIGURatie HIERONDER IN
//
// U vindt deze gegevens in uw Firebase project:
// Ga naar Projectinstellingen (tandwiel-icoon) > Algemeen > Mijn apps > SDK-installatie en -configuratie.
// Kopieer het 'firebaseConfig' object en plak het hier.
//
const firebaseConfig = {
  apiKey: "AIzaSyC70fR9mGQ9R6Jk-lESuR2FzV8md3ParJY",
  authDomain: "onlinelabs-harvest.firebaseapp.com",
  projectId: "onlinelabs-harvest",
  storageBucket: "onlinelabs-harvest.firebasestorage.app",
  messagingSenderId: "945182456125",
  appId: "1:945182456125:web:be08b8b4f172f4a78aad54",
  measurementId: "G-9KM9ZET40G"
};
//
// STAP 2: KLAAR!
// De applicatie is nu verbonden met uw live database. De eerste keer dat de app
// laadt, wordt de database automatisch gevuld met de startgegevens.
//
// ===================================================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    limit,
    query,
    where,
    Timestamp,
    DocumentSnapshot,
    Firestore
} from 'firebase/firestore';

import { MOCK_CLIENTS, MOCK_PROJECTS, MOCK_USERS, MOCK_TIME_ENTRIES, MOCK_INVOICES } from './mockData';
import type { Client, Project, User, TimeEntry, Invoice } from '../types';

console.log('Firebase Service: Script loaded.');

let firestoreDb: Firestore;
let auth: Auth;

try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestoreDb = getFirestore(app);
    console.log('Firebase Service: Firestore and Auth services obtained successfully.');
} catch (e) {
    console.error("Firebase Service: CRITICAL - Firebase initialization failed.", e);
    firestoreDb = null!;
    auth = null!;
}

interface DbSchema {
    users: User;
    clients: Client;
    projects: Project;
    timeEntries: TimeEntry;
    invoices: Invoice;
}
type CollectionName = keyof DbSchema;

// Helper to convert Firestore Timestamps to JS Date objects
const fromFirestore = <T extends {id: string}>(docSnap: DocumentSnapshot, collectionName: CollectionName): T => {
    const data = docSnap.data()!;
    // Convert any Firestore Timestamp objects to JS Date objects
    Object.keys(data).forEach(key => {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate();
        }
    });

    if (collectionName === 'invoices') {
        if (typeof (data as Partial<Invoice>).taxRate !== 'number') {
            (data as Partial<Invoice>).taxRate = 0.21;
        }
    }
    
    return { ...data, id: docSnap.id } as T;
};

// This function only fetches data, without any seeding logic.
// Used for refreshing data after the initial load.
const getAllCollections = async () => {
    if (!firestoreDb) throw new Error("Firestore is niet geïnitialiseerd.");
    
    const [users, clients, projects, timeEntries, invoices] = await Promise.all([
        getDocs(collection(firestoreDb, 'users')),
        getDocs(collection(firestoreDb, 'clients')),
        getDocs(collection(firestoreDb, 'projects')),
        getDocs(collection(firestoreDb, 'timeEntries')),
        getDocs(collection(firestoreDb, 'invoices')),
    ]);

    return {
        users: users.docs.map(d => fromFirestore<User>(d, 'users')),
        clients: clients.docs.map(d => fromFirestore<Client>(d, 'clients')),
        projects: projects.docs.map(d => fromFirestore<Project>(d, 'projects')),
        timeEntries: timeEntries.docs.map(d => fromFirestore<TimeEntry>(d, 'timeEntries')),
        invoices: invoices.docs.map(d => fromFirestore<Invoice>(d, 'invoices')),
    };
};

// This master function handles the application bootstrap.
// It checks if the database is empty. If so, it seeds the initial mock data ONCE.
// On all subsequent loads, it just fetches the existing data, preserving all user changes.
const bootstrapApplication = async () => {
    if (!firestoreDb) {
        throw new Error("Firestore is niet geïnitialiseerd.");
    }

    const clientsQuery = query(collection(firestoreDb, 'clients'), limit(1));
    const clientsSnapshot = await getDocs(clientsQuery);

    if (clientsSnapshot.empty) {
        console.log("Database lijkt leeg. De initiële startgegevens worden eenmalig geladen...");
        const batch = writeBatch(firestoreDb);

        const addMockDataToBatch = <T extends { id: string }>(collectionName: CollectionName, data: T[]) => {
            data.forEach(item => {
                const docRef = doc(firestoreDb, collectionName, item.id);
                batch.set(docRef, item);
            });
        };
        
        addMockDataToBatch('users', MOCK_USERS);
        addMockDataToBatch('clients', MOCK_CLIENTS);
        addMockDataToBatch('projects', MOCK_PROJECTS);
        addMockDataToBatch('timeEntries', MOCK_TIME_ENTRIES);
        addMockDataToBatch('invoices', MOCK_INVOICES);

        await batch.commit();
        console.log("Startgegevens succesvol geladen.");
    }

    return getAllCollections();
};

const addDocument = async <K extends CollectionName>(collectionName: K, data: Omit<DbSchema[K], 'id'>): Promise<DbSchema[K]> => {
    if (!firestoreDb) throw new Error("Firestore niet geïnitialiseerd");
    const docRef = await addDoc(collection(firestoreDb, collectionName), data);
    const newDocSnap = await getDoc(docRef);
    return fromFirestore<DbSchema[K]>(newDocSnap, collectionName);
};

const updateDocument = async <K extends CollectionName>(collectionName: K, docId: string, updates: Partial<Omit<DbSchema[K], 'id'>>): Promise<void> => {
    if (!firestoreDb) return;
    const docRef = doc(firestoreDb, collectionName, docId);
    await updateDoc(docRef, updates);
};

const deleteDocument = async (collectionName: CollectionName, docId: string): Promise<void> => {
    if (!firestoreDb) return;
    const docRef = doc(firestoreDb, collectionName, docId);
    await deleteDoc(docRef);
};

const deleteClientAndRelatedData = async (clientId: string): Promise<void> => {
    if (!firestoreDb) return;
    const batch = writeBatch(firestoreDb);

    const projectsQuery = query(collection(firestoreDb, 'projects'), where('clientId', '==', clientId));
    const projectsSnapshot = await getDocs(projectsQuery);
    const projectIds = projectsSnapshot.docs.map(d => d.id);
    
    projectsSnapshot.forEach(doc => batch.delete(doc.ref));

    if (projectIds.length > 0) {
        const timeEntriesQuery = query(collection(firestoreDb, 'timeEntries'), where('projectId', 'in', projectIds));
        const timeEntriesSnapshot = await getDocs(timeEntriesQuery);
        timeEntriesSnapshot.forEach(doc => batch.delete(doc.ref));
    }

    const invoicesQuery = query(collection(firestoreDb, 'invoices'), where('clientId', '==', clientId));
    const invoicesSnapshot = await getDocs(invoicesQuery);
    invoicesSnapshot.forEach(doc => batch.delete(doc.ref));

    const clientRef = doc(firestoreDb, 'clients', clientId);
    batch.delete(clientRef);

    await batch.commit();
};

const deleteInvoice = async (invoiceId: string, timeEntryIds: string[]): Promise<void> => {
    if (!firestoreDb) return;
    const batch = writeBatch(firestoreDb);

    for (const entryId of timeEntryIds) {
        if (!entryId) continue;
        const entryRef = doc(firestoreDb, 'timeEntries', entryId);
        // We'll optimistically try to update. If it doesn't exist, Firestore batch will fail.
        // A more robust solution would check existence first, but for this app's logic it's acceptable.
        batch.update(entryRef, { invoiced: false });
    }

    const invoiceRef = doc(firestoreDb, 'invoices', invoiceId);
    batch.delete(invoiceRef);

    await batch.commit();
};

const resetTimeEntries = async (): Promise<void> => {
    if (!firestoreDb) return;
    const batch = writeBatch(firestoreDb);
    const timeEntriesSnapshot = await getDocs(collection(firestoreDb, 'timeEntries'));
    
    timeEntriesSnapshot.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
    console.log("Alle urenboekingen zijn verwijderd.");
};

const firebaseService = {
    bootstrapApplication,
    getAllCollections,
    addDocument,
    updateDocument,
    deleteDocument,
    deleteClientAndRelatedData,
    deleteInvoice,
    resetTimeEntries,
};

export { firebaseService, auth, firestoreDb };