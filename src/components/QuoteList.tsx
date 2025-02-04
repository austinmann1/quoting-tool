import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import { quoteService, Quote } from '../services/quotes';
import { configurationService } from '../services/configuration';
import { PDFDownloadLink } from '@react-pdf/renderer';
import QuotePDF from './QuotePDF';
import { pdfService } from '../services/pdfService';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';

export const QuoteList: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [units, setUnits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [quotesData, unitsResult] = await Promise.all([
          quoteService.getQuotes(),
          configurationService.getUnits({
            pageSize: 100,
            sortBy: 'name',
            sortOrder: 'asc',
            query: ''
          })
        ]);

        if (!mounted) return;

        if (quotesData) {
          setQuotes(quotesData);
        }

        if (unitsResult?.units) {
          const unitsMap: Record<string, string> = {};
          unitsResult.units.forEach(unit => {
            if (unit?.id) {
              unitsMap[unit.id] = unit.name || 'Unknown Product';
            }
          });
          setUnits(unitsMap);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to load quotes');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleDeleteClick = (quote: Quote) => {
    setSelectedQuote(quote);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedQuote) return;
    
    setIsDeleting(true);
    try {
      await quoteService.deleteQuoteWithAuth(selectedQuote.id);
      // Refresh quotes list
      const updatedQuotes = await quoteService.getQuotes();
      setQuotes(updatedQuotes);
      setDeleteDialogOpen(false);
      setSelectedQuote(null);
    } catch (error) {
      console.error('Error deleting quote:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete quote');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedQuote(null);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quotes
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quotes
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  // Ensure quotes is always an array and each quote has required fields
  const safeQuotes = Array.isArray(quotes) ? quotes.map(quote => ({
    id: quote?.id || `fallback_${Date.now()}`,
    items: Array.isArray(quote?.items) ? quote.items : [],
    subtotal: quote?.subtotal || 0,
    discount: quote?.discount || 0,
    total: quote?.total || 0,
    createdAt: quote?.createdAt || new Date().toISOString(),
    createdBy: quote?.createdBy || 'Unknown User',  
    status: quote?.status || 'draft',
    name: quote?.name || 'Untitled Quote'
  })) : [];

  if (safeQuotes.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quotes
        </Typography>
        <Typography sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
          No quotes found. Create a new quote to get started.
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quotes
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Quote Name</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Subtotal</TableCell>
                <TableCell align="right">Discount</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {safeQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>{quote.name}</TableCell>
                  <TableCell>{quote.createdBy}</TableCell>
                  <TableCell>{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">${(quote.subtotal || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">${(quote.discount || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">${(quote.total || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <PDFDownloadLink
                        document={<QuotePDF data={pdfService.prepareQuoteData(quote)} />}
                        fileName={`${quote.name.replace(/\s+/g, '_')}_${quote.id}.pdf`}
                      >
                        {({ blob, url, loading, error }) => (
                          <Button
                            color="primary"
                            size="small"
                            disabled={loading}
                            startIcon={<DownloadIcon />}
                          >
                            {loading ? 'Generating...' : 'Download PDF'}
                          </Button>
                        )}
                      </PDFDownloadLink>
                      <Button
                        onClick={() => handleDeleteClick(quote)}
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Quote</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this quote? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            color="error"
            variant="contained"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
