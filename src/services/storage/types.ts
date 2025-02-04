import { Quote } from '../quotes';

export interface IStorageService {
  getQuotes(): Promise<Quote[]>;
  createQuote(quote: Omit<Quote, 'id' | 'userId' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<boolean>;
  updateQuote(id: string, updates: Partial<Quote>): Promise<boolean>;
  deleteQuote(id: string): Promise<boolean>;
  getQuote(id: string): Promise<Quote | null>;
}

export interface StorageConfig {
  type: 'local' | 'salesforce';
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
    loginUrl?: string;
  };
}

export interface SalesforceCredentials {
  username: string;
  password: string;
  token: string;
  loginUrl?: string;
}
