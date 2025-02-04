import type { NextPage } from 'next';
import { useEffect } from 'react';
import { salesforceService } from '../src/services/salesforce';

const Home: NextPage = () => {
  useEffect(() => {
    // Test Salesforce connection on page load
    const testConnection = async () => {
      try {
        const connected = await salesforceService.connectWithServiceAccount();
        console.log('Salesforce connection:', connected ? 'success' : 'failed');
      } catch (error) {
        console.error('Connection error:', error);
      }
    };

    testConnection();
  }, []);

  return (
    <div>
      <h1>Quoting Tool</h1>
      <p>Check console for connection status</p>
    </div>
  );
};

export default Home;
