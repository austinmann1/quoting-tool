import { quoteService } from '../quotes';
import { authService } from '../auth';
import { salesforceService } from '../salesforce';

jest.mock('../salesforce');

describe('QuoteService', () => {
  const mockQuote = {
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    items: [
      {
        id: 'item1',
        name: 'Test Item',
        quantity: 1,
        unitPrice: 100,
        total: 100,
      },
    ],
    total: 100,
    status: 'DRAFT' as const,
  };

  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear();
    // Enable demo mode for Salesforce
    salesforceService.setDemoMode(true);
    // Log in as demo user
    await authService.login('demo@codeium.com', 'demo123!@#');
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('createQuote', () => {
    it('should create a new quote', async () => {
      const result = await quoteService.createQuote(mockQuote);
      expect(result).toBe(true);

      const quotes = await quoteService.getQuotes();
      expect(quotes.length).toBe(1);
      expect(quotes[0].customerName).toBe(mockQuote.customerName);
      expect(quotes[0].items).toEqual(mockQuote.items);
    });

    it('should fail to create quote when not authenticated', async () => {
      await authService.logout();
      const result = await quoteService.createQuote(mockQuote);
      expect(result).toBe(false);

      const quotes = await quoteService.getQuotes();
      expect(quotes.length).toBe(0);
    });
  });

  describe('getQuotes', () => {
    it('should return all quotes', async () => {
      await quoteService.createQuote(mockQuote);
      const quotes = await quoteService.getQuotes();
      expect(quotes.length).toBe(1);
      expect(quotes[0].customerName).toBe(mockQuote.customerName);
    });

    it('should return empty array when not authenticated', async () => {
      await authService.logout();
      const quotes = await quoteService.getQuotes();
      expect(quotes.length).toBe(0);
    });
  });

  describe('getQuote', () => {
    it('should return quote by id', async () => {
      await quoteService.createQuote(mockQuote);
      const quotes = await quoteService.getQuotes();
      const quote = await quoteService.getQuote(quotes[0].id);
      expect(quote).toBeTruthy();
      expect(quote?.customerName).toBe(mockQuote.customerName);
    });

    it('should return null when quote not found', async () => {
      const quote = await quoteService.getQuote('non-existent-id');
      expect(quote).toBeNull();
    });
  });

  describe('updateQuote', () => {
    it('should update existing quote', async () => {
      await quoteService.createQuote(mockQuote);
      const quotes = await quoteService.getQuotes();
      const quoteId = quotes[0].id;
      
      const updatedQuote = {
        ...mockQuote,
        customerName: 'Updated Customer',
      };

      const result = await quoteService.updateQuote(quoteId, updatedQuote);
      expect(result).toBe(true);

      const quote = await quoteService.getQuote(quoteId);
      expect(quote?.customerName).toBe('Updated Customer');
    });

    it('should fail to update non-existent quote', async () => {
      const result = await quoteService.updateQuote('non-existent-id', mockQuote);
      expect(result).toBe(false);
    });
  });

  describe('deleteQuote', () => {
    it('should delete existing quote', async () => {
      await quoteService.createQuote(mockQuote);
      const quotes = await quoteService.getQuotes();
      const quoteId = quotes[0].id;
      
      const result = await quoteService.deleteQuote(quoteId);
      expect(result).toBe(true);

      const remainingQuotes = await quoteService.getQuotes();
      expect(remainingQuotes.length).toBe(0);
    });

    it('should fail to delete non-existent quote', async () => {
      const result = await quoteService.deleteQuote('non-existent-id');
      expect(result).toBe(false);
    });
  });
});
