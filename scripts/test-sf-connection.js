require('dotenv').config();
const jsforce = require('jsforce');

async function testConnection() {
  const conn = new jsforce.Connection({
    loginUrl: process.env.REACT_APP_SF_LOGIN_URL
  });

  try {
    await conn.login(
      process.env.REACT_APP_SF_USERNAME,
      process.env.REACT_APP_SF_PASSWORD + process.env.REACT_APP_SF_SECURITY_TOKEN
    );
    console.log('Successfully connected to Salesforce');

    try {
      await conn.describe('Quote__c');
      console.log('Quote__c object exists');
    } catch (err) {
      console.log('Quote__c object does not exist, we need to create it');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testConnection();
