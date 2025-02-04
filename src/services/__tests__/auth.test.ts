import { authService } from '../auth';
import { salesforceService } from '../salesforce';

// Mock salesforce service
jest.mock('../salesforce');

describe('AuthService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
    // Enable demo mode for Salesforce
    salesforceService.setDemoMode(true);
    // Clear any existing session
    authService.logout();
  });

  describe('login', () => {
    it('should successfully log in with valid demo credentials', async () => {
      const username = 'demo@codeium.com';
      const password = 'demo123!@#';

      const result = await authService.login(username, password);
      expect(result).toBeTruthy();
      expect(result.isDemoUser).toBe(true);
      expect(result.roles.isAdmin).toBe(false);

      const storedUser = window.localStorage.getItem('currentUser');
      expect(storedUser).toBeTruthy();
      const parsedUser = JSON.parse(storedUser!);
      expect(parsedUser.username).toBe(username);
      expect(parsedUser.isDemoUser).toBe(true);
      expect(parsedUser.roles.isAdmin).toBe(false);
    });

    it('should successfully log in with valid admin credentials', async () => {
      const username = 'admin@codeium.com';
      const password = 'admin123!@#';

      const result = await authService.login(username, password);
      expect(result).toBeTruthy();
      expect(result.isDemoUser).toBe(true);
      expect(result.roles.isAdmin).toBe(true);

      const storedUser = window.localStorage.getItem('currentUser');
      expect(storedUser).toBeTruthy();
      const parsedUser = JSON.parse(storedUser!);
      expect(parsedUser.username).toBe(username);
      expect(parsedUser.isDemoUser).toBe(true);
      expect(parsedUser.roles.isAdmin).toBe(true);
    });

    it('should fail to log in with invalid credentials', async () => {
      await expect(authService.login('invalid@example.com', 'wrongpass'))
        .rejects.toThrow('Invalid credentials');
      expect(window.localStorage.getItem('currentUser')).toBeNull();
    });
  });

  describe('logout', () => {
    it('should successfully log out', async () => {
      // First log in
      await authService.login('demo@codeium.com', 'demo123!@#');
      const storedUser = window.localStorage.getItem('currentUser');
      expect(storedUser).toBeTruthy();

      // Then log out
      await authService.logout();
      expect(window.localStorage.getItem('currentUser')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when not logged in', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should return user session when logged in', async () => {
      const username = 'demo@codeium.com';
      const password = 'demo123!@#';

      await authService.login(username, password);
      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeTruthy();
      expect(currentUser?.username).toBe(username);
      expect(currentUser?.isDemoUser).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no user is logged in', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true after successful login', async () => {
      await authService.login('demo@codeium.com', 'demo123!@#');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false after logout', async () => {
      await authService.login('demo@codeium.com', 'demo123!@#');
      await authService.logout();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});
