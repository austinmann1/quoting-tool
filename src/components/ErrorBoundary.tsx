import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            maxWidth: 600,
            mx: 'auto',
            mt: 4
          }}
        >
          <Typography variant="h4" gutterBottom color="error">
            Something went wrong
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                overflow: 'auto',
                textAlign: 'left',
                mb: 2
              }}
            >
              <code>
                {this.state.errorInfo.componentStack}
              </code>
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={this.handleReload}
            sx={{ mt: 2 }}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
