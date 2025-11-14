import React, { useState, useMemo, useEffect } from 'react';
import { useTimeTracker } from '../hooks/useTimeTracker';
import type { Invoice, InvoiceLineItem, Client } from '../types';
import { COMPANY_DETAILS } from '../services/mockData';
import { LOGO_SVG_BLUE } from '../App';

const cleanProjectName = (name: string) => name.replace(/^Werkzaamheden voor /, '');

const SparkleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1zM3 9a1 1 0 011 1v1h1a1 1 0 010 2H4v1a1 1 0 01-2 0v-1H1a1 1 0 010-2h1v-1a1 1 0 011-1zm12.449 2.551a1 1 0 010 1.414l-2.828 2.828a1 1 0 01-1.414-1.414l2.828-2.828a1 1 0 011.414 0zM14 9a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0v-1h-1a1 1 0 010-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);
const SpinnerIcon = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const AiAssistantModal: React.FC<{
    invoice: Invoice;
    isOpen: boolean;
    onClose: () => void;
}> = ({ invoice, isOpen, onClose }) => {
    const { refineInvoiceWithAI } = useTimeTracker();
    const [request, setRequest] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!request) return;

        setIsLoading(true);
        setError('');
        try {
            await refineInvoiceWithAI(invoice, request);
            onClose(); // Close modal on success
        } catch (err) {
            setError('Er is iets misgegaan. Probeer het opnieuw.');
            console.error(err);
        } finally {
            setIsLoading(false);
            setRequest('');
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <SparkleIcon />
                        <span className="ml-2">AI Factuur Assistent</span>
                    </h2>
                     <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-bold">&times;</button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Vraag de assistent om het onderwerp of de samenvatting van de factuur aan te passen.
                </p>
                 <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                         <label htmlFor="aiRequest" className="block text-sm font-medium text-gray-700">Uw verzoek:</label>
                        <input
                            id="aiRequest"
                            type="text"
                            value={request}
                            onChange={e => setRequest(e.target.value)}
                            placeholder="bv. Maak de toon wat formeler."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <div className="flex justify-end items-center">
                         <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-800 font-bold py-2 px-4 mr-2">Annuleren</button>
                        <button type="submit" disabled={isLoading || !request} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:bg-primary-300 disabled:cursor-not-allowed flex items-center">
                            {isLoading && <SpinnerIcon />}
                            {isLoading ? 'Verwerken...' : 'Aanpassen'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const InvoiceCreator: React.FC<{ onInvoiceCreated: () => void, onCancel: () => void }> = ({ onInvoiceCreated, onCancel }) => {
    const { projects, clients, timeEntries, createInvoice } = useTimeTracker();
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
    const [manualItems, setManualItems] = useState<Omit<InvoiceLineItem, 'total'>[]>([]);
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemQty, setNewItemQty] = useState(1);
    const [newItemPrice, setNewItemPrice] = useState(0);
    const [taxRate, setTaxRate] = useState(0.21);

    const unbilledEntries = useMemo(() => {
        if (!selectedProjectId) return [];
        return timeEntries.filter(e => e.projectId === selectedProjectId && !e.invoiced && e.endTime);
    }, [selectedProjectId, timeEntries]);

    const handleToggleEntry = (entryId: string) => {
        setSelectedEntryIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entryId)) newSet.delete(entryId);
            else newSet.add(entryId);
            return newSet;
        });
    };

    const handleAddManualItem = () => {
        if(newItemDesc && newItemPrice) {
            setManualItems([...manualItems, {description: newItemDesc, quantity: newItemQty, price: newItemPrice}]);
            setNewItemDesc('');
            setNewItemQty(1);
            setNewItemPrice(0);
        }
    }

    const handleCreateInvoice = () => {
        const project = projects.find(p => p.id === selectedProjectId);
        if (project && (selectedEntryIds.size > 0 || manualItems.length > 0)) {
            createInvoice(project.clientId, project.id, Array.from(selectedEntryIds), manualItems, taxRate);
            onInvoiceCreated();
        } else {
            alert('Selecteer een project en minimaal één uurboeking of handmatige regel.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Nieuwe Factuur Maken</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Selecteer een project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{cleanProjectName(p.name)}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BTW-tarief</label>
                    <select value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value))} className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value={0.21}>21% BTW</option>
                        <option value={0}>0% BTW</option>
                    </select>
                </div>
            </div>

            {selectedProjectId && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Selecteer niet-gefactureerde uren</h3>
                    <div className="border rounded-lg max-h-48 overflow-y-auto mb-4">
                        {unbilledEntries.length > 0 ? unbilledEntries.map(entry => (
                            <div key={entry.id} className="flex items-center p-3 border-b last:border-b-0">
                                <input type="checkbox" checked={selectedEntryIds.has(entry.id)} onChange={() => handleToggleEntry(entry.id)} className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500" />
                                <div className="ml-3 text-sm flex-grow">
                                    <p className="font-medium text-gray-900">{entry.description}</p>
                                    <p className="text-gray-500">{entry.startTime.toLocaleDateString('nl-NL')} - {(entry.accumulatedDuration/3600000).toFixed(2)} uur</p>
                                </div>
                            </div>
                        )) : <p className="p-4 text-gray-500">Geen niet-gefactureerde uren voor dit project.</p>}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Handmatige regels (bv. korting)</h3>
                    <div className="border rounded-lg p-4 mb-4">
                        {manualItems.map((item, i) => (
                            <div key={i} className="text-sm text-gray-600 mb-1">{item.description} ({item.quantity} x €{item.price})</div>
                        ))}
                         <div className="flex items-center space-x-2 mt-2">
                            <input value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder="Omschrijving" className="flex-grow px-2 py-1 border rounded-md text-sm"/>
                            <input value={newItemQty} onChange={e => setNewItemQty(Number(e.target.value))} type="number" placeholder="Aantal" className="w-20 px-2 py-1 border rounded-md text-sm"/>
                            <input value={newItemPrice} onChange={e => setNewItemPrice(Number(e.target.value))} type="number" step="0.01" placeholder="Prijs" className="w-24 px-2 py-1 border rounded-md text-sm"/>
                            <button onClick={handleAddManualItem} className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300">+</button>
                         </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                         <button onClick={onCancel} className="w-1/2 px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Annuleren</button>
                        <button onClick={handleCreateInvoice} disabled={selectedEntryIds.size === 0 && manualItems.length === 0} className="w-1/2 px-6 py-2 bg-primary-500 text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 disabled:bg-primary-300 disabled:cursor-not-allowed">
                            Maak Factuur
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const InvoiceDetail: React.FC<{ invoice: Invoice, onBack: () => void }> = ({ invoice, onBack }) => {
    const { clients, updateClient, updateInvoice } = useTimeTracker();
    
    const client = useMemo(() => clients.find(c => c.id === invoice.clientId), [clients, invoice.clientId]);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editableInvoice, setEditableInvoice] = useState<Invoice | null>(null);
    const [editableClient, setEditableClient] = useState<Client | null>(null);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    const handleStartEditing = () => {
        setEditableInvoice(JSON.parse(JSON.stringify(invoice)));
        setEditableClient(client ? JSON.parse(JSON.stringify(client)) : null);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditableInvoice(null);
        setEditableClient(null);
    };

    const handleClientChange = (field: keyof Client, value: string) => {
        if (editableClient) {
            setEditableClient({ ...editableClient, [field]: value });
        }
    };
    
    const handleInvoiceDataChange = (field: keyof Invoice, value: string | Date) => {
        if (editableInvoice) {
            setEditableInvoice(prev => ({...prev!, [field]: value}));
        }
    };
    
    const recalculateInvoiceTotals = (lineItems: InvoiceLineItem[]) => {
        if (!editableInvoice) return;

        const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
        const tax = subtotal * editableInvoice.taxRate;
        const total = subtotal + tax;

        setEditableInvoice(prev => ({
            ...prev!,
            lineItems: lineItems,
            subtotal: parseFloat(subtotal.toFixed(2)),
            tax: parseFloat(tax.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
        }));
    };
    
    const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
        if (!editableInvoice) return;

        const updatedLineItems = [...editableInvoice.lineItems];
        const itemToUpdate = { ...updatedLineItems[index] };

        if (field === 'description') {
            itemToUpdate.description = value as string;
        } else if (field === 'quantity' || field === 'price') {
            const numericValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) || 0 : value;
            itemToUpdate[field] = numericValue;
        }

        itemToUpdate.total = parseFloat((itemToUpdate.quantity * itemToUpdate.price).toFixed(2));
        updatedLineItems[index] = itemToUpdate;
        
        recalculateInvoiceTotals(updatedLineItems);
    };

    const handleAddLineItem = () => {
        if (!editableInvoice) return;
        const newLineItem: InvoiceLineItem = { description: '', quantity: 1, price: 0, total: 0 };
        const updatedLineItems = [...editableInvoice.lineItems, newLineItem];
        setEditableInvoice(prev => ({
            ...prev!,
            lineItems: updatedLineItems
        }));
    };

    const handleDeleteLineItem = (indexToDelete: number) => {
        if (!editableInvoice) return;
        const updatedLineItems = editableInvoice.lineItems.filter((_, index) => index !== indexToDelete);
        recalculateInvoiceTotals(updatedLineItems);
    };

    const handleSave = async () => {
        if (!editableClient || !editableInvoice) return;
        setIsSaving(true);
        try {
            const clientHasChanged = JSON.stringify(client) !== JSON.stringify(editableClient);
            const invoiceHasChanged = JSON.stringify(invoice) !== JSON.stringify(editableInvoice);

            const promises = [];
            if (clientHasChanged) {
                promises.push(updateClient(editableClient));
            }
            if (invoiceHasChanged) {
                promises.push(updateInvoice(editableInvoice));
            }
            
            if (promises.length > 0) {
                await Promise.all(promises);
            }
            handleCancel();
        } catch (error) {
            console.error("Failed to save invoice details", error);
            alert("Opslaan mislukt. Probeer het opnieuw.");
        } finally {
            setIsSaving(false);
        }
    };

    const displayInvoice = isEditing && editableInvoice ? editableInvoice : invoice;
    const displayClient = isEditing && editableClient ? editableClient : client;

    const formatCurrency = (amount: number) => amount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', '_').replace(/,/g, '.').replace('_', ',');

    const handleDownloadPdf = () => {
        window.print();
    };
    
    const getInputClass = (isBold = false, alignment: 'left' | 'right' = 'left') => {
        const baseClass = `w-full printable-input p-0.5 -m-0.5 rounded ${isBold ? 'font-bold' : ''} text-${alignment}`;
        if (isEditing) {
            return `${baseClass} bg-yellow-100/50 outline-none ring-1 ring-primary-300`;
        }
        return `${baseClass} bg-transparent`;
    };
    
    if (!displayClient) {
        return <div>Laden...</div>
    }

    return (
        <>
            <div className="bg-white p-6 sm:p-8 md:p-12 rounded-lg shadow-2xl max-w-4xl mx-auto my-8 relative" id="invoice-to-print">
                <div className="absolute top-4 left-4 no-print">
                    <button 
                        onClick={onBack} 
                        className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Terug naar overzicht
                    </button>
                </div>
                <div className="absolute top-4 right-4 no-print flex items-center space-x-2">
                     {isEditing ? (
                        <>
                            <button onClick={handleCancel} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-300">Annuleren</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-md hover:bg-primary-600 disabled:bg-primary-300">
                                {isSaving ? 'Opslaan...' : 'Opslaan'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleStartEditing} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-300">Bewerken</button>
                            <button onClick={handleDownloadPdf} className="px-4 py-2 bg-primary-500 text-white font-semibold rounded-lg shadow-md hover:bg-primary-600">
                                Download PDF
                            </button>
                        </>
                    )}
                </div>
                <header className="flex justify-between items-start pb-8 border-b">
                    <img src={LOGO_SVG_BLUE} alt="OnlineLabs Logo" className="w-48" />
                    <div className="text-right text-xs text-gray-600">
                        <p className="font-bold text-base text-black">{COMPANY_DETAILS.name}</p>
                        <p>{COMPANY_DETAILS.address}</p>
                        <p>{COMPANY_DETAILS.zipCode} {COMPANY_DETAILS.city}</p>
                        <p className="mt-2">BTW ID: {COMPANY_DETAILS.btwId}</p>
                        <p>KVK nummer: {COMPANY_DETAILS.kvk}</p>
                        <p>{COMPANY_DETAILS.iban}</p>
                    </div>
                </header>

                <section className="flex justify-between mt-8 text-sm">
                    <div>
                        <input type="text" value={displayClient.name} onChange={e => handleClientChange('name', e.target.value)} readOnly={!isEditing} className={getInputClass(true)} />
                        <input type="text" value={displayClient.contactPerson || ''} onChange={e => handleClientChange('contactPerson', e.target.value)} readOnly={!isEditing} placeholder="T.a.v." className={getInputClass()} />
                        <input type="text" value={displayClient.address} onChange={e => handleClientChange('address', e.target.value)} readOnly={!isEditing} className={getInputClass()} />
                        {isEditing && editableClient ? (
                            <div className="flex">
                                <input type="text" value={editableClient.zipCode} onChange={e => handleClientChange('zipCode', e.target.value)} className={`${getInputClass()} w-24`} />
                                <input type="text" value={editableClient.city} onChange={e => handleClientChange('city', e.target.value)} className={`${getInputClass()} w-48 ml-2`} />
                            </div>
                        ) : (
                            <input type="text" value={`${displayClient.zipCode} ${displayClient.city}`} readOnly className={getInputClass()} />
                        )}
                    </div>
                    <div className="text-sm">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span className="font-semibold text-gray-600">Factuurnummer</span>
                            <input 
                                type="text"
                                value={displayInvoice.number}
                                onChange={e => handleInvoiceDataChange('number', e.target.value)}
                                readOnly={!isEditing}
                                className={getInputClass()}
                            />
                            <span className="font-semibold text-gray-600">Factuurdatum</span>
                             <input 
                                type="date"
                                value={new Date(displayInvoice.issueDate).toISOString().split('T')[0]}
                                onChange={e => handleInvoiceDataChange('issueDate', new Date(e.target.value))}
                                readOnly={!isEditing}
                                className={getInputClass()}
                            />
                            <span className="font-semibold text-gray-600">Uiterste betaaldatum</span>
                            <input 
                                type="date"
                                value={new Date(displayInvoice.dueDate).toISOString().split('T')[0]}
                                onChange={e => handleInvoiceDataChange('dueDate', new Date(e.target.value))}
                                readOnly={!isEditing}
                                className={getInputClass()}
                            />
                        </div>
                    </div>
                </section>
                
                <section className="mt-8 text-sm">
                    <div className="flex items-center">
                        <span className="font-semibold text-gray-600 w-20">Betreft</span>
                        <input 
                            type="text"
                            value={displayInvoice.subject}
                            onChange={e => handleInvoiceDataChange('subject', e.target.value)}
                            readOnly={!isEditing}
                            className={`${getInputClass()} ml-4`}
                        />
                         <button onClick={() => setIsAiModalOpen(true)} title="AI Assistent" className="ml-2 p-1.5 text-primary-500 hover:bg-primary-50 rounded-full no-print">
                            <SparkleIcon />
                        </button>
                    </div>
                </section>

                <section className="mt-8">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-t text-left text-sm">
                                <th className="p-2 font-normal">Omschrijving</th>
                                <th className="p-2 font-normal text-right w-24">Tijd/Aantal</th>
                                <th className="p-2 font-normal text-right w-24">Prijs</th>
                                <th className="p-2 font-normal text-right w-24">Totaal</th>
                                {isEditing && <th className="p-2 font-normal text-center w-12"></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {displayInvoice.lineItems.map((item, i) => (
                                <tr key={i} className="border-b text-xs">
                                    {isEditing ? (
                                        <>
                                            <td className="p-1">
                                                <input type="text" value={item.description} onChange={e => handleLineItemChange(i, 'description', e.target.value)} className={getInputClass()} />
                                            </td>
                                            <td className="p-1 w-24">
                                                <input type="number" step="0.01" value={item.quantity} onChange={e => handleLineItemChange(i, 'quantity', e.target.value)} className={getInputClass(false, 'right')} />
                                            </td>
                                            <td className="p-1 w-24">
                                                <input type="number" step="0.01" value={item.price} onChange={e => handleLineItemChange(i, 'price', e.target.value)} className={getInputClass(false, 'right')} />
                                            </td>
                                            <td className="p-2 text-right w-24 font-semibold">{item.total < 0 ? '-' : ''}€{formatCurrency(Math.abs(item.total))}</td>
                                            <td className="p-1 text-center w-12">
                                                <button onClick={() => handleDeleteLineItem(i)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-2">{item.description}</td>
                                            <td className="p-2 text-right w-24">{formatCurrency(item.quantity)}</td>
                                            <td className="p-2 text-right w-24">{item.price < 0 ? '-' : ''}€{formatCurrency(Math.abs(item.price))}</td>
                                            <td className="p-2 text-right w-24 font-semibold">{item.total < 0 ? '-' : ''}€{formatCurrency(Math.abs(item.total))}</td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {isEditing && (
                        <div className="mt-4">
                            <button onClick={handleAddLineItem} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-md hover:bg-gray-300">
                                + Regel toevoegen
                            </button>
                        </div>
                    )}
                </section>

                <section className="flex justify-end mt-4">
                    <div className="w-full max-w-xs text-sm">
                        <div className="flex justify-between py-1"><span>Subtotaal</span><span>€{formatCurrency(displayInvoice.subtotal)}</span></div>
                        <div className="flex justify-between py-1"><span>BTW ({(displayInvoice.taxRate * 100).toFixed(0)}%)</span><span>€{formatCurrency(displayInvoice.tax)}</span></div>
                        <div className="flex justify-between py-2 mt-2 border-t-2 border-black"><span className="font-bold">Totaal</span><span className="font-bold">€{formatCurrency(displayInvoice.total)}</span></div>
                    </div>
                </section>

                <footer className="mt-12 pt-4 border-t">
                    <p className="text-xs text-gray-600">
                        Wij verzoeken u het bovenstaande bedrag binnen 14 dagen over te maken op IBAN nummer {COMPANY_DETAILS.iban} op naam van OnlineLabs o.v.v. het factuurnummer.
                    </p>
                </footer>
                <div className="text-center text-xs text-gray-400 mt-8">Pagina 1 van 1</div>
            </div>
            <AiAssistantModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                invoice={displayInvoice}
            />
        </>
    );
};

const Invoices: React.FC = () => {
    const { invoices, clients, deleteInvoice } = useTimeTracker();
    const [view, setView] = useState<'list' | 'create'>('list');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    useEffect(() => {
        if (selectedInvoice) {
            const updatedInvoice = invoices.find(inv => inv.id === selectedInvoice.id);
            if (updatedInvoice && JSON.stringify(updatedInvoice) !== JSON.stringify(selectedInvoice)) {
                setSelectedInvoice(updatedInvoice);
            } else if (!updatedInvoice) {
                setSelectedInvoice(null);
            }
        }
    }, [invoices, selectedInvoice]);

    if (selectedInvoice) {
        return <InvoiceDetail invoice={selectedInvoice} onBack={() => setSelectedInvoice(null)} />
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Facturen</h1>
                {view === 'list' && (
                    <button onClick={() => setView('create')} className="px-5 py-2 bg-primary-500 text-white font-semibold rounded-lg shadow-md hover:bg-primary-600">
                        Nieuwe Factuur
                    </button>
                )}
            </div>

            {view === 'create' && <InvoiceCreator onInvoiceCreated={() => setView('list')} onCancel={() => setView('list')} />}

            {view === 'list' && (
                 <div className="bg-white rounded-lg shadow-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Factuur #</th>
                                    <th scope="col" className="px-6 py-3">Klant</th>
                                    <th scope="col" className="px-6 py-3">Datum</th>
                                    <th scope="col" className="px-6 py-3">Totaal</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3 text-right">Acties</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(invoice => {
                                    const client = clients.find(c => c.id === invoice.clientId);
                                    const isOverdue = new Date(invoice.dueDate) < new Date();
                                    return (
                                        <tr key={invoice.id} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedInvoice(invoice)}>
                                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{invoice.number}</td>
                                            <td className="px-6 py-4">{client?.name}</td>
                                            <td className="px-6 py-4">{new Date(invoice.issueDate).toLocaleDateString('nl-NL')}</td>
                                            <td className="px-6 py-4 font-semibold">€{invoice.total.toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                    {isOverdue ? 'Vervallen' : 'Verzonden'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteInvoice(invoice.id);
                                                    }} 
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md" 
                                                    aria-label={`Verwijder factuur ${invoice.number}`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;