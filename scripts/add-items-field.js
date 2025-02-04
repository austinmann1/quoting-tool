require('dotenv').config();
const jsforce = require('jsforce');

async function addItemsField() {
    const conn = new jsforce.Connection({
        loginUrl: process.env.REACT_APP_SF_LOGIN_URL
    });

    try {
        await conn.login(
            process.env.REACT_APP_SF_USERNAME,
            process.env.REACT_APP_SF_PASSWORD + process.env.REACT_APP_SF_SECURITY_TOKEN
        );

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
    }
}

addItemsField();
