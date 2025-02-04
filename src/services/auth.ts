import { salesforceService } from './salesforce';

export interface UserSession {
  userId: string;
  username: string;
  roles: {
    isAdmin: boolean;
    canViewQuotes: boolean;
    canCreateQuotes: boolean;
    canEditPricing: boolean;
  };
  isDemoUser: boolean;
  accountType: 'INDIVIDUAL' | 'STUDENT' | 'STARTUP' | 'ENTERPRISE';
}

class AuthService {
  private currentUser: UserSession | null = null;
  private readonly predefinedUsers = [
    {
      username: 'demo@codeium.com',
      password: 'demo123!@#',
      roles: {
        isAdmin: false,
        canViewQuotes: true,
        canCreateQuotes: true,
        canEditPricing: false,
      },
      accountType: 'INDIVIDUAL',
    },
    {
      username: 'admin@codeium.com',
      password: 'admin123!@#',
      roles: {
        isAdmin: true,
        canViewQuotes: true,
        canCreateQuotes: true,
        canEditPricing: true,
      },
      accountType: 'ENTERPRISE',
    },
  ];

  constructor() {
    // Load session from localStorage on initialization
    const savedSession = localStorage.getItem('currentUser');
    if (savedSession) {
      try {
        this.currentUser = JSON.parse(savedSession);
      } catch (e) {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
      }
    }
  }

  private saveSession(session: UserSession | null) {
    this.currentUser = session;
    if (session) {
      localStorage.setItem('currentUser', JSON.stringify(session));
    } else {
      localStorage.removeItem('currentUser');
    }
  }

  async login(username: string, password: string): Promise<UserSession> {
    try {
      // Check predefined users first
      const predefinedUser = this.predefinedUsers.find(
        user => user.username === username && user.password === password
      );

      if (predefinedUser) {
        const session: UserSession = {
          userId: predefinedUser.username,
          username: predefinedUser.username,
          roles: predefinedUser.roles,
          isDemoUser: true,
          accountType: predefinedUser.accountType,
        };
        this.saveSession(session);
        return session;
      }

      // Try Salesforce login if not a predefined user
      const isAuthenticated = await salesforceService.login(username, password);
      if (!isAuthenticated) {
        this.saveSession(null);
        throw new Error('Invalid credentials');
      }

      const session: UserSession = {
        userId: username,
        username,
        roles: {
          isAdmin: false,
          canViewQuotes: true,
          canCreateQuotes: true,
          canEditPricing: false,
        },
        isDemoUser: false,
        accountType: 'INDIVIDUAL',
      };

      this.saveSession(session);
      return session;
    } catch (err) {
      console.error('Login error:', err);
      this.saveSession(null);
      throw new Error('Invalid credentials');
    }
  }

  async logout(): Promise<void> {
    try {
      if (!this.currentUser?.isDemoUser) {
        await salesforceService.logout();
      }
    } finally {
      this.saveSession(null);
    }
  }

  getCurrentUser(): UserSession | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isAdmin(): boolean {
    return this.currentUser?.roles.isAdmin || false;
  }

  async checkAuth(): Promise<boolean> {
    return this.isAuthenticated();
  }
}

export const authService = new AuthService();
