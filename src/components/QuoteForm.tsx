import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Autocomplete,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { configurationService } from '../services/configuration';
import { quoteService } from '../services/quotes';

interface QuoteFormProps {
  // onSubmit: (quote: any) => void; // Update onSubmit type
}

interface QuoteItem {
  unitId: string;
  quantity: number;
  displayQuantity?: string;
  basePrice: number;
  discount: number;
  total: number;
}

interface Quote {
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
}

interface Unit {
  id: string;
  name: string;
  basePrice: number;
  active: boolean;
  applicableDiscounts?: string[];
  features: string[];
}

interface DiscountRule {
  id: string;
  threshold: number;
  discountPercentage: number;
}

export const QuoteForm: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([]);
  const [quoteName, setQuoteName] = useState('');

  // Reset form state when component mounts
  useEffect(() => {
    setItems([]);
    setSelectedFeatures([]);
    setError(null);
    setQuoteName('');
  }, []);

  // Load available units and discount rules
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [unitsResult, rulesResult] = await Promise.all([
          configurationService.getUnits({
            pageSize: 1000,
            sortBy: 'name',
            sortOrder: 'asc',
            query: ''
          }),
          configurationService.getDiscountRules()
        ]);
        setUnits(unitsResult.units.filter(unit => unit.active));
        setDiscountRules(rulesResult);

        // Extract all unique features
        const features = new Set<string>();
        unitsResult.units.forEach(unit => {
          unit.features.forEach(feature => features.add(feature));
        });
        setAvailableFeatures(Array.from(features));
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddItem = () => {
    if (units.length === 0) return;

    // Get the first unit that isn't already in the items list
    const availableUnit = units.find(unit => !items.some(item => item.unitId === unit.id));
    if (!availableUnit) {
      console.log('Debug - All units are already in the quote');
      return;
    }

    setItems(prev => [...prev, {
      unitId: availableUnit.id,
      quantity: 1,
      displayQuantity: '1',
      basePrice: availableUnit.basePrice,
      discount: 0,
      total: availableUnit.basePrice
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateItemTotal = async (item: QuoteItem): Promise<{ total: number; appliedDiscount: number }> => {
    const unit = units.find(u => u.id === item.unitId);
    if (!unit) return { total: 0, appliedDiscount: 0 };

    const subtotal = item.quantity * item.basePrice;
    
    // Get applicable discounts from configuration service
    const applicableRules = await configurationService.getApplicableDiscounts(item.quantity, item.unitId);
    console.log('Debug - Applicable rules for item:', {
      unitId: item.unitId,
      quantity: item.quantity,
      rules: applicableRules
    });

    // Apply highest discount if any
    let appliedDiscount = 0;
    if (applicableRules.length > 0) {
      // Rules are already sorted by highest discount first
      appliedDiscount = applicableRules[0].discountPercentage;
    }

    const total = subtotal - (subtotal * (appliedDiscount / 100));
    return { total, appliedDiscount };
  };

  const handleItemChange = async (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === 'unitId') {
      const unit = units.find(u => u.id === value);
      if (!unit) return;

      // Check if this unit already exists in another row
      const existingItemIndex = items.findIndex((item, i) => i !== index && item.unitId === value);
      
      if (existingItemIndex !== -1) {
        // Remove the current row and focus the existing item
        newItems.splice(index, 1);
        setItems(newItems);
        
        // Focus the existing item (you'll need to add a ref to the quantity input)
        const quantityInput = document.querySelector(`input[name="quantity-${existingItemIndex}"]`);
        if (quantityInput instanceof HTMLInputElement) {
          quantityInput.focus();
          quantityInput.select();
        }
        return;
      }

      // Update to new unit
      item.unitId = value;
      item.basePrice = unit.basePrice;
      const { total, appliedDiscount } = await calculateItemTotal(item);
      item.total = total;
      item.discount = appliedDiscount;
    }

    if (field === 'quantity' || field === 'displayQuantity') {
      if (field === 'displayQuantity') {
        item.displayQuantity = value;
        // Only update quantity if the display value is a valid number
        const newQuantity = parseInt(value);
        if (!isNaN(newQuantity)) {
          item.quantity = newQuantity;
        } else {
          // Keep the old quantity if the new value is invalid
          item.displayQuantity = item.quantity.toString();
        }
      } else {
        item.quantity = value;
        item.displayQuantity = value.toString();
      }

      // Recalculate total when quantity changes
      const { total, appliedDiscount } = await calculateItemTotal(item);
      item.total = total;
      item.discount = appliedDiscount;
    }

    // Update the item
    newItems[index] = item;
    setItems(newItems);
  };

  const handleQuantityChange = async (index: number, value: string) => {
    // Allow empty value or zero
    if (value === '' || value === '0') {
      const newItems = [...items];
      const item = {
        ...newItems[index],
        quantity: 0,
        displayQuantity: value
      };
      
      // Recalculate totals
      const { total, appliedDiscount } = await calculateItemTotal(item);
      item.total = total;
      item.discount = appliedDiscount;
      
      newItems[index] = item;
      setItems(newItems);
      return;
    }

    // Remove leading zeros and non-numeric characters
    const cleanValue = value.replace(/^0+/, '').replace(/[^0-9]/g, '');
    const numericValue = parseInt(cleanValue, 10);

    if (!isNaN(numericValue)) {
      const newItems = [...items];
      const item = {
        ...newItems[index],
        quantity: numericValue,
        displayQuantity: cleanValue
      };

      // Recalculate totals
      const { total, appliedDiscount } = await calculateItemTotal(item);
      item.total = total;
      item.discount = appliedDiscount;
      
      newItems[index] = item;
      setItems(newItems);
    }
  };

  const calculateQuote = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.basePrice), 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);

    // Ensure we return a properly structured quote object
    return {
      items: items.map(item => ({
        unitId: item.unitId,
        quantity: item.quantity,
        basePrice: item.basePrice,
        discount: item.discount,
        total: item.total
      })),
      subtotal,
      discount: subtotal - total,
      total
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !items.some(item => item.quantity > 0)) {
      setError('Please add at least one item with a quantity greater than 0');
      return;
    }
    if (!quoteName.trim()) {
      setError('Please enter a name for the quote');
      return;
    }
    try {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.basePrice), 0);
      const total = items.reduce((sum, item) => sum + item.total, 0);
      const discount = subtotal - total;

      const quoteData = {
        name: quoteName.trim(),
        items: items.map(item => ({
          unitId: item.unitId,
          quantity: item.quantity,
          basePrice: item.basePrice,
          discount: (item.quantity * item.basePrice) * (item.discount / 100),
          total: item.total
        })),
        subtotal,
        discount,
        total
      };

      console.log('Creating quote with data:', quoteData);
      const quote = await quoteService.createQuote(quoteData);
      console.log('Created quote:', quote);
      navigate('/quotes');
    } catch (error) {
      console.error('Error creating quote:', error);
      setError(error instanceof Error ? error.message : 'Failed to create quote');
    }
  };

  // Add this function to filter units based on features
  const getFilteredUnits = useCallback(() => {
    return units.filter(unit => {
      // If no features are selected, show all units
      if (selectedFeatures.length === 0) return true;
      
      // Unit must have all selected features
      return selectedFeatures.every(feature => unit.features.includes(feature));
    });
  }, [units, selectedFeatures]);

  // Add this handler for feature selection
  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => {
      const isSelected = prev.includes(feature);
      return isSelected 
        ? prev.filter(f => f !== feature)
        : [...prev, feature];
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Create Quote
        </Typography>

        <TextField
          fullWidth
          label="Quote Name"
          value={quoteName}
          onChange={(e) => setQuoteName(e.target.value)}
          required
          sx={{ mb: 3 }}
          placeholder="Enter a name for this quote"
        />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filter Products
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {availableFeatures.map((feature) => (
              <Chip
                key={feature}
                label={feature}
                onClick={() => handleFeatureToggle(feature)}
                color={selectedFeatures.includes(feature) ? 'primary' : 'default'}
                variant={selectedFeatures.includes(feature) ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell style={{ width: '40%' }}>Product</TableCell>
                <TableCell align="center" style={{ width: '15%' }}>Quantity</TableCell>
                <TableCell align="center" style={{ width: '15%' }}>Base Price</TableCell>
                <TableCell align="center" style={{ width: '15%' }}>Applied Discount</TableCell>
                <TableCell align="center" style={{ width: '15%' }}>Total</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => {
                const unit = units.find(u => u.id === item.unitId);
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl fullWidth>
                        <Autocomplete
                          value={unit || null}
                          onChange={(_, newValue) => {
                            handleItemChange(index, 'unitId', newValue?.id);
                          }}
                          options={getFilteredUnits().filter(u => 
                            // Don't show units that are already in other rows
                            !items.some((item, i) => i !== index && item.unitId === u.id)
                          )}
                          getOptionLabel={(option) => option.name}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Product"
                              variant="outlined"
                            />
                          )}
                          renderOption={(props, option) => (
                            <Box component="li" {...props}>
                              <Box>
                                <Typography variant="body1">{option.name}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Features: {option.features.join(', ')}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          autoComplete
                          includeInputInList
                          filterSelectedOptions
                          freeSolo={false}
                        />
                      </FormControl>
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="text"
                        value={item.displayQuantity}
                        name={`quantity-${index}`}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        inputProps={{
                          style: { textAlign: 'center' }
                        }}
                        sx={{ width: '100px' }}
                      />
                    </TableCell>
                    <TableCell align="center">${item.basePrice.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      {item.discount > 0 ? `${item.discount}%` : 'No discount'}
                    </TableCell>
                    <TableCell align="center">${item.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleRemoveItem(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            disabled={units.length === 0}
          >
            Add Item
          </Button>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography>
            Subtotal: ${calculateQuote().subtotal.toFixed(2)}
          </Typography>
          <Typography>
            Total Discount: ${calculateQuote().discount.toFixed(2)}
          </Typography>
          <Typography variant="h6">
            Final Total: ${calculateQuote().total.toFixed(2)}
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            type="submit"
            disabled={items.length === 0 || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate Quote'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
