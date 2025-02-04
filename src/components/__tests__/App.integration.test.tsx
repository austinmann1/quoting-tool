import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import App from '../../App';
import { authService } from '../../services/auth';
import '@testing-library/jest-dom';

// Mock the auth service
jest.mock('../../services/auth');

describe('App Integration', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should show login form when not authenticated', async () => {
    // Setup auth service mock
    (authService.getCurrentUser as jest.Mock).mockReturnValue(null);
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);

    await act(() => { 
      render(<App />);
    });

    // Verify login form is shown
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should show admin panel for admin users', async () => {
    // Setup auth service mock for admin user
    const adminUser = {
      userId: 'admin@codeium.com',
      username: 'admin@codeium.com',
      roles: {
        isAdmin: true,
        canViewQuotes: true,
        canCreateQuotes: true,
        canEditPricing: true,
      },
      isDemoUser: true,
      accountType: 'ENTERPRISE',
    };

    (authService.getCurrentUser as jest.Mock).mockReturnValue(adminUser);
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.isAdmin as jest.Mock).mockReturnValue(true);

    await act(() => { 
      render(<App />);
    });

    // Wait for admin panel tab to be visible
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /admin panel/i })).toBeInTheDocument();
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

    await act(() => { 
      render(<App />);
    });

    // Verify admin panel is not shown
    await waitFor(() => {
      expect(screen.queryByRole('tab', { name: /admin panel/i })).not.toBeInTheDocument();
    });
  });

  it('should handle logout correctly', async () => {
    // Setup auth service mock
    const user = {
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

    (authService.getCurrentUser as jest.Mock).mockReturnValue(user);
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.logout as jest.Mock).mockImplementation(() => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue(null);
      (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
    });

    await act(() => { 
      render(<App />);
    });

    // Find and click logout button
    const logoutButton = await screen.findByRole('button', { name: /logout/i });
    await act(() => { 
      fireEvent.click(logoutButton);
    });

    // Verify auth service logout was called
    expect(authService.logout).toHaveBeenCalled();

    // Verify login form is shown after logout
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    });
  });
});
