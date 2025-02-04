require('dotenv').config();
const jsforce = require('jsforce');

async function checkSalesforceObjects() {
    const conn = new jsforce.Connection({
        loginUrl: process.env.REACT_APP_SF_LOGIN_URL
    });

    try {
        await conn.login(
            process.env.REACT_APP_SF_USERNAME,
            process.env.REACT_APP_SF_PASSWORD + process.env.REACT_APP_SF_SECURITY_TOKEN
        );

        console.log('Successfully connected to Salesforce');

        // Check User__c object
        try {
            const userDesc = await conn.describe('User__c');
            console.log('\nUser__c object exists with fields:');
            userDesc.fields.forEach(field => {
                console.log(`- ${field.name} (${field.type})`);
            });
        } catch (e) {
            console.error('User__c object not found or not accessible');
        }

        // Check Quote__c object
        try {
            const quoteDesc = await conn.describe('Quote__c');
            console.log('\nQuote__c object exists with fields:');
            quoteDesc.fields.forEach(field => {
                console.log(`- ${field.name} (${field.type})`);
            });
        } catch (e) {
            console.error('Quote__c object not found or not accessible');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

checkSalesforceObjects();
