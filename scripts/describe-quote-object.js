require('dotenv').config();
const jsforce = require('jsforce');

async function describeQuoteObject() {
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
    console.log('Fields:');
    metadata.fields.forEach(field => {
      console.log(`- ${field.name}: ${field.type} (${field.label})`);
    });
  } catch (err) {
    console.error('Error:', err);
  }
}

describeQuoteObject();
