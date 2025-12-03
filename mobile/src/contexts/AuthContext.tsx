import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorageService from '../services/storage/AsyncStorageService';
import { User } from '../types/models.types';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const storedUser = await AsyncStorageService.getUserData();
      const storedToken = await AsyncStorageService.getAuthToken();

      if (storedUser && storedToken) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      // TODO: Implement actual login with tRPC
      // const response = await trpc.auth.login.mutate({ email, password });
      
      // Mock login for now
      const mockUser: User = {
        id: 1,
        name: 'Usuário Teste',
        email,
        role: 'vendedor',
        active: true,
      };
      
      const mockToken = 'mock-token-123';

      await AsyncStorageService.setUserData(mockUser);
      await AsyncStorageService.setAuthToken(mockToken);
      
      setUser(mockUser);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async function signOut() {
    try {
      await AsyncStorageService.removeUserData();
      await AsyncStorageService.removeAuthToken();
      await AsyncStorageService.removeCartData();
      
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
