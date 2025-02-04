import { IStorageService, StorageConfig } from './types';
import { LocalStorageService } from './local-storage';
import { SalesforceStorageService } from './salesforce/storage';

export class StorageFactory {
  static createStorage(config: StorageConfig): IStorageService {
    switch (config.type) {
      case 'local':
        return new LocalStorageService();
      case 'salesforce':
        return new SalesforceStorageService();
      default:
        return new LocalStorageService();
    }
  }
}
