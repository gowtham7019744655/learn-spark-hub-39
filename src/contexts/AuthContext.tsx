import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'student' | 'lecturer' | 'parent' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  usn?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  login: (email: string, password: string, role: UserRole, usn?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, role: UserRole, usn?: string): Promise<boolean> => {
    // Simulated login - will be replaced with real auth
    if (email && password && role) {
      setUser({
        id: '1',
        name: email.split('@')[0],
        email,
        role,
        usn,
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
