import { v4 as uuidv4 } from 'uuid';
import { authService } from './auth';
import { salesforceService } from './salesforce';
import { StorageFactory } from './storage/factory';
import { ConfigService } from './storage/config';

export interface Quote {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: QuoteItem[];
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

class QuoteService {
  private storage;

  constructor() {
    const config = ConfigService.getInstance().getStorageConfig();
    this.storage = StorageFactory.createStorage(config);
  }

  async createQuote(quote: Omit<Quote, 'id' | 'userId' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const newQuote: Quote = {
        ...quote,
        id: uuidv4(),
        userId: currentUser.userId,
        createdBy: currentUser.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return this.storage.createQuote(newQuote);
    } catch (error) {
      console.error('Error creating quote:', error);
      return false;
    }
  }

  async getQuotes(): Promise<Quote[]> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const quotes = await this.storage.getQuotes();
      return currentUser.roles.isAdmin ? quotes : quotes.filter(q => q.userId === currentUser.userId);
    } catch (error) {
      console.error('Error getting quotes:', error);
      return [];
    }
  }

  async getQuote(id: string): Promise<Quote | null> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const quote = await this.storage.getQuote(id);

      if (!quote) {
        return null;
      }

      if (!currentUser.roles.isAdmin && quote.userId !== currentUser.userId) {
        throw new Error('Unauthorized access to quote');
      }

      return quote;
    } catch (error) {
      console.error('Error getting quote:', error);
      return null;
    }
  }

  async updateQuote(id: string, updates: Partial<Quote>): Promise<boolean> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const quote = await this.storage.getQuote(id);

      if (!quote) {
        throw new Error('Quote not found');
      }

      if (!currentUser.roles.isAdmin && quote.userId !== currentUser.userId) {
        throw new Error('Unauthorized access to quote');
      }

      return this.storage.updateQuote(id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating quote:', error);
      return false;
    }
  }

  async deleteQuote(id: string): Promise<boolean> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const quote = await this.storage.getQuote(id);

      if (!quote) {
        throw new Error('Quote not found');
      }

      if (!currentUser.roles.isAdmin && quote.userId !== currentUser.userId) {
        throw new Error('Unauthorized access to quote');
      }

      return this.storage.deleteQuote(id);
    } catch (error) {
      console.error('Error deleting quote:', error);
      return false;
    }
  }
}

export const quoteService = new QuoteService();
