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
  Chip,
  InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Search from '@mui/icons-material/Search'; // Fix SearchIcon import
import { configurationService } from '../services/configuration';
import { quoteService } from '../services/quotes'; // Import quoteService

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([]);
  const [quoteName, setQuoteName] = useState('');

  // Reset form state when component mounts
  useEffect(() => {
    setItems([]);
    setSearchQuery('');
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

    const defaultUnit = units[0];
    const existingItemIndex = items.findIndex(item => item.unitId === defaultUnit.id);

    if (existingItemIndex !== -1) {
      // If item already exists, update its quantity
      const newItems = [...items];
      const existingItem = { ...newItems[existingItemIndex] };
      existingItem.quantity += 1;
      existingItem.displayQuantity = existingItem.quantity.toString();
      
      // Recalculate total with new quantity
      calculateItemTotal(existingItem).then(({ total, appliedDiscount }) => {
        existingItem.total = total;
        existingItem.discount = appliedDiscount;
        newItems[existingItemIndex] = existingItem;
        setItems(newItems);
      });
    } else {
      // Add new item
      setItems(prev => [...prev, {
        unitId: defaultUnit.id,
        quantity: 1,
        displayQuantity: '1',
        basePrice: defaultUnit.basePrice,
        discount: 0,
        total: defaultUnit.basePrice
      }]);
    }
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
        // Merge quantities with existing item
        const existingItem = { ...items[existingItemIndex] };
        existingItem.quantity += item.quantity;
        existingItem.displayQuantity = existingItem.quantity.toString();
        
        // Recalculate total for merged item
        const { total, appliedDiscount } = await calculateItemTotal(existingItem);
        existingItem.total = total;
        existingItem.discount = appliedDiscount;
        
        // Update items array: update existing item and remove the current one
        newItems[existingItemIndex] = existingItem;
        newItems.splice(index, 1);
      } else {
        // Just update the unit as before
        item.unitId = value;
        item.basePrice = unit.basePrice;
        item.quantity = 1;
        item.displayQuantity = '1';
        
        const { total, appliedDiscount } = await calculateItemTotal(item);
        item.total = total;
        item.discount = appliedDiscount;
        
        newItems[index] = item;
      }
    } else if (field === 'quantity') {
      item.quantity = Math.max(1, parseInt(value) || 1);
      item.displayQuantity = value.toString();
      
      const { total, appliedDiscount } = await calculateItemTotal(item);
      item.total = total;
      item.discount = appliedDiscount;
      
      newItems[index] = item;
    }

    setItems(newItems);
  };

  const handleQuantityChange = async (index: number, value: string) => {
    // Remove leading zeros
    const cleanValue = value.replace(/^0+/, '') || '0';
    const numericValue = parseInt(cleanValue, 10);

    if (!isNaN(numericValue) && numericValue >= 0) {
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

  // Filter units based on search query and selected features
  const filteredUnits = units.filter(unit => {
    // Always show units that are currently selected in the quote
    if (items.some(item => item.unitId === unit.id)) {
      return true;
    }

    const matchesSearch = unit.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFeatures = selectedFeatures.length === 0 || 
      selectedFeatures.every(feature => unit.features.includes(feature));
    return matchesSearch && matchesFeatures;
  });

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
          <TextField
            fullWidth
            label="Search Units"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <Autocomplete
            multiple
            options={availableFeatures}
            value={selectedFeatures}
            onChange={(_, newValue) => setSelectedFeatures(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filter by Features"
                placeholder="Select features"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...chipProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    {...chipProps}
                    label={option}
                    color="primary"
                    variant="outlined"
                  />
                );
              })
            }
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Base Price</TableCell>
                <TableCell align="right">Applied Discount</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => {
                const unit = units.find(u => u.id === item.unitId);
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          value={item.unitId}
                          onChange={(e) => handleItemChange(index, 'unitId', e.target.value)}
                        >
                          {filteredUnits.map((unit) => (
                            <MenuItem key={unit.id} value={unit.id}>
                              <Box>
                                <Typography>{unit.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Features: {unit.features.join(', ')}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        label="Quantity"
                        type="number"
                        value={item.displayQuantity || item.quantity.toString()}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        inputProps={{ min: 0 }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${item.basePrice.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      {item.discount > 0 ? `${item.discount}%` : 'No discount'}
                    </TableCell>
                    <TableCell align="right">
                      ${item.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => handleRemoveItem(index)}
                        size="small"
                        color="error"
                      >
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
