import { StorageFactory } from '../services/storage/factory';
import { Quote } from '../services/quotes';

export class MigrationUtility {
  static async migrateToSalesforce(): Promise<{ success: boolean; message: string }> {
    try {
      // Create both storage instances
      const localStorage = StorageFactory.createStorage({ type: 'local' });
      const salesforceStorage = StorageFactory.createStorage({ type: 'salesforce' });

      // Get all quotes from local storage
      const quotes = await localStorage.getQuotes();
      
      if (quotes.length === 0) {
        return { 
          success: true, 
          message: 'No quotes found in local storage to migrate.' 
        };
      }

      // Migrate each quote to Salesforce
      let successCount = 0;
      let failureCount = 0;

      for (const quote of quotes) {
        try {
          const success = await salesforceStorage.createQuote(quote);
          if (success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          console.error(`Failed to migrate quote ${quote.id}:`, error);
          failureCount++;
        }
      }

      return {
        success: failureCount === 0,
        message: `Migration completed. Successfully migrated ${successCount} quotes. Failed to migrate ${failureCount} quotes.`
      };
    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        message: `Migration failed: ${error.message}`
      };
    }
  }

  static async validateMigration(): Promise<{ success: boolean; message: string }> {
    try {
      const localStorage = StorageFactory.createStorage({ type: 'local' });
      const salesforceStorage = StorageFactory.createStorage({ type: 'salesforce' });

      const localQuotes = await localStorage.getQuotes();
      const salesforceQuotes = await salesforceStorage.getQuotes();

      const localIds = new Set(localQuotes.map(q => q.id));
      const salesforceIds = new Set(salesforceQuotes.map(q => q.id));

      const missingQuotes = localQuotes.filter(q => !salesforceIds.has(q.id));

      if (missingQuotes.length === 0) {
        return {
          success: true,
          message: `All ${localQuotes.length} quotes were successfully migrated to Salesforce.`
        };
      } else {
        return {
          success: false,
          message: `Found ${missingQuotes.length} quotes that were not migrated successfully.`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Validation failed: ${error.message}`
      };
    }
  }
}
