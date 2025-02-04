import { StorageConfig } from './types';

export class ConfigService {
  private static instance: ConfigService;
  private storageConfig: StorageConfig;

  private constructor() {
    this.storageConfig = {
      type: (process.env.REACT_APP_STORAGE_TYPE as 'local' | 'salesforce') || 'local',
      credentials: process.env.REACT_APP_STORAGE_TYPE === 'salesforce' ? {
        username: process.env.REACT_APP_SF_USERNAME,
        password: process.env.REACT_APP_SF_PASSWORD,
        token: process.env.REACT_APP_SF_TOKEN,
        loginUrl: process.env.REACT_APP_SF_LOGIN_URL
      } : undefined
    };
  }

  static getInstance(): ConfigService {
    if (!this.instance) {
      this.instance = new ConfigService();
    }
    return this.instance;
  }

  getStorageConfig(): StorageConfig {
    return this.storageConfig;
  }
}
