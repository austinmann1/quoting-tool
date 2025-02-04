require('dotenv').config();
const jsforce = require('jsforce');

async function testCRUD() {
  const conn = new jsforce.Connection({
    loginUrl: process.env.REACT_APP_SF_LOGIN_URL
  });

  try {
    // Login
    await conn.login(
      process.env.REACT_APP_SF_USERNAME,
      process.env.REACT_APP_SF_PASSWORD + process.env.REACT_APP_SF_SECURITY_TOKEN
    );
    console.log('Connected to Salesforce');

    // Use the custom User__c ID we created
    const userId = 'a04bm000001rfqrAAA';
    console.log('Using custom User__c ID:', userId);

    // Create a test quote
    const testQuote = {
      TotalAmount__c: 1000,
      Subtotal__c: 1000,
      Discount__c: 0,
      ValidUntil__c: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      User__c: userId
    };

    console.log('Creating test quote...');
    const createResult = await conn.sobject('Quote__c').create(testQuote);
    if (createResult.success) {
      console.log('Created quote with ID:', createResult.id);

      // Read the quote
      console.log('Reading quote...');
      const quote = await conn.sobject('Quote__c')
        .select('Id, Name, TotalAmount__c, Subtotal__c, Discount__c, ValidUntil__c, User__c')
        .where({ Id: createResult.id })
        .execute();
      console.log('Retrieved quote:', quote);

      // Update the quote
      console.log('Updating quote...');
      const updateResult = await conn.sobject('Quote__c')
        .update({
          Id: createResult.id,
          TotalAmount__c: 1500,
          Subtotal__c: 1500
        });
      console.log('Update success:', updateResult.success);

      // Delete the quote
      console.log('Deleting quote...');
      const deleteResult = await conn.sobject('Quote__c')
        .destroy(createResult.id);
      console.log('Delete success:', deleteResult.success);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testCRUD();
