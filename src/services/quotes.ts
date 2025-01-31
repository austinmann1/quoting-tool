import { v4 as uuidv4 } from 'uuid';
import { authService } from './auth';

const DEMO_QUOTES_KEY = 'demo_quotes';

export interface QuoteItem {
  unitId: string;
  quantity: number;
  basePrice: number;
  discount: number;
  total: number;
}

export interface Quote {
  id: string;
  name: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
  createdBy: string;
  userId: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

class QuoteService {
  private isDemoMode: boolean;
  private readonly STORAGE_KEY = 'demo_quotes'; // Changed to match existing key

  constructor() {
    // Initialize demo mode based on auth service
    this.isDemoMode = !authService.getCurrentSession()?.accessToken;
  }

  private generateUniqueId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `quote_${timestamp}_${random}`;
  }

  private getDemoQuotes(): Quote[] {
    const quotesStr = localStorage.getItem(this.STORAGE_KEY);
    const quotes = quotesStr ? JSON.parse(quotesStr) : [];
    console.log('Retrieved quotes from storage:', quotes); // Debug log
    return quotes;
  }

  private setDemoQuotes(quotes: Quote[]): void {
    console.log('Saving quotes to storage:', quotes); // Debug log
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(quotes));
  }

  async createQuote(quoteData: Omit<Quote, 'id' | 'createdAt' | 'createdBy' | 'userId' | 'status'>): Promise<Quote> {
    const currentUser = authService.getCurrentSession();
    if (!currentUser) {
      throw new Error('User must be logged in to create a quote');
    }

    const newQuote: Quote = {
      ...quoteData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.username,
      userId: currentUser.userId,
      status: 'draft'
    };

    console.log('Creating new quote:', newQuote); // Debug log
    const quotes = this.getDemoQuotes();
    quotes.push(newQuote);
    this.setDemoQuotes(quotes);

    return newQuote;
  }

  async getQuotes(): Promise<Quote[]> {
    const currentUser = authService.getCurrentSession();
    if (!currentUser) {
      throw new Error('User must be logged in to view quotes');
    }

    const quotes = this.getDemoQuotes();
    console.log('All quotes:', quotes); // Debug log
    console.log('Current user:', currentUser); // Debug log
    
    // If user is admin, return all quotes
    if (currentUser.role === 'admin') {
      return quotes;
    }

    // Otherwise, return only the user's quotes
    const userQuotes = quotes.filter(quote => quote.userId === currentUser.userId);
    console.log('Filtered user quotes:', userQuotes); // Debug log
    return userQuotes;
  }

  async getQuote(id: string): Promise<Quote | null> {
    if (this.isDemoMode) {
      const quotes = this.getDemoQuotes();
      return Promise.resolve(quotes.find(q => q.id === id) || null);
    } else {
      // TODO: Add API integration here
      // For now, use demo mode for all cases
      const quotes = this.getDemoQuotes();
      return Promise.resolve(quotes.find(q => q.id === id) || null);
    }
  }

  async updateQuoteStatus(id: string, status: Quote['status']): Promise<void> {
    if (this.isDemoMode) {
      const quotes = this.getDemoQuotes();
      const index = quotes.findIndex(q => q.id === id);
      if (index === -1) throw new Error('Quote not found');
      
      quotes[index] = {
        ...quotes[index],
        status
      };
      
      this.setDemoQuotes(quotes);
      return Promise.resolve();
    } else {
      // TODO: Add API integration here
      // For now, use demo mode for all cases
      const quotes = this.getDemoQuotes();
      const index = quotes.findIndex(q => q.id === id);
      if (index === -1) throw new Error('Quote not found');
      
      quotes[index] = {
        ...quotes[index],
        status
      };
      
      this.setDemoQuotes(quotes);
      return Promise.resolve();
    }
  }

  async deleteQuote(quoteId: string): Promise<void> {
    try {
      const quotes = this.getDemoQuotes();
      console.log('Before deletion:', quotes.length, 'quotes');
      const updatedQuotes = quotes.filter(quote => quote.id !== quoteId);
      console.log('After deletion:', updatedQuotes.length, 'quotes');
      this.setDemoQuotes(updatedQuotes);
      return Promise.resolve();
    } catch (error) {
      console.error('Error deleting quote:', error);
      return Promise.reject(new Error('Failed to delete quote'));
    }
  }

  async deleteQuoteWithAuth(quoteId: string): Promise<void> {
    const currentUser = authService.getCurrentSession();
    if (!currentUser) {
      throw new Error('User must be logged in to delete quotes');
    }

    const quotes = this.getDemoQuotes();
    const quote = quotes.find(q => q.id === quoteId);
    
    if (!quote) {
      throw new Error('Quote not found');
    }

    // Only allow deletion if user is admin or quote owner
    if (currentUser.role !== 'admin' && quote.userId !== currentUser.userId) {
      throw new Error('Unauthorized to delete this quote');
    }

    const updatedQuotes = quotes.filter(q => q.id !== quoteId);
    this.setDemoQuotes(updatedQuotes);
  }

  async updateQuoteStatusWithAuth(id: string, status: Quote['status']): Promise<Quote> {
    const currentUser = authService.getCurrentSession();
    if (!currentUser) {
      throw new Error('User must be logged in to update quote status');
    }

    const quotes = this.getDemoQuotes();
    const quoteIndex = quotes.findIndex(q => q.id === id);
    
    if (quoteIndex === -1) {
      throw new Error('Quote not found');
    }

    const quote = quotes[quoteIndex];

    // Only allow status updates if user is admin or quote owner
    if (currentUser.role !== 'admin' && quote.userId !== currentUser.userId) {
      throw new Error('Unauthorized to update this quote');
    }

    // Add validation rules for status changes
    if (currentUser.role !== 'admin' && (status === 'approved' || status === 'rejected')) {
      throw new Error('Only administrators can approve or reject quotes');
    }

    quotes[quoteIndex] = {
      ...quote,
      status
    };

    this.setDemoQuotes(quotes);
    return quotes[quoteIndex];
  }

  async updateQuoteStatus(id: string, status: Quote['status']): Promise<Quote> {
    const currentUser = authService.getCurrentSession();
    if (!currentUser) {
      throw new Error('User must be logged in to update quote status');
    }

    const quotes = this.getDemoQuotes();
    const quoteIndex = quotes.findIndex(q => q.id === id);
    
    if (quoteIndex === -1) {
      throw new Error('Quote not found');
    }

    const quote = quotes[quoteIndex];

    // Only allow status updates if user is admin or quote owner
    if (currentUser.role !== 'admin' && quote.userId !== currentUser.userId) {
      throw new Error('Unauthorized to update this quote');
    }

    // Add validation rules for status changes
    if (currentUser.role !== 'admin' && (status === 'approved' || status === 'rejected')) {
      throw new Error('Only administrators can approve or reject quotes');
    }

    quotes[quoteIndex] = {
      ...quote,
      status
    };

    this.setDemoQuotes(quotes);
    return quotes[quoteIndex];
  }
}

export const quoteService = new QuoteService();
