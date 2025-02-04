require('dotenv').config();
const jsforce = require('jsforce');

async function createUserField() {
  const conn = new jsforce.Connection({
    loginUrl: process.env.REACT_APP_SF_LOGIN_URL
  });

  try {
    await conn.login(
      process.env.REACT_APP_SF_USERNAME,
      process.env.REACT_APP_SF_PASSWORD + process.env.REACT_APP_SF_SECURITY_TOKEN
    );
    console.log('Connected to Salesforce');

    // Create new field
    const metadata = {
      fullName: 'Quote__c.SFUser__c',
      label: 'Salesforce User',
      type: 'Lookup',
      referenceTo: 'User',
      relationshipLabel: 'Quotes',
      relationshipName: 'Quotes',
      required: true,
      deleteConstraint: 'Restrict'
    };

    const result = await conn.metadata.create('CustomField', metadata);
    console.log('Field creation result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

createUserField();
