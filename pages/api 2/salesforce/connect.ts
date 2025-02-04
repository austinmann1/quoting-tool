import { NextApiRequest, NextApiResponse } from 'next';
import jsforce from 'jsforce';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const conn = new jsforce.Connection({
      loginUrl: process.env.NEXT_PUBLIC_SF_LOGIN_URL
    });

    await conn.login(
      process.env.SF_USERNAME!,
      process.env.SF_PASSWORD!
    );

    // Test the connection with a simple query
    try {
      await conn.query('SELECT Id FROM User LIMIT 1');
    } catch (queryError) {
      console.error('Query test failed:', queryError);
      throw new Error('Connected but unable to query Salesforce');
    }

    return res.status(200).json({
      success: true,
      accessToken: conn.accessToken,
      instanceUrl: conn.instanceUrl
    });
  } catch (error) {
    console.error('Salesforce connection error:', error);
    return res.status(500).json({ 
      error: 'Failed to connect to Salesforce',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
