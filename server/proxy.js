require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const jsforce = require('jsforce');

const app = express();
app.use(cors());
app.use(express.json());

// Salesforce connection instance
let sfConn = null;

async function ensureConnection() {
    if (!sfConn) {
        sfConn = new jsforce.Connection({
            loginUrl: process.env.REACT_APP_SF_LOGIN_URL
        });
        await sfConn.login(
            process.env.REACT_APP_SF_USERNAME,
            process.env.REACT_APP_SF_PASSWORD + process.env.REACT_APP_SF_SECURITY_TOKEN
        );
    }
    return sfConn;
}

// Endpoint to migrate quotes
app.post('/api/migrate', async (req, res) => {
    try {
        const { quotes } = req.body;
        const conn = await ensureConnection();
        
        const results = [];
        for (const quote of quotes) {
            try {
                const sfQuote = {
                    Name: quote.customerName,
                    TotalAmount__c: quote.total,
                    Subtotal__c: quote.total,
                    Discount__c: 0,
                    Items__c: JSON.stringify(quote.items),
                    Status__c: quote.status || 'Draft',
                    ValidUntil__c: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                };

                const result = await conn.sobject('Quote__c').create(sfQuote);
                results.push({
                    quoteId: quote.id,
                    success: result.success,
                    salesforceId: result.id,
                    error: result.errors
                });
            } catch (error) {
                results.push({
                    quoteId: quote.id,
                    success: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            results
        });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
