import { SalesforceStorageService } from '../storage/salesforce/storage';
import { SalesforceConnection } from '../storage/salesforce/connection';
import { authService } from '../auth';
import type { Quote } from '../../types';

jest.mock('../auth');
jest.mock('../storage/salesforce/connection', () => {
  const mockConnection = {
    setSessionToken: jest.fn(),
    query: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    logOperation: jest.fn()
  };

  return {
    SalesforceConnection: {
      getInstance: jest.fn().mockReturnValue(mockConnection)
    }
  };
});

describe('SalesforceStorageService', () => {
  let service: SalesforceStorageService;
  let mockConnection: jest.Mocked<SalesforceConnection>;

  const mockQuoteRecord = {
    Id: 'quote1',
    Name: 'Test Quote 1',
    TotalAmount__c: 100,
    Subtotal__c: 100,
    Discount__c: 0,
    User__c: 'test-user-sf-id',
    User__r: { Name: 'Test User' },
    CreatedDate: '2023-01-01',
    LastModifiedDate: '2023-01-01',
    Status__c: 'DRAFT'
  };

  const expectedQuote: Quote = {
    id: 'quote1',
    customerName: 'Test Quote 1',
    total: 100,
    subtotal: 100,
    discount: 0,
    userId: 'test-user-sf-id',
    createdBy: 'Test User',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    status: 'DRAFT',
    items: []
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth service
    (authService.getCurrentUser as jest.Mock).mockReturnValue({
      id: 'test-user-id',
      username: 'test-user',
      email: 'test@example.com',
      roles: { isAdmin: false }
    });

    // Get mock connection from the mock module
    mockConnection = (SalesforceConnection.getInstance() as jest.Mocked<SalesforceConnection>);

    service = new SalesforceStorageService();
  });

  describe('getQuotes', () => {
    it('should return quotes for regular user', async () => {
      const mockUserId = 'test-user-sf-id';

      // Mock finding existing user
      mockConnection.query.mockResolvedValueOnce({ records: [{ Id: mockUserId }] });
      
      // Mock getting quotes
      mockConnection.query.mockResolvedValueOnce({ records: [mockQuoteRecord] });

      const quotes = await service.getQuotes();
      expect(quotes).toHaveLength(1);
      expect(quotes[0]).toEqual(expectedQuote);
    });

    it('should return all quotes for admin user', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue({
        id: 'admin-user-id',
        username: 'admin',
        email: 'admin@example.com',
        roles: { isAdmin: true }
      });

      const mockQuotes = {
        records: [
          mockQuoteRecord,
          {
            ...mockQuoteRecord,
            Id: 'quote2',
            Name: 'Test Quote 2',
            TotalAmount__c: 200,
            User__c: 'user2',
            User__r: { Name: 'User 2' }
          }
        ]
      };

      mockConnection.query.mockResolvedValue(mockQuotes);

      const quotes = await service.getQuotes();
      expect(quotes).toHaveLength(2);
      expect(quotes[0]).toEqual(expectedQuote);
      expect(quotes[1].id).toBe('quote2');
    });
  });

  describe('createQuote', () => {
    it('should create quote successfully', async () => {
      const mockUserId = 'test-user-sf-id';
      const quote = {
        customerName: 'Test Customer',
        total: 100,
        subtotal: 100,
        discount: 0,
        items: []
      };

      // Mock finding existing user
      mockConnection.query.mockResolvedValueOnce({ records: [{ Id: mockUserId }] });
      
      // Mock creating quote
      mockConnection.create.mockResolvedValueOnce({ success: true, id: 'new-quote-id' });

      const result = await service.createQuote(quote);
      expect(result).toBe(true);
      expect(mockConnection.create).toHaveBeenCalledWith('Quote__c', expect.objectContaining({
        Name: quote.customerName,
        TotalAmount__c: quote.total,
        Subtotal__c: quote.subtotal,
        Discount__c: quote.discount,
        User__c: mockUserId
      }));
    });

    it('should handle creation failure', async () => {
      const quote = {
        customerName: 'Test Customer',
        total: 100,
        subtotal: 100,
        discount: 0,
        items: []
      };

      // Mock user not found and creation failure
      mockConnection.query.mockResolvedValueOnce({ records: [] });
      mockConnection.create.mockRejectedValueOnce(new Error('Creation failed'));

      await expect(service.createQuote(quote)).rejects.toThrow();
    });
  });

  describe('updateQuote', () => {
    it('should update quote successfully', async () => {
      const mockUserId = 'test-user-sf-id';
      const quoteId = 'test-quote-id';
      const updates = {
        customerName: 'Updated Customer',
        total: 200,
        subtotal: 200,
        discount: 0
      };

      // Mock getting existing quote
      mockConnection.query.mockResolvedValueOnce({
        records: [mockQuoteRecord]
      });

      // Mock update
      mockConnection.update.mockResolvedValueOnce({ success: true });

      const result = await service.updateQuote(quoteId, updates);
      expect(result).toBe(true);
      expect(mockConnection.update).toHaveBeenCalledWith('Quote__c', expect.objectContaining({
        Id: quoteId,
        Name: updates.customerName,
        TotalAmount__c: updates.total,
        Subtotal__c: updates.subtotal,
        Discount__c: updates.discount
      }));
    });

    it('should handle unauthorized update', async () => {
      const quoteId = 'test-quote-id';
      const updates = {
        customerName: 'Updated Customer',
        total: 200,
        subtotal: 200,
        discount: 0
      };

      // Mock getting existing quote with different user
      mockConnection.query.mockResolvedValueOnce({
        records: [{
          ...mockQuoteRecord,
          User__c: 'different-user-id'
        }]
      });

      await expect(service.updateQuote(quoteId, updates))
        .rejects.toThrow('Unauthorized access to quote');
    });
  });

  describe('deleteQuote', () => {
    it('should delete quote successfully', async () => {
      const mockUserId = 'test-user-sf-id';
      const quoteId = 'test-quote-id';

      // Mock getting existing quote
      mockConnection.query.mockResolvedValueOnce({
        records: [mockQuoteRecord]
      });

      // Mock delete
      mockConnection.delete.mockResolvedValueOnce({ success: true });

      const result = await service.deleteQuote(quoteId);
      expect(result).toBe(true);
      expect(mockConnection.delete).toHaveBeenCalledWith('Quote__c', quoteId);
    });

    it('should handle unauthorized delete', async () => {
      const quoteId = 'test-quote-id';

      // Mock getting existing quote with different user
      mockConnection.query.mockResolvedValueOnce({
        records: [{
          ...mockQuoteRecord,
          User__c: 'different-user-id'
        }]
      });

      await expect(service.deleteQuote(quoteId))
        .rejects.toThrow('Unauthorized access to quote');
    });
  });
});
