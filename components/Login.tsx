

import React, { useState } from 'react';
import { useTimeTracker } from '../hooks/useTimeTracker';
import { LOGO_SVG_BLUE } from '../App';

const Login: React.FC = () => {
    const { login } = useTimeTracker();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const success = await login(email, password);
        
        setIsLoading(false);
        if (!success) {
            setError('Inloggen mislukt. Controleer uw e-mail en wachtwoord.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <div className="flex flex-col items-center">
                    <img src={LOGO_SVG_BLUE} alt="OnlineLabs Logo" className="w-48 mb-4" />
                    <h2 className="text-2xl font-bold text-center text-gray-800">Inloggen</h2>
                    <p className="mt-2 text-sm text-center text-gray-600">Welkom terug! Log in om verder te gaan.</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email-address" className="sr-only">E-mailadres</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="E-mailadres"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Wachtwoord</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Wachtwoord"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-center text-red-600 bg-red-50 p-3 rounded-lg">
                            {error}
                        </p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                        >
                            {isLoading ? 'Inloggen...' : 'Log in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;