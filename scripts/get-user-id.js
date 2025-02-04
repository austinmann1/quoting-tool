require('dotenv').config();
const jsforce = require('jsforce');

async function getUserId() {
  const conn = new jsforce.Connection({
    loginUrl: process.env.REACT_APP_SF_LOGIN_URL
  });

  try {
    await conn.login(
      process.env.REACT_APP_SF_USERNAME,
      process.env.REACT_APP_SF_PASSWORD + process.env.REACT_APP_SF_SECURITY_TOKEN
    );
    console.log('Connected to Salesforce');

    const userInfo = await conn.identity();
    console.log('User ID:', userInfo.user_id);
    console.log('Username:', userInfo.username);
    console.log('Organization ID:', userInfo.organization_id);
  } catch (err) {
    console.error('Error:', err);
  }
}

getUserId();
