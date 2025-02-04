import React, { useState } from 'react';
import { authService } from '../services/auth';

export const DataMigration: React.FC = () => {
    const [status, setStatus] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<{
        total: number;
        success: number;
        failed: number;
        errors: Array<{ quoteId: string; error: string }>;
    } | null>(null);

    const createBackup = () => {
        const quotes = localStorage.getItem('quotes');
        if (quotes) {
            const backup = {
                timestamp: new Date().toISOString(),
                quotes: JSON.parse(quotes)
            };
            localStorage.setItem('quotes_backup', JSON.stringify(backup));
            return JSON.parse(quotes);
        }
        return [];
    };

    const restoreBackup = () => {
        const backup = localStorage.getItem('quotes_backup');
        if (backup) {
            const { quotes } = JSON.parse(backup);
            localStorage.setItem('quotes', JSON.stringify(quotes));
            setStatus('Backup restored successfully');
        } else {
            setError('No backup found');
        }
    };

    const getCurrentUser = async () => {
        return authService.getCurrentUser();
    };

    const getAllQuotes = async () => {
        const quotes = localStorage.getItem('quotes');
        if (quotes) {
            return JSON.parse(quotes);
        }
        return [];
    };

    const migrateToSalesforce = async () => {
        setIsLoading(true);
        setError(null);
        setStatus('Migrating...');
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            // Get quotes from local storage
            const rawQuotes = await getAllQuotes();
            
            // Format quotes for Salesforce
            const formattedQuotes = rawQuotes.map(quote => ({
                id: quote.id,
                customerName: quote.customerName,
                totalAmount: quote.total,
                items: quote.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                }))
            }));

            // Send quotes to API endpoint
            const response = await fetch('http://localhost:3001/api/salesforce/migrate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    quotes: formattedQuotes,
                    user: {
                        email: currentUser.email || currentUser.username,
                        username: currentUser.username
                    }
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`Migration failed: ${data.error}\nDetails: ${data.details || 'No additional details'}`);
            }

            setStatus(`Migration successful! ${data.summary?.success || 0} quotes migrated.`);
        } catch (error: any) {
            console.error('Migration error:', error);
            setStatus(`Migration failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!authService.isAdmin()) {
        return <div>Only administrators can access the data migration tool.</div>;
    }

    return (
        <div className="data-migration p-4">
            <h2 className="text-xl font-bold mb-4">Data Migration Tool</h2>
            
            <div className="mb-4">
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                    onClick={migrateToSalesforce}
                    disabled={isLoading}
                >
                    {isLoading ? 'Migrating...' : 'Migrate to Salesforce'}
                </button>
                
                <button
                    className="bg-gray-500 text-white px-4 py-2 rounded"
                    onClick={restoreBackup}
                    disabled={isLoading}
                >
                    Restore Backup
                </button>
            </div>

            {status && (
                <div className="mb-4 text-gray-700">
                    Status: {status}
                </div>
            )}

            {error && (
                <div className="mb-4 text-red-500">
                    Error: {error}
                </div>
            )}

            {summary && (
                <div className="mb-4">
                    <h3 className="font-bold mb-2">Migration Summary:</h3>
                    <p>Total quotes: {summary.total}</p>
                    <p>Successfully migrated: {summary.success}</p>
                    <p>Failed to migrate: {summary.failed}</p>
                    
                    {summary.errors.length > 0 && (
                        <div className="mt-2">
                            <h4 className="font-bold">Errors:</h4>
                            <ul className="list-disc pl-4">
                                {summary.errors.map(({ quoteId, error }) => (
                                    <li key={quoteId}>
                                        Quote {quoteId}: {error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
