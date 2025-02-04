require('dotenv').config();
const jsforce = require('jsforce');

async function setupItemsField() {
    const conn = new jsforce.Connection({
        loginUrl: process.env.REACT_APP_SF_LOGIN_URL
    });

    try {
        await conn.login(
            process.env.REACT_APP_SF_USERNAME,
            process.env.REACT_APP_SF_PASSWORD + process.env.REACT_APP_SF_SECURITY_TOKEN
        );

        // First check if the field exists
        const desc = await conn.describe('Quote__c');
        const itemsField = desc.fields.find(f => f.name === 'Items__c');
        
        if (itemsField) {
            console.log('Items__c field already exists:', itemsField);
            if (itemsField.type !== 'textarea' && itemsField.length < 131072) {
                console.log('Warning: Items__c field might not be large enough for JSON data');
                console.log('Current type:', itemsField.type);
                console.log('Current length:', itemsField.length);
                console.log('Please update the field in Salesforce Setup to be a Long Text Area (131072)');
            }
            return;
        }

        console.log('Creating Items__c field...');
        const metadata = [{
            fullName: 'Quote__c.Items__c',
            label: 'Items',
            type: 'LongTextArea',
            length: 131072,
            visibleLines: 3,
            description: 'JSON string containing quote items'
        }];

        const result = await conn.metadata.create('CustomField', metadata);
        console.log('Field creation result:', result);

    } catch (err) {
        console.error('Error:', err);
        if (err.message.includes('insufficient access rights')) {
            console.log('\nPlease create the Items__c field manually in Salesforce Setup:');
            console.log('1. Go to Setup > Object Manager > Quote__c > Fields & Relationships');
            console.log('2. Click "New"');
            console.log('3. Choose "Long Text Area"');
            console.log('4. Set Field Label as "Items"');
            console.log('5. Set Length to 131072');
            console.log('6. Set Visible Lines to 3');
            console.log('7. Save the field');
        }
    }
}

setupItemsField();
