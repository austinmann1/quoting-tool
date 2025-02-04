import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  DialogContentText,
  FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { configurationService, DiscountRule } from '../services/configuration';
import { authService } from '../services/auth';

interface DiscountFormData {
  name: string;
  type: 'VOLUME' | 'ACCOUNT_TYPE' | 'SPECIAL';
  threshold: number;
  discountPercentage: number;
  accountType?: 'STUDENT' | 'ENTERPRISE' | 'STARTUP' | 'INDIVIDUAL';
}

const initialFormData: DiscountFormData = {
  name: '',
  type: 'VOLUME',
  threshold: 0,
  discountPercentage: 0,
  accountType: undefined
};

export const DiscountManager: React.FC = () => {
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DiscountRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<DiscountRule | null>(null);
  const [formData, setFormData] = useState<DiscountFormData>(initialFormData);

  useEffect(() => {
    loadDiscountRules();
  }, []);

  const loadDiscountRules = async () => {
    try {
      setLoading(true);
      const rules = await configurationService.getDiscountRules();
      console.log('Debug - Loaded discount rules:', rules);
      setDiscountRules(rules);
    } catch (err) {
      setError('Failed to load discount rules');
      console.error('Debug - Error loading discount rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (rule?: DiscountRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        type: rule.type,
        threshold: rule.threshold || 0,
        discountPercentage: rule.discountPercentage,
        accountType: rule.accountType
      });
    } else {
      setEditingRule(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRule(null);
    setFormData(initialFormData);
  };

  const handleInputChange = (field: keyof DiscountFormData, value: any) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      if (field === 'type' && value !== 'ACCOUNT_TYPE') {
        newData.accountType = undefined;
      }
      
      if (field === 'type' && value !== 'VOLUME') {
        newData.threshold = 0;
      }
      
      return newData;
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Debug - Submitting form data:', {
        editingRule: editingRule ? { id: editingRule.id, name: editingRule.name } : null,
        formData
      });

      if (formData.type === 'ACCOUNT_TYPE' && !formData.accountType) {
        setError('Please select an account type');
        return;
      }

      if (formData.type === 'VOLUME' && formData.threshold <= 0) {
        setError('Please enter a valid threshold');
        return;
      }

      if (editingRule) {
        await configurationService.updateDiscountRule(editingRule.id, formData);
        setSuccess('Discount rule updated successfully');
      } else {
        await configurationService.createDiscountRule(formData);
        setSuccess('Discount rule created successfully');
      }

      handleCloseDialog();
      await loadDiscountRules();
    } catch (err) {
      setError('Failed to save discount rule');
      console.error('Debug - Error saving discount rule:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Discount Rules</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Your account type: {authService.getCurrentUser()?.accountType || 'Not logged in'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => handleOpenDialog()}
            startIcon={<AddIcon />}
          >
            Add Rule
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Available To</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {discountRules.map((rule, index) => (
              <TableRow 
                key={`${rule.id}-${index}`}
                sx={{
                  bgcolor: rule.type === 'ACCOUNT_TYPE' && 
                          rule.accountType !== authService.getCurrentUser()?.accountType ? 
                          'action.hover' : 'inherit'
                }}
              >
                <TableCell>{rule.name}</TableCell>
                <TableCell>{rule.type === 'ACCOUNT_TYPE' ? 'Account' : rule.type.charAt(0) + rule.type.slice(1).toLowerCase()}</TableCell>
                <TableCell>
                  {rule.type === 'VOLUME' && `${rule.threshold}+ units`}
                  {rule.type === 'ACCOUNT_TYPE' && rule.accountType}
                </TableCell>
                <TableCell>{rule.discountPercentage}%</TableCell>
                <TableCell>
                  {rule.type === 'ACCOUNT_TYPE' ? 
                    rule.accountType :
                    'All accounts'
                  }
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(rule)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => {
                    setDeletingRule(rule);
                    setDeleteDialogOpen(true);
                  }}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRule ? 'Edit Discount Rule' : 'New Discount Rule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => handleInputChange('type', e.target.value)}
              >
                <MenuItem value="VOLUME">Volume</MenuItem>
                <MenuItem value="ACCOUNT_TYPE">Account Type</MenuItem>
                <MenuItem value="SPECIAL">Special</MenuItem>
              </Select>
            </FormControl>

            {formData.type === 'ACCOUNT_TYPE' && (
              <FormControl fullWidth required>
                <InputLabel>Account Type</InputLabel>
                <Select
                  value={formData.accountType || ''}
                  label="Account Type"
                  onChange={(e) => handleInputChange('accountType', e.target.value)}
                >
                  <MenuItem value="STUDENT">Student</MenuItem>
                  <MenuItem value="ENTERPRISE">Enterprise</MenuItem>
                  <MenuItem value="STARTUP">Startup</MenuItem>
                  <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                </Select>
              </FormControl>
            )}

            {formData.type === 'VOLUME' && (
              <TextField
                label="Threshold"
                type="number"
                fullWidth
                value={formData.threshold}
                onChange={(e) => handleInputChange('threshold', parseFloat(e.target.value) || 0)}
                required
              />
            )}

            <TextField
              label="Discount Percentage"
              type="number"
              fullWidth
              value={formData.discountPercentage}
              onChange={(e) => handleInputChange('discountPercentage', parseFloat(e.target.value) || 0)}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Discount Rule</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this discount rule?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (deletingRule) {
                try {
                  setLoading(true);
                  await configurationService.deleteDiscountRule(deletingRule.id);
                  setSuccess('Discount rule deleted successfully');
                  setDeleteDialogOpen(false);
                  loadDiscountRules();
                } catch (err) {
                  setError('Failed to delete discount rule');
                  console.error(err);
                } finally {
                  setLoading(false);
                }
              }
            }}
            color="error"
            variant="contained"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
