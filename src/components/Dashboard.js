import React from 'react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';
import { useNavigate } from 'react-router-dom';
import AdminTabs from './admin/AdminTabs';

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
        <div style={styles.headerLeft}>
          <img src="/logo.png" alt="Publicis Groupe Africa" style={styles.logo} />
          <div style={styles.headerTitles}>
            <h1 style={styles.title}>Country Budget Report</h1>
            <p style={styles.tagline}>Connected Creativity</p>
          </div>
        </div>
        <div style={styles.userInfo}>
          <div style={styles.userDetails}>
            <span style={styles.userEmail}>{currentUser?.email}</span>
            <span style={styles.userRole}>{userRole?.toUpperCase()}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            SIGN OUT
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {isAdmin && (
          <div style={styles.adminSection}>
            <AdminTabs />
          </div>
        )}
        {!isAdmin && (
          <div style={styles.content}>
            <div style={styles.welcomeSection}>
              <h2 style={styles.welcomeTitle}>Welcome to Your Dashboard</h2>
              <p style={styles.welcomeText}>
                Driving your growth through connected creativity
              </p>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>YOUR ROLE</span>
                <span style={styles.infoValue}>{userRole}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>STATUS</span>
                <span style={styles.infoValue}>Active</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FFFFFF',
    fontFamily: "'Montserrat', sans-serif"
  },
  header: {
    backgroundColor: '#000000',
    color: '#FFFFFF',
    padding: '1.5rem 3rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #333333'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem'
  },
  logo: {
    height: '50px',
    width: 'auto',
    filter: 'brightness(0) invert(1)'
  },
  headerTitles: {
    display: 'flex',
    flexDirection: 'column'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: '-0.5px'
  },
  tagline: {
    margin: '0.25rem 0 0 0',
    fontSize: '12px',
    color: '#EEEEEE',
    fontWeight: '400',
    fontStyle: 'italic'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.25rem'
  },
  userEmail: {
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '500'
  },
  userRole: {
    color: '#EEEEEE',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.5px'
  },
  logoutButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    fontFamily: "'Montserrat', sans-serif",
    transition: 'background-color 0.2s ease'
  },
  main: {
    padding: '3rem',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  adminSection: {
    backgroundColor: '#FFFFFF'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  welcomeSection: {
    padding: '3rem 0',
    borderBottom: '2px solid #000000'
  },
  welcomeTitle: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#000000',
    marginBottom: '1rem',
    letterSpacing: '-0.5px'
  },
  welcomeText: {
    fontSize: '18px',
    color: '#666666',
    fontWeight: '400',
    fontStyle: 'italic'
  },
  infoCard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    padding: '2rem 0'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem',
    backgroundColor: '#FFFFFF',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    transition: 'box-shadow 0.2s ease'
  },
  infoLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#666666',
    letterSpacing: '0.5px',
    marginBottom: '0.75rem'
  },
  infoValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#000000',
    textTransform: 'capitalize'
  }
};

export default Dashboard;
