
import React, { useState } from 'react';
import { useTimeTracker } from '../hooks/useTimeTracker';
import type { Client } from '../types';

const AddClientModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { addClient } = useTimeTracker();
    const [name, setName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [address, setAddress] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [city, setCity] = useState('');
    const [btwId, setBtwId] = useState('');
    const [kvk, setKvk] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name && address && zipCode && city) {
            setIsSaving(true);
            try {
                await addClient({
                    name,
                    contactPerson,
                    address,
                    zipCode,
                    city,
                    btwId,
                    kvk,
                });
                onClose();
            } catch (error) {
                console.error("Failed to add client:", error);
                alert("Klant toevoegen mislukt.");
            } finally {
                setIsSaving(false);
            }
        } else {
            alert('Naam, adres, postcode en stad zijn verplicht.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Nieuwe Klant</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Klantnaam*</label>
                        <input type="text" id="clientName" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Contactpersoon</label>
                        <input type="text" id="contactPerson" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Adres*</label>
                        <input type="text" id="address" value={address} onChange={e => setAddress(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">Postcode*</label>
                            <input type="text" id="zipCode" value={zipCode} onChange={e => setZipCode(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">Stad*</label>
                            <input type="text" id="city" value={city} onChange={e => setCity(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="btwId" className="block text-sm font-medium text-gray-700">BTW-nummer</label>
                            <input type="text" id="btwId" value={btwId} onChange={e => setBtwId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="kvk" className="block text-sm font-medium text-gray-700">KVK-nummer</label>
                            <input type="text" id="kvk" value={kvk} onChange={e => setKvk(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-800 font-bold py-2 px-4 mr-2">Annuleren</button>
                        <button type="submit" disabled={isSaving} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:bg-primary-300">
                            {isSaving ? 'Opslaan...' : 'Klant Opslaan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Clients: React.FC = () => {
    const { clients, deleteClient } = useTimeTracker();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Klanten</h1>
                <button onClick={() => setIsModalOpen(true)} className="px-5 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-75">
                    Nieuwe Klant
                </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md">
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Klantnaam</th>
                                <th scope="col" className="px-6 py-3">Contactpersoon</th>
                                <th scope="col" className="px-6 py-3">Stad</th>
                                <th scope="col" className="px-6 py-3">KVK</th>
                                <th scope="col" className="px-6 py-3 text-right">Acties</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.length > 0 ? clients.map(client => (
                                <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                                    <td className="px-6 py-4">{client.contactPerson || '-'}</td>
                                    <td className="px-6 py-4">{client.city}</td>
                                    <td className="px-6 py-4">{client.kvk || '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => deleteClient(client.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md" aria-label={`Verwijder ${client.name}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">
                                        Nog geen klanten toegevoegd. Klik op 'Nieuwe Klant' om te beginnen.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {isModalOpen && <AddClientModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default Clients;
