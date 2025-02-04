require('dotenv').config();
const jsforce = require('jsforce');

async function createCustomUser() {
  const conn = new jsforce.Connection({
    loginUrl: process.env.REACT_APP_SF_LOGIN_URL
  });

  try {
    await conn.login(
      process.env.REACT_APP_SF_USERNAME,
      process.env.REACT_APP_SF_PASSWORD + process.env.REACT_APP_SF_SECURITY_TOKEN
    );
    console.log('Connected to Salesforce');

    // Get current user info
    const userInfo = await conn.identity();
    
    // Create a custom User__c record
    const customUser = {
      Name: userInfo.display_name || userInfo.username,
      Email__c: userInfo.email || process.env.REACT_APP_SF_USERNAME,
      Password__c: 'TestPassword123!' // We'll need to update this later with proper password handling
    };

    console.log('Creating custom user...');
    const result = await conn.sobject('User__c').create(customUser);
    console.log('Creation result:', result);

    if (result.success) {
      console.log('Created custom user with ID:', result.id);
      return result.id;
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

createCustomUser();
