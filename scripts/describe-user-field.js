require('dotenv').config();
const jsforce = require('jsforce');

async function describeUserField() {
  const conn = new jsforce.Connection({
    loginUrl: process.env.REACT_APP_SF_LOGIN_URL
  });

  try {
    await conn.login(
      process.env.REACT_APP_SF_USERNAME,
      process.env.REACT_APP_SF_PASSWORD + process.env.REACT_APP_SF_SECURITY_TOKEN
    );
    console.log('Connected to Salesforce');

    const metadata = await conn.describe('Quote__c');
    const userField = metadata.fields.find(f => f.name === 'User__c');
    console.log('User__c field details:', JSON.stringify(userField, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

describeUserField();
