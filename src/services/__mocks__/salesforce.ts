import { Quote } from '../../types/quote';

class SalesforceService {
  private demoMode = false;
  private isLoggedIn = false;
  private quotes: Quote[] = [];

  setDemoMode(enabled: boolean): void {
    this.demoMode = enabled;
  }

  async login(username: string, password: string): Promise<boolean> {
    // In demo mode, always return false for invalid credentials
    if (this.demoMode) {
      return false;
    }
    return false;
  }

  async logout(): Promise<void> {
    // No-op in mock
  }

  async createQuote(quote: Quote): Promise<boolean> {
    if (!this.isLoggedIn && !this.demoMode) return false;
    this.quotes.push(quote);
    return true;
  }

  async getQuotes(): Promise<Quote[]> {
    if (!this.isLoggedIn && !this.demoMode) return [];
    return this.quotes;
  }

  async getQuote(id: string): Promise<Quote | null> {
    if (!this.isLoggedIn && !this.demoMode) return null;
    return this.quotes.find(q => q.id === id) || null;
  }

  async updateQuote(id: string, quote: Quote): Promise<boolean> {
    if (!this.isLoggedIn && !this.demoMode) return false;
    const index = this.quotes.findIndex(q => q.id === id);
    if (index === -1) return false;
    this.quotes[index] = quote;
    return true;
  }

  async deleteQuote(id: string): Promise<boolean> {
    if (!this.isLoggedIn && !this.demoMode) return false;
    const index = this.quotes.findIndex(q => q.id === id);
    if (index === -1) return false;
    this.quotes.splice(index, 1);
    return true;
  }
}

export const salesforceService = new SalesforceService();
