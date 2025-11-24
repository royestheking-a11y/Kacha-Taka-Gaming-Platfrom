import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeStorage } from '../utils/storageMongo';
import { authAPI, setToken } from '../utils/api';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  demoPoints: number;
  realBalance: number;
  isAdmin: boolean;
  createdAt: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  referralCode?: string;
  referredBy?: string;
  referralEarnings?: number;
  lastDailySpin?: string;
};

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  login: (user: User, token?: string) => void;
  logout: () => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize storage on app load
    initializeStorage();
    
    // Check for existing session via API
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('kachaTaka_token');
        if (token) {
          const response = await authAPI.getCurrentUser();
          if (response.user) {
            setUser(response.user);
            localStorage.setItem('kachaTaka_currentUser', JSON.stringify(response.user));
          }
        }
      } catch (error) {
        // Token invalid or expired, clear it
        localStorage.removeItem('kachaTaka_token');
        localStorage.removeItem('kachaTaka_currentUser');
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const login = (userData: User, token?: string) => {
    setUser(userData);
    if (token) {
      setToken(token);
    }
    localStorage.setItem('kachaTaka_currentUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kachaTaka_currentUser');
    localStorage.removeItem('kachaTaka_token');
    authAPI.logout();
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    // Update local state immediately for UI responsiveness
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('kachaTaka_currentUser', JSON.stringify(updatedUser));
    
    // Save to MongoDB via API
    try {
      const { usersAPI } = await import('../utils/api');
      await usersAPI.update(user.id, updates);
      
      // Refresh user data from server to ensure consistency
      const response = await authAPI.getCurrentUser();
      if (response.user) {
        setUser(response.user);
        localStorage.setItem('kachaTaka_currentUser', JSON.stringify(response.user));
      }
    } catch (error) {
      console.error('Failed to update user in MongoDB:', error);
      // Continue with local update even if API fails
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateUser, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

