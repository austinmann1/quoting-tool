import { NextApiRequest, NextApiResponse } from 'next';
import { SalesforceService } from './service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const sfService = SalesforceService.getInstance();
        const { quotes, user } = req.body;

        if (!quotes || !Array.isArray(quotes)) {
            return res.status(400).json({ error: 'Invalid quotes data' });
        }

        if (!user || !user.email) {
            return res.status(400).json({ error: 'User information required' });
        }

        // Get or create Salesforce user
        const sfUserId = await sfService.getOrCreateUser(
            user.email,
            user.username || user.email
        );

        const results = [];
        for (const quote of quotes) {
            try {
                const sfQuote = {
                    Name: quote.customerName,
                    TotalAmount__c: quote.total,
                    Subtotal__c: quote.total,
                    Discount__c: 0,
                    Items__c: JSON.stringify(quote.items),
                    Status__c: quote.status || 'Draft',
                    ValidUntil__c: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    User__c: sfUserId
                };

                const result = await sfService.createQuote(sfQuote);
                results.push({
                    quoteId: quote.id,
                    success: result.success,
                    salesforceId: result.id,
                    error: result.errors
                });
            } catch (error: any) {
                results.push({
                    quoteId: quote.id,
                    success: false,
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        res.json({
            success: true,
            summary: {
                total: quotes.length,
                success: successCount,
                failed: failureCount
            },
            results
        });
    } catch (error: any) {
        console.error('Migration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
