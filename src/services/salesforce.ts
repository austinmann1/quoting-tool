import jsforce from 'jsforce';
import { configurationService } from './configuration';
import { authService } from './auth';

type SalesforceRecord = Record<string, any>;

export interface QuoteData {
  Id?: string;
  Name: string;
  TotalAmount__c: number;
  Status__c: string;
  Items__c: string; // JSON string of quote items
  AccountId?: string;
}

export interface QuoteCalculation {
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  discountApplied: boolean;
}

export interface QuoteItem {
  productId: string;
  units: number;
}

const DEMO_STORAGE_KEY = 'demo_quotes';

class SalesforceService {
  private conn: jsforce.Connection;
  private isDemoMode: boolean = false;
  private userId: string | null = null;

  constructor() {
    if (!process.env.REACT_APP_SF_LOGIN_URL) {
      console.error('Salesforce login URL not configured');
    }
    
    this.conn = new jsforce.Connection({
      loginUrl: process.env.REACT_APP_SF_LOGIN_URL || 'https://test.salesforce.com',
      version: '57.0'
    });
  }

  private getDemoQuotes(): QuoteData[] {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (err) {
      console.error('Error parsing stored quotes:', err);
      return [];
    }
  }

  private setDemoQuotes(quotes: QuoteData[]) {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(quotes));
  }

  setDemoMode(isDemo: boolean) {
    this.isDemoMode = isDemo;
    configurationService.setDemoMode(isDemo);
  }

  async login(username: string, password: string): Promise<boolean> {
    if (this.isDemoMode) {
      this.userId = 'demo-user';
      return true;
    }

    try {
      const userInfo = await this.conn.login(username, password);
      this.userId = userInfo.id;
      return true;
    } catch (err) {
      console.error('Salesforce login error:', err);
      throw err;
    }
  }

  async calculateQuote(items: QuoteItem[]): Promise<QuoteCalculation> {
    try {
      // Get current prices and discount rules
      const [prices, discounts] = await Promise.all([
        Promise.all(items.map(item => configurationService.getCurrentPrice(item.productId))),
        configurationService.getCurrentDiscounts()
      ]);

      // Calculate subtotal
      let subtotal = 0;
      items.forEach((item, index) => {
        subtotal += item.units * prices[index];
      });

      // Calculate total units for volume discount
      const totalUnits = items.reduce((sum, item) => sum + item.units, 0);

      // Find applicable volume discount
      const volumeDiscount = discounts.find(d => 
        d.type === 'VOLUME' && 
        totalUnits >= d.threshold &&
        !d.endDate // Only use active discounts
      );

      let discountAmount = 0;
      let discountApplied = false;

      if (volumeDiscount) {
        discountAmount = (subtotal * volumeDiscount.discountPercentage) / 100;
        discountApplied = true;
      }

      return {
        subtotal,
        discountAmount,
        totalAmount: subtotal - discountAmount,
        discountApplied
      };
    } catch (err) {
      console.error('Error calculating quote:', err);
      throw new Error('Failed to calculate quote');
    }
  }

  async createQuote(quoteData: QuoteData): Promise<any> {
    if (this.isDemoMode) {
      const quotes = this.getDemoQuotes();
      const newQuote = {
        ...quoteData,
        Id: 'demo-' + Date.now(),
        CreatedDate: new Date().toISOString()
      };
      quotes.push(newQuote);
      this.setDemoQuotes(quotes);
      return { id: newQuote.Id, success: true };
    }

    try {
      const result = await this.conn.sobject('Quote__c').create(quoteData);
      return result;
    } catch (err) {
      console.error('Error creating quote:', err);
      throw err;
    }
  }

  async getQuotes(): Promise<QuoteData[]> {
    if (this.isDemoMode) {
      return this.getDemoQuotes();
    }

    try {
      const result = await this.conn.query<QuoteData>(
        'SELECT Id, Name, TotalAmount__c, Status__c, Items__c FROM Quote__c ORDER BY CreatedDate DESC'
      );
      return result.records;
    } catch (err) {
      console.error('Error fetching quotes:', err);
      throw err;
    }
  }

  async updateQuote(quoteId: string, updates: Partial<QuoteData>): Promise<any> {
    if (this.isDemoMode) {
      const quotes = this.getDemoQuotes();
      const index = quotes.findIndex(q => q.Id === quoteId);
      if (index === -1) throw new Error('Quote not found');
      
      quotes[index] = { ...quotes[index], ...updates };
      this.setDemoQuotes(quotes);
      return { success: true };
    }

    try {
      const result = await this.conn.sobject('Quote__c').update({
        Id: quoteId,
        ...updates
      });
      return result;
    } catch (err) {
      console.error('Error updating quote:', err);
      throw err;
    }
  }

  async deleteQuote(quoteId: string): Promise<any> {
    if (this.isDemoMode) {
      const quotes = this.getDemoQuotes().filter(q => q.Id !== quoteId);
      this.setDemoQuotes(quotes);
      return { success: true };
    }

    try {
      const result = await this.conn.sobject('Quote__c').delete(quoteId);
      return result;
    } catch (err) {
      console.error('Error deleting quote:', err);
      throw err;
    }
  }

  async query<T>(objectName: string, soql: string): Promise<T[]> {
    if (this.isDemoMode) {
      throw new Error('Query not supported in demo mode');
    }

    try {
      const result = await this.conn.query(soql);
      return result.records as T[];
    } catch (err) {
      console.error(`Error querying ${objectName}:`, err);
      throw err;
    }
  }

  async createRecord(objectName: string, data: SalesforceRecord): Promise<any> {
    if (this.isDemoMode) {
      throw new Error('Create record not supported in demo mode');
    }

    try {
      const result = await this.conn.sobject(objectName).create(data);
      return result;
    } catch (err) {
      console.error(`Error creating ${objectName}:`, err);
      throw err;
    }
  }

  async updateRecord(objectName: string, recordId: string, data: SalesforceRecord): Promise<any> {
    if (this.isDemoMode) {
      throw new Error('Update record not supported in demo mode');
    }

    try {
      const result = await this.conn.sobject(objectName).update({
        Id: recordId,
        ...data,
      });
      return result;
    } catch (err) {
      console.error(`Error updating ${objectName}:`, err);
      throw err;
    }
  }
}

export const salesforceService = new SalesforceService();
