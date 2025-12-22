import React from 'react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';
import { useNavigate } from 'react-router-dom';
import UserManagement from './UserManagement';

const Dashboard = () => {
  const { currentUser, userRole, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Publicis Budget Report</h1>
        <div style={styles.userInfo}>
          <span style={styles.userEmail}>{currentUser?.email}</span>
          <span style={styles.userRole}>Role: {userRole}</span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {isAdmin && <UserManagement />}
        {!isAdmin && (
          <div style={styles.content}>
            <h2>Welcome to the Dashboard</h2>
            <p>You are logged in as a {userRole}.</p>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: 'white',
    padding: '1rem 2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    color: '#333'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  userEmail: {
    color: '#666'
  },
  userRole: {
    color: '#666',
    fontWeight: '500'
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  main: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  content: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }
};

export default Dashboard;

