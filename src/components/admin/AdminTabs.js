import React, { useState, useEffect } from 'react';
import { initializeAllData } from '../../utils/initializeData';
import { bulkAddUsers } from '../../utils/bulkAddUsers';
import MarketsManager from './MarketsManager';
import CurrencyRatesManager from './CurrencyRatesManager';
import MediumsManager from './MediumsManager';
import UserManagement from './UserManagement';

const AdminTabs = () => {
  const [activeTab, setActiveTab] = useState('markets');
  const [initializing, setInitializing] = useState(false);
  const [addingUsers, setAddingUsers] = useState(false);

  const handleInitialize = async () => {
    setInitializing(true);
    const results = await initializeAllData();
    console.log('Initialization results:', results);
    alert('Data initialized! Check console for details.');
    setInitializing(false);
  };

  const handleBulkAddUsers = async () => {
    if (!window.confirm('This will create 10 manager users (one for each market). You will be logged out during this process. Continue?')) {
      return;
    }

    setAddingUsers(true);
    try {
      const results = await bulkAddUsers();
      console.log('Bulk add users results:', results);

      let message = `Successfully created: ${results.success.length} users\n`;
      if (results.skipped.length > 0) {
        message += `Skipped: ${results.skipped.length} users (already exist)\n`;
      }
      if (results.failed.length > 0) {
        message += `Failed: ${results.failed.length} users\n`;
      }
      message += '\nCheck console for details.\nYou will need to log in again.';

      alert(message);

      // Redirect to login after bulk creation
      window.location.href = '/login';
    } catch (error) {
      alert('Error adding users: ' + error.message);
      console.error('Bulk add error:', error);
    }
    setAddingUsers(false);
  };

  const tabs = [
    { id: 'markets', label: 'Markets' },
    { id: 'rates', label: 'Currency Rates' },
    { id: 'mediums', label: 'Mediums' },
    { id: 'users', label: 'User Management' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Admin Dashboard</h2>
        <div style={styles.buttonGroup}>
          <button onClick={handleInitialize} disabled={initializing} style={styles.initButton}>
            {initializing ? 'INITIALIZING...' : 'INITIALIZE DATA'}
          </button>
          <button onClick={handleBulkAddUsers} disabled={addingUsers} style={styles.addUsersButton}>
            {addingUsers ? 'ADDING USERS...' : 'ADD 10 MARKET USERS'}
          </button>
        </div>
      </div>

      <div style={styles.tabsContainer}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.activeTab : {})
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'markets' && <MarketsManager />}
        {activeTab === 'rates' && <CurrencyRatesManager />}
        {activeTab === 'mediums' && <MediumsManager />}
        {activeTab === 'users' && <UserManagement />}
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#FFFFFF' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid #000000' },
  title: { fontSize: '28px', fontWeight: '700', color: '#000000', margin: 0 },
  buttonGroup: { display: 'flex', gap: '1rem' },
  initButton: { padding: '0.75rem 1.5rem', backgroundColor: '#666666', color: '#FFFFFF', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' },
  addUsersButton: { padding: '0.75rem 1.5rem', backgroundColor: '#000000', color: '#FFFFFF', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' },
  tabsContainer: { display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #EEEEEE' },
  tab: { padding: '1rem 2rem', backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#666666', transition: 'all 0.2s' },
  activeTab: { color: '#000000', borderBottomColor: '#000000' },
  content: { padding: '2rem 0' }
};

export default AdminTabs;
