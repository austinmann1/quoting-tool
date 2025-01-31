import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { PDFQuoteData } from '../services/pdfService';
import { pdfService } from '../services/pdfService';

// Register a default font
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf' },
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfB.ttf', fontWeight: 'bold' }
  ]
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30
  },
  header: {
    marginBottom: 20,
    borderBottom: '1pt solid #999'
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  },
  companyInfo: {
    fontSize: 10,
    color: '#666',
    marginBottom: 5
  },
  quoteInfo: {
    marginTop: 20,
    marginBottom: 20
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  quoteDetails: {
    fontSize: 12,
    marginBottom: 5
  },
  table: {
    display: 'table',
    width: 'auto',
    marginBottom: 20,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#999'
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row'
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold'
  },
  tableCell: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#999',
    padding: 5,
    fontSize: 10
  },
  totals: {
    marginTop: 20,
    alignItems: 'flex-end'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5
  },
  totalLabel: {
    width: 100,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
    marginRight: 10
  },
  totalValue: {
    width: 100,
    fontSize: 12,
    textAlign: 'right'
  },
  terms: {
    marginTop: 40,
    fontSize: 10,
    color: '#666'
  }
});

interface QuotePDFProps {
  data: PDFQuoteData;
}

export const QuotePDF: React.FC<QuotePDFProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>{data.companyName}</Text>
        <Text style={styles.companyInfo}>{data.companyAddress}</Text>
        <Text style={styles.companyInfo}>Phone: {data.companyPhone}</Text>
        <Text style={styles.companyInfo}>Email: {data.companyEmail}</Text>
      </View>

      {/* Quote Info */}
      <View style={styles.quoteInfo}>
        <Text style={styles.quoteTitle}>Quote: {data.name}</Text>
        <Text style={styles.quoteDetails}>Quote ID: {data.id}</Text>
        <Text style={styles.quoteDetails}>Date: {pdfService.formatDate(data.createdAt)}</Text>
        <Text style={styles.quoteDetails}>Created By: {data.createdBy}</Text>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCell}>Item</Text>
          <Text style={styles.tableCell}>Quantity</Text>
          <Text style={styles.tableCell}>Price</Text>
          <Text style={styles.tableCell}>Total</Text>
        </View>
        {data.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{item.unitName}</Text>
            <Text style={styles.tableCell}>{item.quantity}</Text>
            <Text style={styles.tableCell}>{pdfService.formatCurrency(item.basePrice)}</Text>
            <Text style={styles.tableCell}>{pdfService.formatCurrency(item.total)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{pdfService.formatCurrency(data.subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Discount:</Text>
          <Text style={styles.totalValue}>{pdfService.formatCurrency(data.discount)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{pdfService.formatCurrency(data.total)}</Text>
        </View>
      </View>

      {/* Terms */}
      <View style={styles.terms}>
        <Text>{data.terms}</Text>
      </View>
    </Page>
  </Document>
);

export default QuotePDF;
