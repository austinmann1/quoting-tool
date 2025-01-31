import { salesforceService } from './salesforce';
import { configurationService } from './configuration';

export interface UserRole {
  isAdmin: boolean;
  canViewQuotes: boolean;
  canCreateQuotes: boolean;
  canEditPricing: boolean;
}

export interface UserSession {
  userId: string;
  username: string;
  roles: UserRole;
  isDemoUser: boolean;
  accountType: 'STUDENT' | 'ENTERPRISE' | 'STARTUP' | 'INDIVIDUAL';
}

// Demo mode admin credentials
const DEMO_ADMIN = {
  username: 'admin@codeium.com',
  password: 'admin123!@#',
};

// Demo mode regular user credentials
const DEMO_USER = {
  username: 'example@codeium.com',
  password: 'demo123!@#',
};

class AuthService {
  private currentSession: UserSession | null = null;

  async login(username: string, password: string): Promise<UserSession> {
    // Check for demo credentials
    const isDemoAdmin = username === DEMO_ADMIN.username && password === DEMO_ADMIN.password;
    const isDemoUser = username === DEMO_USER.username && password === DEMO_USER.password;
    
    if (isDemoAdmin || isDemoUser) {
      // Set demo mode for all services
      salesforceService.setDemoMode(true);
      configurationService.setDemoMode(true);

      this.currentSession = {
        userId: isDemoAdmin ? 'demo-admin' : 'demo-user',
        username: username,
        isDemoUser: true,
        accountType: isDemoAdmin ? 'ENTERPRISE' : 'INDIVIDUAL',
        roles: {
          isAdmin: isDemoAdmin,
          canViewQuotes: true,
          canCreateQuotes: true,
          canEditPricing: isDemoAdmin,
        },
      };

      return this.currentSession;
    }

    // Real Salesforce authentication
    try {
      // Set services to real mode
      salesforceService.setDemoMode(false);
      configurationService.setDemoMode(false);

      // Attempt Salesforce login
      const success = await salesforceService.login(username, password);
      
      if (!success) {
        throw new Error('Invalid credentials');
      }

      // In a real implementation, we would fetch user permissions from Salesforce
      // For now, we'll treat all real Salesforce users as regular users
      this.currentSession = {
        userId: 'sf-user',
        username: username,
        isDemoUser: false,
        accountType: 'INDIVIDUAL',
        roles: {
          isAdmin: false,
          canViewQuotes: true,
          canCreateQuotes: true,
          canEditPricing: false,
        },
      };

      return this.currentSession;
    } catch (err) {
      console.error('Login error:', err);
      throw new Error('Invalid credentials');
    }
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  getCurrentUser(): UserSession | null {
    return this.currentSession;
  }

  logout() {
    this.currentSession = null;
  }

  // Helper methods to check permissions
  isAdmin(): boolean {
    return this.currentSession?.roles.isAdmin || false;
  }

  canEditPricing(): boolean {
    return this.currentSession?.roles.canEditPricing || false;
  }

  canViewQuotes(): boolean {
    return this.currentSession?.roles.canViewQuotes || false;
  }

  canCreateQuotes(): boolean {
    return this.currentSession?.roles.canCreateQuotes || false;
  }

  isDemoUser(): boolean {
    return this.currentSession?.isDemoUser || false;
  }
}

export const authService = new AuthService();
