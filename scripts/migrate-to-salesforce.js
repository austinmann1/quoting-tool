require('dotenv').config();
const jsforce = require('jsforce');

async function migrateToSalesforce() {
    // Get quotes from localStorage
    const quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
    if (quotes.length === 0) {
        console.log('No quotes found in localStorage to migrate');
        return;
    }

    // Create backup
    const backup = {
        timestamp: new Date().toISOString(),
        quotes: quotes
    };
    localStorage.setItem('quotes_backup', JSON.stringify(backup));
    console.log(`Created backup of ${quotes.length} quotes`);

    // Connect to Salesforce
    const conn = new jsforce.Connection({
        loginUrl: process.env.REACT_APP_SF_LOGIN_URL
    });

    try {
        await conn.login(
            process.env.REACT_APP_SF_USERNAME,
            process.env.REACT_APP_SF_PASSWORD + process.env.REACT_APP_SF_SECURITY_TOKEN
        );
        console.log('Connected to Salesforce');

        // Migrate each quote
        let successCount = 0;
        let failureCount = 0;
        const errors = [];

        for (const quote of quotes) {
            try {
                const sfQuote = {
                    Name: quote.customerName,
                    TotalAmount__c: quote.total,
                    Subtotal__c: quote.total, // Assuming no discount for now
                    Discount__c: 0,
                    Items__c: JSON.stringify(quote.items),
                    Status__c: quote.status,
                    ValidUntil__c: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                    User__c: quote.userId // This assumes the User__c record exists
                };

                const result = await conn.sobject('Quote__c').create(sfQuote);
                if (result.success) {
                    successCount++;
                    console.log(`Migrated quote ${quote.id} -> ${result.id}`);
                } else {
                    failureCount++;
                    errors.push({ quoteId: quote.id, error: result.errors });
                }
            } catch (error) {
                failureCount++;
                errors.push({ quoteId: quote.id, error: error.message });
            }
        }

        // Print summary
        console.log('\nMigration Summary:');
        console.log(`Total quotes: ${quotes.length}`);
        console.log(`Successfully migrated: ${successCount}`);
        console.log(`Failed to migrate: ${failureCount}`);
        
        if (errors.length > 0) {
            console.log('\nErrors:');
            errors.forEach(({ quoteId, error }) => {
                console.log(`Quote ${quoteId}:`, error);
            });
        }

    } catch (error) {
        console.error('Migration failed:', error);
        console.log('\nYou can restore the backup using:');
        console.log('localStorage.setItem("quotes", localStorage.getItem("quotes_backup"))');
    }
}

// Since we're running in Node.js, we need to simulate localStorage
const localStorage = {
    _data: {},
    getItem(key) {
        return this._data[key];
    },
    setItem(key, value) {
        this._data[key] = value;
    }
};

// We'll need to modify this script to work with the actual localStorage data
// For now, let's add some test data
localStorage.setItem('quotes', JSON.stringify([
    {
        id: '1',
        userId: '1',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        items: [{ id: '1', name: 'Test Item', quantity: 1, price: 100 }],
        total: 100,
        status: 'draft',
        createdBy: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
]));

migrateToSalesforce();
