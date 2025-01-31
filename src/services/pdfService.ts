import { Quote, QuoteItem } from './quotes';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { configurationService } from './configuration';

export interface PDFQuoteData extends Quote {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  terms: string;
  items: (QuoteItem & { unitName: string })[];
}

class PDFService {
  private readonly defaultCompanyInfo = {
    companyName: 'Codeium',
    companyAddress: '123 Tech Street, Silicon Valley, CA 94025',
    companyPhone: '(555) 123-4567',
    companyEmail: 'sales@codeium.com',
    terms: 'Terms and Conditions:\n1. All prices are in USD\n2. Quote valid for 30 days\n3. Delivery terms to be confirmed upon order'
  };

  prepareQuoteData(quote: Quote): PDFQuoteData {
    // Get all units
    const units = configurationService.getDemoUnits();
    const unitsMap = new Map(units.map(unit => [unit.id, unit.name]));

    // Enhance items with unit names
    const itemsWithNames = quote.items.map(item => ({
      ...item,
      unitName: unitsMap.get(item.unitId) || 'Unknown Product'
    }));

    return {
      ...quote,
      items: itemsWithNames,
      ...this.defaultCompanyInfo
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  async downloadPDF(quote: Quote): Promise<void> {
    const pdfData = this.prepareQuoteData(quote);
    // The actual PDF generation will be handled by the QuotePDF component
    // This method will be called from the UI to trigger the download
  }
}

export const pdfService = new PDFService();
