import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange, getUserData } from '../firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userMarket, setUserMarket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        const userData = await getUserData(user.uid);
        setUserRole(userData?.role || null);
        setUserMarket(userData?.assignedMarket || null);
      } else {
        setUserRole(null);
        setUserMarket(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userMarket,
    loading,
    isSystemAdmin: userRole === 'systemAdmin',
    isMarketAdmin: userRole === 'marketAdmin',
    isAdmin: userRole === 'admin' || userRole === 'systemAdmin' || userRole === 'marketAdmin',
    isManager: userRole === 'manager'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

