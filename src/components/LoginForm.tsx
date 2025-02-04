import React, { useState } from 'react';
import { authService } from '../services/auth';
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';

interface LoginProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const LoginForm: React.FC<LoginProps> = ({ onSuccess, onError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.login(username, password);
      onSuccess();
    } catch (err) {
      const errorMessage = 'Invalid credentials. Please try again.';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Box component="form" onSubmit={handleLogin}>
          <Typography variant="h5" align="center" gutterBottom>
            Login
          </Typography>
          
          <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
            Demo Accounts:<br />
            Admin: admin@codeium.com / admin123!@#<br />
            User: demo@codeium.com / demo123!@#
          </Typography>

          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />

          {error && (
            <Typography color="error" align="center" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={isLoading}
            sx={{ mt: 3 }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
