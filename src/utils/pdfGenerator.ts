import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Product } from './products';
import { QuoteData } from '../services/salesforce';

interface QuoteItem {
  productId: string;
  units: number;
}

export const generateQuotePDF = (quote: QuoteData, products: Product[]): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Add header with Codeium logo
  doc.setFontSize(24);
  doc.text('Codeium', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('Quote Details', pageWidth / 2, 30, { align: 'center' });

  // Add quote information
  doc.setFontSize(12);
  doc.text(`Quote Number: ${quote.Name}`, 20, 45);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 55);
  doc.text(`Status: ${quote.Status__c}`, 20, 65);

  // Parse quote items
  const items: QuoteItem[] = JSON.parse(quote.Items__c);

  // Prepare table data
  const tableData = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return null;
    
    const quantity = item.units;
    const unitPrice = product.pricePerUnit;
    const total = quantity * unitPrice;
    
    return [
      product.name,
      quantity.toString(),
      `$${unitPrice.toFixed(2)}`,
      `$${total.toFixed(2)}`
    ];
  }).filter(row => row !== null);

  // Add items table
  (doc as any).autoTable({
    startY: 75,
    head: [['Product', 'Quantity', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [25, 118, 210],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      cellPadding: 5,
      fontSize: 10,
      valign: 'middle',
      overflow: 'linebreak',
      cellWidth: 'auto'
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    }
  });

  // Add total amount
  const finalY = (doc as any).lastAutoTable.finalY || 75;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Amount: $${quote.TotalAmount__c.toFixed(2)}`, pageWidth - 20, finalY + 20, { align: 'right' });

  // Add footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for choosing Codeium!', pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });

  return doc;
};
