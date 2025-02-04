import { Quote } from '../../quotes';
import { IStorageService } from '../types';
import { SalesforceConnection } from './connection';
import { authService } from '../../auth';
import { SalesforceError } from './errors';

interface SalesforceUser {
  Id: string;
  Name: string;
  Email__c: string;
}

export class SalesforceStorageService implements IStorageService {
  private sfConn: SalesforceConnection | null = null;

  private async ensureConnection(): Promise<jsforce.Connection> {
    try {
      if (!this.sfConn) {
        this.sfConn = await SalesforceConnection.getInstance();
        await this.sfConn.connect();
      }
      return this.sfConn.getConnection();
    } catch (error) {
      console.error('Failed to ensure Salesforce connection:', error);
      throw new SalesforceError('CONNECTION_ERROR', 'Failed to connect to Salesforce');
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new SalesforceError('UNAUTHORIZED', 'User not authenticated');
    }
  }

  private async getOrCreateSalesforceUser(username: string, email: string): Promise<string> {
    try {
      const conn = await this.ensureConnection();
      
      // First, try to find existing user
      const result = await conn.query(
        `SELECT Id FROM User__c WHERE Email__c = '${email}' LIMIT 1`
      );

      if (result.records.length > 0) {
        return result.records[0].Id;
      }

      // If not found, create new user
      const newUser = {
        Name: username,
        Email__c: email
      };

      const createResult = await conn.sobject('User__c').create(newUser);
      if (!createResult.success) {
        throw new Error('Failed to create Salesforce user');
      }

      return createResult.id;
    } catch (error) {
      console.error('Error in getOrCreateSalesforceUser:', error);
      throw new SalesforceError('USER_ERROR', 'Failed to get or create Salesforce user');
    }
  }

  private async mapToSalesforceQuote(quote: Quote): Promise<any> {
    const currentUser = authService.getCurrentUser()!;
    const userId = await this.getOrCreateSalesforceUser(
      currentUser.username,
      currentUser.email || currentUser.username
    );

    return {
      Name: quote.customerName,
      TotalAmount__c: quote.total,
      Subtotal__c: quote.total, // Add proper subtotal calculation if needed
      Discount__c: 0, // Add proper discount calculation if needed
      ValidUntil__c: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      User__c: userId,
      Items__c: JSON.stringify(quote.items)
    };
  }

  private mapFromSalesforceQuote(record: any): Quote {
    return {
      id: record.Id,
      userId: record.User__c,
      customerName: record.Name || '',
      customerEmail: '',
      items: JSON.parse(record.Items__c || '[]'),
      total: record.TotalAmount__c || 0,
      status: 'draft',
      createdBy: record.User__r?.Name || '',
      createdAt: record.CreatedDate,
      updatedAt: record.LastModifiedDate
    };
  }

  async getQuotes(): Promise<Quote[]> {
    try {
      await this.ensureAuthenticated();
      const currentUser = authService.getCurrentUser()!;
      const conn = await this.ensureConnection();

      // Get the Salesforce User__c ID for the current user
      const userId = await this.getOrCreateSalesforceUser(
        currentUser.username,
        currentUser.email || currentUser.username
      );

      const query = currentUser.roles.isAdmin 
        ? `SELECT Id, Name, TotalAmount__c, Subtotal__c, Discount__c, Items__c, 
            User__c, User__r.Name, CreatedDate, LastModifiedDate 
            FROM Quote__c ORDER BY CreatedDate DESC`
        : `SELECT Id, Name, TotalAmount__c, Subtotal__c, Discount__c, Items__c, 
            User__c, User__r.Name, CreatedDate, LastModifiedDate 
            FROM Quote__c WHERE User__c = '${userId}' 
            ORDER BY CreatedDate DESC`;

      const result = await conn.query(query);
      return result.records.map(record => this.mapFromSalesforceQuote(record));
    } catch (error) {
      if (error instanceof SalesforceError) {
        throw error;
      }
      console.error('Error getting quotes from Salesforce:', error);
      throw new SalesforceError('QUERY_ERROR', 'Failed to get quotes from Salesforce');
    }
  }

  async getQuote(id: string): Promise<Quote | null> {
    try {
      await this.ensureAuthenticated();
      const currentUser = authService.getCurrentUser()!;
      const conn = await this.ensureConnection();

      // Get the Salesforce User__c ID for the current user
      const userId = await this.getOrCreateSalesforceUser(
        currentUser.username,
        currentUser.email || currentUser.username
      );

      const result = await conn.query(
        `SELECT Id, Name, TotalAmount__c, Subtotal__c, Discount__c, Items__c, 
         User__c, User__r.Name, CreatedDate, LastModifiedDate 
         FROM Quote__c WHERE Id = '${id}' LIMIT 1`
      );

      if (result.records.length === 0) {
        return null;
      }

      const quote = this.mapFromSalesforceQuote(result.records[0]);

      // Check if user has access to this quote
      if (!currentUser.roles.isAdmin && result.records[0].User__c !== userId) {
        throw new SalesforceError('UNAUTHORIZED', 'Unauthorized access to quote');
      }

      return quote;
    } catch (error) {
      if (error instanceof SalesforceError) {
        throw error;
      }
      console.error('Error getting quote from Salesforce:', error);
      throw new SalesforceError('QUERY_ERROR', 'Failed to get quote from Salesforce');
    }
  }

  async createQuote(quote: Omit<Quote, 'id' | 'userId' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      await this.ensureAuthenticated();
      const conn = await this.ensureConnection();

      const sfQuote = await this.mapToSalesforceQuote({
        ...quote,
        id: '', // Will be set by Salesforce
        userId: '', // Will be set in mapToSalesforceQuote
        createdBy: authService.getCurrentUser()!.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const result = await conn.sobject('Quote__c').create(sfQuote);
      return result.success;
    } catch (error) {
      console.error('Error creating quote in Salesforce:', error);
      throw new SalesforceError('CREATE_ERROR', 'Failed to create quote in Salesforce');
    }
  }

  async updateQuote(id: string, updates: Partial<Quote>): Promise<boolean> {
    try {
      await this.ensureAuthenticated();
      const quote = await this.getQuote(id);

      if (!quote) {
        throw new SalesforceError('NOT_FOUND', 'Quote not found');
      }

      // getQuote already checks for authorization

      const conn = await this.ensureConnection();
      const sfUpdates = await this.mapToSalesforceQuote({
        ...quote,
        ...updates,
        updatedAt: new Date().toISOString()
      });

      const result = await conn.sobject('Quote__c')
        .update({ Id: id, ...sfUpdates });

      return result.success;
    } catch (error) {
      if (error instanceof SalesforceError) {
        throw error;
      }
      console.error('Error updating quote in Salesforce:', error);
      throw new SalesforceError('UPDATE_ERROR', 'Failed to update quote in Salesforce');
    }
  }

  async deleteQuote(id: string): Promise<boolean> {
    try {
      await this.ensureAuthenticated();
      const quote = await this.getQuote(id);

      if (!quote) {
        throw new SalesforceError('NOT_FOUND', 'Quote not found');
      }

      // getQuote already checks for authorization

      const conn = await this.ensureConnection();
      const result = await conn.sobject('Quote__c').delete([id]);

      return result[0].success;
    } catch (error) {
      if (error instanceof SalesforceError) {
        throw error;
      }
      console.error('Error deleting quote from Salesforce:', error);
      throw new SalesforceError('DELETE_ERROR', 'Failed to delete quote from Salesforce');
    }
  }
}
