import jsforce from 'jsforce';

export class SalesforceService {
    private static instance: SalesforceService;
    private connection: jsforce.Connection | null = null;

    private constructor() {}

    static getInstance(): SalesforceService {
        if (!SalesforceService.instance) {
            SalesforceService.instance = new SalesforceService();
        }
        return SalesforceService.instance;
    }

    async connect(): Promise<jsforce.Connection> {
        if (!this.connection) {
            this.connection = new jsforce.Connection({
                loginUrl: process.env.REACT_APP_SF_LOGIN_URL
            });

            await this.connection.login(
                process.env.REACT_APP_SF_USERNAME!,
                process.env.REACT_APP_SF_PASSWORD! + process.env.REACT_APP_SF_SECURITY_TOKEN!
            );
        }
        return this.connection;
    }

    async createQuote(quote: any): Promise<any> {
        const conn = await this.connect();
        return conn.sobject('Quote__c').create(quote);
    }

    async getOrCreateUser(email: string, name: string): Promise<string> {
        const conn = await this.connect();
        
        // First, try to find existing user
        const result = await conn.query(
            `SELECT Id FROM User__c WHERE Email__c = '${email}' LIMIT 1`
        );

        if (result.records.length > 0) {
            return result.records[0].Id;
        }

        // If not found, create new user
        const createResult = await conn.sobject('User__c').create({
            Name: name,
            Email__c: email
        });

        if (!createResult.success) {
            throw new Error('Failed to create Salesforce user');
        }

        return createResult.id;
    }
}
