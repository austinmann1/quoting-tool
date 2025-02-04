import { SalesforceStorageService } from '../salesforce/storage';
import { SalesforceConnection } from '../salesforce/connection';
import { authService } from '../../auth';
import { Quote } from '../../quotes';
import { SalesforceError } from '../salesforce/errors';

jest.mock('../salesforce/connection');
jest.mock('../../auth');

describe('SalesforceStorageService', () => {
  let service: SalesforceStorageService;
  let mockConnection: any;
  let mockQuery: jest.Mock;
  let mockCreate: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;

  const mockUser = {
    Id: 'test-user-id',
    Name: 'Test User',
    Email__c: 'test@example.com'
  };

  const mockQuote = {
    Id: '1',
    Name: 'Test Quote',
    TotalAmount__c: 100,
    Subtotal__c: 100,
    Discount__c: 0,
    Items__c: '[]',
    User__c: 'test-user-id',
    User__r: {
      Name: 'Test User'
    },
    CreatedDate: '2023-01-01',
    LastModifiedDate: '2023-01-01',
    ValidUntil__c: '2023-02-01'
  };

  beforeEach(() => {
    mockQuery = jest.fn();
    mockCreate = jest.fn();
    mockUpdate = jest.fn();
    mockDelete = jest.fn();

    mockConnection = {
      query: mockQuery,
      sobject: jest.fn(() => ({
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete
      }))
    };

    (SalesforceConnection.getInstance as jest.Mock).mockResolvedValue({
      connect: jest.fn(),
      getConnection: jest.fn().mockReturnValue(mockConnection)
    });

    (authService.getCurrentUser as jest.Mock).mockReturnValue({
      userId: 'test-user-id',
      username: 'test@example.com',
      email: 'test@example.com',
      roles: { isAdmin: false }
    });

    service = new SalesforceStorageService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getQuotes', () => {
    it('should return quotes for regular user', async () => {
      // Mock user lookup
      mockQuery.mockResolvedValueOnce({ records: [mockUser] });
      // Mock quotes lookup
      mockQuery.mockResolvedValueOnce({ records: [mockQuote] });

      const quotes = await service.getQuotes();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE User__c ='));
      expect(quotes).toHaveLength(1);
      expect(quotes[0]).toEqual(expect.objectContaining({
        id: '1',
        total: 100,
        createdBy: 'Test User'
      }));
    });

    it('should return all quotes for admin user', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue({
        userId: 'admin-id',
        username: 'admin@example.com',
        email: 'admin@example.com',
        roles: { isAdmin: true }
      });

      // Mock user lookup
      mockQuery.mockResolvedValueOnce({ records: [mockUser] });
      // Mock quotes lookup
      mockQuery.mockResolvedValueOnce({ records: [] });

      await service.getQuotes();

      expect(mockQuery).toHaveBeenCalledWith(expect.not.stringContaining('WHERE'));
    });

    it('should handle unauthenticated user', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue(null);

      await expect(service.getQuotes())
        .rejects
        .toThrow(new SalesforceError('UNAUTHORIZED', 'User not authenticated'));
    });
  });

  describe('createQuote', () => {
    const newQuote: Omit<Quote, 'id' | 'userId' | 'createdBy' | 'createdAt' | 'updatedAt'> = {
      customerName: 'New Customer',
      customerEmail: 'new@example.com',
      total: 200,
      status: 'draft',
      items: []
    };

    it('should create quote successfully', async () => {
      // Mock user lookup to return consistent ID
      mockQuery.mockResolvedValueOnce({ 
        records: [{
          Id: 'test-user-id',
          Name: 'Test User',
          Email__c: 'test@example.com'
        }]
      });
      
      mockCreate.mockResolvedValueOnce({ success: true, id: 'new-1' });

      const result = await service.createQuote(newQuote);

      expect(result).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        TotalAmount__c: 200,
        User__c: 'test-user-id'
      }));
    });

    it('should handle creation failure', async () => {
      // Mock user lookup
      mockQuery.mockResolvedValueOnce({ records: [mockUser] });
      mockCreate.mockRejectedValueOnce(new Error('Creation failed'));

      await expect(service.createQuote(newQuote))
        .rejects
        .toThrow(new SalesforceError('CREATE_ERROR', 'Failed to create quote in Salesforce'));
    });
  });

  describe('updateQuote', () => {
    const updates = {
      customerName: 'Updated Customer',
      total: 300
    };

    it('should update quote successfully', async () => {
      // Mock initial user lookup
      mockQuery.mockResolvedValueOnce({ 
        records: [{
          Id: 'test-user-id',
          Name: 'Test User',
          Email__c: 'test@example.com'
        }]
      });
      
      // Mock quote lookup with matching user ID
      mockQuery.mockResolvedValueOnce({ 
        records: [{
          ...mockQuote,
          User__c: 'test-user-id' // Ensure this matches the current user's ID
        }]
      });
      
      // Mock user lookup for update
      mockQuery.mockResolvedValueOnce({ 
        records: [{
          Id: 'test-user-id',
          Name: 'Test User',
          Email__c: 'test@example.com'
        }]
      });
      
      mockUpdate.mockResolvedValueOnce({ success: true });

      const result = await service.updateQuote('1', updates);

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        Id: '1',
        TotalAmount__c: 300
      }));
    });

    it('should handle unauthorized update', async () => {
      // Mock initial user lookup
      mockQuery.mockResolvedValueOnce({ 
        records: [{
          Id: 'test-user-id',
          Name: 'Test User',
          Email__c: 'test@example.com'
        }]
      });
      
      // Mock quote lookup with different user ID
      mockQuery.mockResolvedValueOnce({ 
        records: [{
          ...mockQuote,
          User__c: 'different-user-id'
        }]
      });

      await expect(service.updateQuote('1', updates))
        .rejects
        .toThrow('Unauthorized access to quote');
    });
  });

  describe('deleteQuote', () => {
    it('should delete quote successfully', async () => {
      // Mock initial user lookup
      mockQuery.mockResolvedValueOnce({ 
        records: [{
          Id: 'test-user-id',
          Name: 'Test User',
          Email__c: 'test@example.com'
        }]
      });
      
      // Mock quote lookup with matching user ID
      mockQuery.mockResolvedValueOnce({ 
        records: [{
          ...mockQuote,
          User__c: 'test-user-id' // Ensure this matches the current user's ID
        }]
      });
      
      mockDelete.mockResolvedValueOnce([{ success: true }]);

      const result = await service.deleteQuote('1');

      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith(['1']);
    });

    it('should handle unauthorized delete', async () => {
      // Mock initial user lookup
      mockQuery.mockResolvedValueOnce({ 
        records: [{
          Id: 'test-user-id',
          Name: 'Test User',
          Email__c: 'test@example.com'
        }]
      });
      
      // Mock quote lookup with different user ID
      mockQuery.mockResolvedValueOnce({ 
        records: [{
          ...mockQuote,
          User__c: 'different-user-id'
        }]
      });

      await expect(service.deleteQuote('1'))
        .rejects
        .toThrow('Unauthorized access to quote');
    });
  });
});
