import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { LoginForm } from '../LoginForm';
import { authService } from '../../services/auth';
import '@testing-library/jest-dom';

// Mock the auth service
jest.mock('../../services/auth');

describe('LoginForm', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should handle successful login with demo user', async () => {
    const mockOnSuccess = jest.fn();
    const mockOnError = jest.fn();
    const mockLogin = jest.spyOn(authService, 'login').mockResolvedValueOnce({
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
    });

    await act(async () => {
      render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    });

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'demo@codeium.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'demo123!@#' },
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /login/i }));
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('demo@codeium.com', 'demo123!@#');
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  it('should handle failed login', async () => {
    const mockOnSuccess = jest.fn();
    const mockOnError = jest.fn();
    const mockLogin = jest.spyOn(authService, 'login').mockRejectedValueOnce(new Error('Invalid credentials'));

    await act(async () => {
      render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    });

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /login/i }));
    });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Invalid credentials. Please try again.');
      expect(mockLogin).toHaveBeenCalledWith('wrong@example.com', 'wrongpassword');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should show loading state during login', async () => {
    const mockOnSuccess = jest.fn();
    const mockOnError = jest.fn();
    const mockLogin = jest.spyOn(authService, 'login').mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    await act(async () => {
      render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    });

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'demo@codeium.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'demo123!@#' },
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /login/i }));
    });

    // Verify loading state
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });
});
