import jsforce from 'jsforce';
import { SalesforceCredentials } from '../types';

export class SalesforceConnection {
  private conn: jsforce.Connection;
  private static instance: SalesforceConnection;
  private isConnected: boolean = false;

  private constructor() {
    this.conn = new jsforce.Connection({
      loginUrl: process.env.REACT_APP_SF_LOGIN_URL || 'https://login.salesforce.com'
    });
  }

  static async getInstance(): Promise<SalesforceConnection> {
    if (!this.instance) {
      this.instance = new SalesforceConnection();
    }
    return this.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    if (!process.env.REACT_APP_SF_USERNAME || 
        !process.env.REACT_APP_SF_PASSWORD || 
        !process.env.REACT_APP_SF_SECURITY_TOKEN) {
      throw new Error('Missing Salesforce credentials');
    }

    try {
      await this.conn.login(
        process.env.REACT_APP_SF_USERNAME,
        process.env.REACT_APP_SF_PASSWORD + process.env.REACT_APP_SF_SECURITY_TOKEN
      );
      this.isConnected = true;
    } catch (error) {
      console.error('Salesforce connection error:', error);
      throw new Error('Failed to connect to Salesforce');
    }
  }

  getConnection(): jsforce.Connection {
    if (!this.isConnected) {
      throw new Error('Not connected to Salesforce');
    }
    return this.conn;
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.conn.logout();
      this.isConnected = false;
    }
  }
}
