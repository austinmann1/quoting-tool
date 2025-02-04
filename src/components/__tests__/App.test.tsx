import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import App from '../../App';
import { authService } from '../../services/auth';
import '@testing-library/jest-dom';

// Mock the services
jest.mock('../../services/auth');
jest.mock('../../services/pdfService');
jest.mock('../QuotePDF');

describe('App', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  it('should show login form when not authenticated', async () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
    (authService.getCurrentUser as jest.Mock).mockReturnValue(null);

    await act(async () => {
      render(<App />);
    });

    // Verify login form is shown
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should show admin panel for admin users', async () => {
    // Mock auth service responses
    const adminUser = {
      userId: '123',
      username: 'admin@example.com',
      roles: { isAdmin: true },
    };
    
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getCurrentUser as jest.Mock).mockReturnValue(adminUser);
    (authService.isAdmin as jest.Mock).mockReturnValue(true);

    await act(async () => {
      render(<App />);
    });

    // Wait for admin panel tab to be visible
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /admin/i })).toBeInTheDocument();
    });
  });

  it('should not show admin panel for regular users', async () => {
    // Setup auth service mock for regular user
    const regularUser = {
      userId: 'demo@codeium.com',
      username: 'demo@codeium.com',
      roles: {
        isAdmin: false,
        canViewQuotes: true,
        canCreateQuotes: true,
        canEditPricing: false,
      },
      isDemoUser: true,
      accountType: 'INDIVIDUAL',
    };

    (authService.getCurrentUser as jest.Mock).mockReturnValue(regularUser);
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.isAdmin as jest.Mock).mockReturnValue(false);

    await act(async () => {
      render(<App />);
    });

    // Verify admin panel is not shown
    await waitFor(() => {
      expect(screen.queryByRole('tab', { name: /admin/i })).not.toBeInTheDocument();
    });
  });
});
