import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline, Typography, Container, Box, Tabs, Tab, Button } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';
import { authService } from './services/auth';
import { AdminPanel } from './components/AdminPanel';
import { QuoteForm } from './components/QuoteForm';
import { QuoteList } from './components/QuoteList';
import { SalesforceLogin } from './components/SalesforceLogin';
import { quoteService, Quote } from './services/quotes';
import { configurationService } from './services/configuration'; // Import configurationService

interface QuoteItem {
  unitId: string;
  quantity: number;
  basePrice: number;
  discount: number;
  total: number;
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname === '/admin') return 2;
    if (location.pathname === '/quotes') return 1;
    return 0;
  });

  useEffect(() => {
    if (location.pathname === '/admin') setActiveTab(2);
    else if (location.pathname === '/quotes') setActiveTab(1);
    else if (location.pathname === '/new-quote') setActiveTab(0);
  }, [location.pathname]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    switch (newValue) {
      case 0:
        navigate('/new-quote');
        break;
      case 1:
        navigate('/quotes');
        break;
      case 2:
        navigate('/admin');
        break;
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  const handleQuoteSubmit = async (quoteData: Omit<Quote, 'id' | 'createdAt' | 'createdBy' | 'status'>) => {
    try {
      await quoteService.createQuote(quoteData);
      navigate('/quotes');
      setActiveTab(1);
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Failed to generate quote. Please try again.');
    }
  };

  return (
    <Container component="main">
      <ErrorBoundary>
        <Box sx={{ width: '100%', mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ flex: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="New Quote" />
                <Tab label="Quotes" />
                {authService.isAdmin() && <Tab label="Admin Panel" />}
              </Tabs>
            </Box>
            <Button 
              color="inherit" 
              onClick={handleLogout}
              sx={{ ml: 2 }}
            >
              Logout
            </Button>
          </Box>

          <Routes>
            <Route 
              path="/new-quote" 
              element={
                <QuoteForm 
                  key={location.pathname} 
                  onSubmit={handleQuoteSubmit} 
                />
              } 
            />
            <Route path="/quotes" element={<QuoteList />} />
            <Route 
              path="/admin" 
              element={
                authService.isAdmin() 
                  ? <AdminPanel /> 
                  : <Navigate to="/quotes" replace />
              } 
            />
            <Route path="/" element={<Navigate to="/new-quote" replace />} />
          </Routes>
        </Box>
      </ErrorBoundary>
    </Container>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  useEffect(() => {
    // Don't reset demo data on every app start
    // configurationService.resetDemoData();
    
    // Check if user is authenticated
    const checkAuth = async () => {
      const isAuthenticated = await authService.checkAuth();
      setIsLoggedIn(isAuthenticated);
    };
    checkAuth();
  }, []);

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="sm" sx={{ mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom color="error">
            Error
          </Typography>
          <Typography variant="body1">{error}</Typography>
        </Container>
      </ThemeProvider>
    );
  }

  if (!isLoggedIn) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="sm">
          <SalesforceLogin onSuccess={handleLoginSuccess} onError={setError} />
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
