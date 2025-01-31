import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  TablePagination,
  InputAdornment,
  Chip,
  Switch,
  FormHelperText,
  Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { debounce } from 'lodash';
import { configurationService, Unit, UnitSearchParams, DiscountRule } from '../services/configuration';

const INITIAL_SEARCH_PARAMS: UnitSearchParams = {
  page: 1,
  pageSize: 10,
  sortBy: 'name',
  sortOrder: 'asc',
};

interface UnitFormData {
  name: string;
  description: string;
  basePrice: number;
  category: string;
  features: string[];
  active: boolean;
  applicableDiscounts: string[];
}

const INITIAL_FORM_DATA: UnitFormData = {
  name: '',
  description: '',
  basePrice: 0,
  category: '',
  features: [],
  active: true,
  applicableDiscounts: []
};

const PREDEFINED_FEATURES = [
  'AI Code Completion',
  'Code Analysis',
  'Team Collaboration',
  'Advanced Code Generation',
  'Project Management',
  'Code Review',
  'Documentation Generation',
  'Testing Tools',
  'Security Analysis',
  'Performance Monitoring'
];

export const UnitManager: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchParams, setSearchParams] = useState<UnitSearchParams>(INITIAL_SEARCH_PARAMS);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState<UnitFormData>(INITIAL_FORM_DATA);
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [showInactive, setShowInactive] = useState(false);

  const loadUnits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await configurationService.getUnits(searchParams);
      setUnits(result.units);
      setTotal(result.total);
    } catch (err) {
      setError('Failed to load units');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadUnits();
    loadDiscountRules();
  }, [loadUnits]);

  const loadDiscountRules = async () => {
    try {
      const rules = await configurationService.getDiscountRules();
      setDiscountRules(rules);
    } catch (err) {
      console.error('Error loading discount rules:', err);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchParams(prev => ({ ...prev, query, page: 1 }));
    }, 300),
    []
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setSearchParams(prev => ({ ...prev, page: newPage + 1 }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams(prev => ({
      ...prev,
      pageSize: parseInt(event.target.value, 10),
      page: 1,
    }));
  };

  const handleSortChange = (field: UnitSearchParams['sortBy']) => {
    setSearchParams(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingUnit(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleEditClick = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      description: unit.description || '',
      basePrice: unit.basePrice,
      category: unit.category || '',
      features: unit.features || [],
      active: unit.active,
      applicableDiscounts: unit.applicableDiscounts || []
    });
    setDialogOpen(true);
  };

  const handleAddClick = () => {
    setEditingUnit(null);
    setFormData(INITIAL_FORM_DATA);
    setDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const unitData = {
        name: formData.name,
        description: formData.description,
        basePrice: formData.basePrice,
        category: formData.category,
        features: formData.features,
        active: formData.active,
        applicableDiscounts: formData.applicableDiscounts
      };

      if (editingUnit) {
        await configurationService.updateUnit(editingUnit.id, unitData);
        setSuccess('Unit updated successfully');
      } else {
        await configurationService.createUnit(unitData);
        setSuccess('Unit created successfully');
      }

      handleDialogClose();
      loadUnits();
    } catch (err) {
      setError(editingUnit ? 'Failed to update unit' : 'Failed to create unit');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnit = async (unit: Unit) => {
    if (!window.confirm(`Are you sure you want to delete ${unit.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, get all discount rules that reference this unit
      const allDiscountRules = await configurationService.getDiscountRules();
      const affectedRules = allDiscountRules.filter(rule => 
        rule.applicableUnits?.includes(unit.id)
      );

      // Remove this unit from the applicable units of any discount rules
      for (const rule of affectedRules) {
        const updatedUnits = rule.applicableUnits?.filter(id => id !== unit.id) || [];
        await configurationService.updateDiscountRule(rule.id, {
          applicableUnits: updatedUnits
        });
      }

      // Now delete the unit
      await configurationService.deleteUnit(unit.id);
      setSuccess('Unit deleted successfully');
      loadUnits();
      
    } catch (err) {
      setError('Failed to delete unit');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UnitFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Unit Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Units</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  color="primary"
                />
              }
              label="Show Inactive"
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
            >
              Add Unit
            </Button>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search units..."
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Button
                    onClick={() => handleSortChange('name')}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Name
                  </Button>
                </TableCell>
                <TableCell>Description</TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleSortChange('category')}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Category
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleSortChange('basePrice')}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Base Price
                  </Button>
                </TableCell>
                <TableCell>Features</TableCell>
                <TableCell>Applicable Discounts</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && !units.length ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : units.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No units found
                  </TableCell>
                </TableRow>
              ) : (
                units.filter(unit => showInactive || unit.active).map((unit) => (
                  <TableRow
                    key={unit.id}
                    sx={{
                      opacity: unit.active ? 1 : 0.5,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    <TableCell>{unit.name}</TableCell>
                    <TableCell>{unit.description}</TableCell>
                    <TableCell>{unit.category}</TableCell>
                    <TableCell>${unit.basePrice}</TableCell>
                    <TableCell>{unit.features?.join(', ')}</TableCell>
                    <TableCell>
                      {unit.applicableDiscounts?.map(discountId => {
                        const rule = discountRules.find(r => r.id === discountId);
                        return rule ? (
                          <Chip
                            key={discountId}
                            label={`${rule.name} (${rule.discountPercentage}%)`}
                            size="small"
                            sx={{ m: 0.5 }}
                          />
                        ) : null;
                      })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={unit.active ? 'Active' : 'Inactive'}
                        color={unit.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          color="primary"
                          onClick={() => handleEditClick(unit)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteUnit(unit)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={(searchParams.page || 1) - 1}
          onPageChange={handlePageChange}
          rowsPerPage={searchParams.pageSize || 10}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingUnit ? 'Edit Unit' : 'New Unit'}
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={handleFormSubmit}
            sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              fullWidth
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Base Price"
              type="number"
              value={formData.basePrice}
              onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value))}
              required
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                label="Category"
              >
                <MenuItem value="Enterprise">Enterprise</MenuItem>
                <MenuItem value="Premium">Premium</MenuItem>
                <MenuItem value="Standard">Standard</MenuItem>
              </Select>
            </FormControl>

            <Autocomplete
              multiple
              freeSolo
              options={PREDEFINED_FEATURES}
              value={formData.features}
              onChange={(_, newValue) => handleInputChange('features', newValue)}
              renderTags={(value: string[], getTagProps) =>
                value.map((option: string, index: number) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    size="small"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Features"
                  placeholder="Type to add custom features"
                  helperText="Choose from predefined features or type to add custom ones"
                />
              )}
            />

            <FormControl fullWidth>
              <InputLabel>Applicable Discounts</InputLabel>
              <Select
                multiple
                value={formData.applicableDiscounts}
                onChange={(e) => handleInputChange('applicableDiscounts', e.target.value)}
                label="Applicable Discounts"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((discountId) => {
                      const discount = discountRules.find(r => r.id === discountId);
                      return discount ? (
                        <Chip key={discountId} label={discount.name} size="small" />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {discountRules.map((rule) => (
                  <MenuItem key={rule.id} value={rule.id}>
                    {rule.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleFormSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (editingUnit ? 'Save Changes' : 'Create Unit')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
