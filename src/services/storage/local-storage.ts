import { v4 as uuidv4 } from 'uuid';
import { Quote } from '../quotes';
import { IStorageService } from './types';
import { authService } from '../auth';

export class LocalStorageService implements IStorageService {
  private readonly STORAGE_KEY = 'quotes';

  private getQuotesFromStorage(): Quote[] {
    try {
      const quotesStr = localStorage.getItem(this.STORAGE_KEY);
      return quotesStr ? JSON.parse(quotesStr) : [];
    } catch (error) {
      console.error('Error reading quotes from storage:', error);
      return [];
    }
  }

  private saveQuotesToStorage(quotes: Quote[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(quotes));
    } catch (error) {
      console.error('Error saving quotes to storage:', error);
    }
  }

  async getQuotes(): Promise<Quote[]> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const quotes = this.getQuotesFromStorage();
      return currentUser.roles.isAdmin ? quotes : quotes.filter(q => q.userId === currentUser.userId);
    } catch (error) {
      console.error('Error getting quotes:', error);
      return [];
    }
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

      const quotes = this.getQuotesFromStorage();
      quotes.push(newQuote);
      this.saveQuotesToStorage(quotes);

      return true;
    } catch (error) {
      console.error('Error creating quote:', error);
      return false;
    }
  }

  async getQuote(id: string): Promise<Quote | null> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const quotes = this.getQuotesFromStorage();
      const quote = quotes.find(q => q.id === id);

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

      const quotes = this.getQuotesFromStorage();
      const quoteIndex = quotes.findIndex(q => q.id === id);

      if (quoteIndex === -1) {
        throw new Error('Quote not found');
      }

      const quote = quotes[quoteIndex];
      if (!currentUser.roles.isAdmin && quote.userId !== currentUser.userId) {
        throw new Error('Unauthorized access to quote');
      }

      quotes[quoteIndex] = {
        ...quote,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      this.saveQuotesToStorage(quotes);
      return true;
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

      const quotes = this.getQuotesFromStorage();
      const quoteIndex = quotes.findIndex(q => q.id === id);

      if (quoteIndex === -1) {
        throw new Error('Quote not found');
      }

      const quote = quotes[quoteIndex];
      if (!currentUser.roles.isAdmin && quote.userId !== currentUser.userId) {
        throw new Error('Unauthorized access to quote');
      }

      quotes.splice(quoteIndex, 1);
      this.saveQuotesToStorage(quotes);
      return true;
    } catch (error) {
      console.error('Error deleting quote:', error);
      return false;
    }
  }
}
