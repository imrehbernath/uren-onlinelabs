
import type { Client, Project, User, TimeEntry, Invoice } from '../types';

export const COMPANY_DETAILS = {
    name: 'OnlineLabs',
    address: 'Herengracht 221',
    zipCode: '1016 BG',
    city: 'Amsterdam',
    btwId: 'NL002082155B11',
    kvk: '34368510',
    iban: 'NL28 RABO 0155 7403 26'
};

export const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Colin Dijkstra', email: 'colin@onlinelabs.nl', monthlyHourGoal: 160 },
  { id: 'user-2', name: 'Imre Bernáth', email: 'imre@onlinelabs.nl', monthlyHourGoal: 150 },
  { id: 'user-3', name: 'Adrian Enders', email: 'adrian@onlinelabs.nl', monthlyHourGoal: 160 },
  { id: 'user-4', name: 'Sanne Verschoor', email: 'sanne@onlinelabs.nl', monthlyHourGoal: 140 },
];

const clientNames = Array.from(new Set([
    '24hour Solutions B.V.', 'Advocaten van Oranje', 'AMMA Jewelry', 'Anoek Gerlings', 'ASN Autoschade', 
    'Autorijschool Hillegom', 'Bots Watersport', 'Boekhoudcollege', 'Cake Film', 'Carly Donaldson Photography', 
    'C-Roots', 'Circuswerkplaats Boost', 'Cocon Administratie & Advies', 'ContactCare', 'Cooper Advocaten', 
    'Damstraat Rent a Bike', 'DB Travel', 'De Bats BNA Architecten', 'De Droomengeltjes', 'De Jong Transport', 
    'Denk in Mogelijkheden', 'Dorothee Bavinck Fotografie', 'Dry Systems', 'DSV Media B.V.', 'Eden Holland', 
    'Entrust', 'Evert Groot Interieurstoffen', 'Fact Accountants', 'Factoring vergelijken', 'FactoringPortal.be', 
    'Farber Zwaanswijk Advocaten', 'Feadship Heritage Fleet', 'Feeling Touched', 'Feniks Installatie Adviseurs', 
    'Flinck Advocaten', 'Forteiland Pampus', 'Fruytier Lawyers in Business B.V.', 'Galred Europe B.V.', 
    'GCM Advocaten (Groen Caubo Montessori Advocaten)', 'Glowballz', 'Grachtenmuseum', 'Heavy Decor Events & Teambuilding', 
    'Hettema & van Bambost Juristen', 'Highteaandmore', 'Human Rights Initiatives', 'Inhealth', 'Intra Lighting Benux BV', 
    'INSTRKTIV', 'Interaction Force B.V.', 'InterDam', 'Jachthaven', 'Jansen Schepers Holding B.V.', 
    'Jean-Pierre van de Ven', 'JP Database Solutions (JPDS)', 'JVA Den Haag', 'Kapok', 'Kinderdagverblijf De Droomengeltjes', 
    'Koppelland Beheer B.V.', 'Le Belle Vastgoed', 'Lischer Milani', 'Liselore Tempel Wedding Photography', 'Lime Networks', 
    'Life is a Pitch', 'LRB Advocatuur', 'Make Marketing Magic B.V.', 'Mathijs Holding B.V.', 'Message to the Moon', 
    'MindClouds', 'mosaicspecialists.com', 'Muider Compagnie', 'Tom Mutsaers Glasservice', 'Rederij Navigo B.V.', 
    'Optivind', 'Pinkstergemeente Filadelfia Heerenveen', 'Praktijk Hoofddorp', 'Praktijk Mindcare BV', 'Praktijk voor Mesologie', 
    'R. Durge Installatiebedrijf', 'Rijschool Easydriving', 'Rijschool Meteoor', 'Sec Arbeidsrecht Advocaten', 'Selera Anda Catering', 
    'Sinck en Ko B.V.', 'Smashing Party', 'Stichting Greenmanjaro', 'Stichting HvanA', 'Stichting Tasha’s Surf en Snowcamps', 
    'Studio Asbest', 'Studio Keramiek', 'Stukadoorsbedrijf Dennis Looy', 'Tafelbroerders', 'Taxi met Kinderstoeltjes', 
    'Technica Groep B.V.', 'Theorie Centrum De Komeet', 'Tiwele Elensar', 'TNA vervoersbedrijf', 'Trivsion', 'Tubble', 
    'Uitvaartverzorging De Vries', 'Veldman Zonwering', 'Veldwijk Aannemers B.V.', 'Vivendi Leeuwenkamp B.V.', 'Vloershopper.nl', 
    'WeBike Amsterdam', 'HvanA'
]));


export const MOCK_CLIENTS: Client[] = clientNames.map((name, index) => ({
  id: `client-${index + 1}`,
  name: name,
  address: 'Adres onbekend',
  zipCode: '0000 AA',
  city: 'Plaats onbekend',
  contactPerson: '',
  btwId: '',
  kvk: '',
}));

export const MOCK_PROJECTS: Project[] = MOCK_CLIENTS.map((client, index) => ({
  id: `project-${index + 1}`,
  name: client.name,
  clientId: client.id,
  rate: 120,
}));

function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateTimeEntries(): TimeEntry[] {
    const entries: TimeEntry[] = [];
    const today = new Date();
    
    // Set the range to be the entirety of the previous month to ensure the current month starts clean.
    const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    endOfPreviousMonth.setHours(23, 59, 59, 999);

    const descriptions = [
        "Strategische sessie en planning", "Ontwerp UI/UX mockups", "Frontend development (React)",
        "Backend API implementatie", "Database schema ontwerp", "Code review en refactoring",
        "Deployment naar staging server", "Bug fixing en troubleshooting", "Klantbespreking en feedback verwerken",
        "Projectmanagement en coördinatie", "Documentatie schrijven", "Security audit uitvoeren"
    ];

    for (let i = 0; i < 50; i++) {
        const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
        const project = MOCK_PROJECTS[Math.floor(Math.random() * MOCK_PROJECTS.length)];
        
        const startTime = randomDate(startOfPreviousMonth, endOfPreviousMonth);
        const durationMs = (Math.random() * 4 + 0.5) * 60 * 60 * 1000; // 0.5 to 4.5 hours
        const endTime = new Date(startTime.getTime() + durationMs);
        
        entries.push({
            id: `time-entry-${Date.now()}-${i}`,
            projectId: project.id,
            userId: user.id,
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            startTime,
            endTime,
            invoiced: Math.random() > 0.8, // Randomly mark some as invoiced
            isPaused: false,
            accumulatedDuration: durationMs,
            lastStartTime: startTime,
        });
    }
    return entries;
}


export const MOCK_TIME_ENTRIES: TimeEntry[] = generateTimeEntries();


export const MOCK_INVOICES: Invoice[] = [];