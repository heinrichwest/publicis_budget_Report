import React, { useState, useEffect } from 'react';
import { initializeAllData } from '../../utils/initializeData';
import { bulkAddUsers } from '../../utils/bulkAddUsers';
import { importActivityData } from '../../utils/importActivityData';
import { clearAndReimportActivities } from '../../utils/clearAndReimportActivities';
import { fixUserDocuments } from '../../utils/fixUserDocuments';
import { importActualsFromExcel } from '../../utils/importActualsData';
import MarketsManager from './MarketsManager';
import CurrencyRatesManager from './CurrencyRatesManager';
import MediumsManager from './MediumsManager';
import UserManagement from './UserManagement';
import AdminActivityPlanView from './AdminActivityPlanView';

const AdminTabs = () => {
  const [activeTab, setActiveTab] = useState('markets');
  const [initializing, setInitializing] = useState(false);
  const [addingUsers, setAddingUsers] = useState(false);
  const [importingData, setImportingData] = useState(false);
  const [clearingAndImporting, setClearingAndImporting] = useState(false);
  const [fixingUsers, setFixingUsers] = useState(false);
  const [importingActuals, setImportingActuals] = useState(false);

  const handleInitialize = async () => {
    setInitializing(true);
    const results = await initializeAllData();
    console.log('Initialization results:', results);
    alert('Data initialized! Check console for details.');
    setInitializing(false);
  };

  const handleBulkAddUsers = async () => {
    if (!window.confirm('This will create 11 users: 10 market admins (one per market) and 1 general manager. You will be logged out during this process. Continue?')) {
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

  const handleImportActivity = async () => {
    if (!window.confirm('This will import sample Activity Plan data. Continue?')) {
      return;
    }

    setImportingData(true);
    try {
      const results = await importActivityData();
      console.log('Import results:', results);

      if (results.success) {
        alert(`Successfully imported ${results.imported} activities!\nFailed: ${results.failed}\n\nCheck console for details.`);
      } else {
        alert(`Import failed: ${results.message}`);
      }
    } catch (error) {
      alert('Error importing data: ' + error.message);
      console.error('Import error:', error);
    }
    setImportingData(false);
  };

  const handleClearAndReimport = async () => {
    if (!window.confirm('This will DELETE ALL existing Activity Plan data and re-import ALL 308 activities from the Excel file. Continue?')) {
      return;
    }

    setClearingAndImporting(true);
    try {
      const results = await clearAndReimportActivities();
      console.log('Clear and re-import results:', results);

      if (results.success) {
        alert(`Successfully cleared and re-imported!\n\nDeleted: ${results.deleted} old activities\nImported: ${results.imported} new activities\nFailed: ${results.failed}\n\nCheck console for details.`);
        // Reload to show new data
        window.location.reload();
      } else {
        alert(`Clear and re-import failed: ${results.message}`);
      }
    } catch (error) {
      alert('Error during clear and re-import: ' + error.message);
      console.error('Clear and re-import error:', error);
    }
    setClearingAndImporting(false);
  };

  const handleFixUsers = async () => {
    if (!window.confirm('This will fix user documents by recreating them with proper UIDs. This will sign you out. Continue?')) {
      return;
    }

    setFixingUsers(true);
    try {
      const results = await fixUserDocuments();
      console.log('Fix results:', results);

      let message = `Successfully fixed: ${results.fixed.length} users\n`;
      if (results.failed.length > 0) {
        message += `Failed: ${results.failed.length} users\n`;
      }
      message += '\nCheck console for details.\nYou will need to log in again.';

      alert(message);

      // Redirect to login after fixing
      window.location.href = '/login';
    } catch (error) {
      alert('Error fixing users: ' + error.message);
      console.error('Fix error:', error);
    }
    setFixingUsers(false);
  };

  const handleImportActuals = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!window.confirm(`Import actuals from ${file.name}? This will clear all existing actuals.`)) {
        return;
      }

      setImportingActuals(true);
      try {
        const result = await importActualsFromExcel(file);

        if (result.success) {
          let message = result.message + '\n\n';
          message += 'Actuals by market:\n';
          Object.entries(result.summary.byMarket).forEach(([market, count]) => {
            message += `  ${market}: ${count} mediums\n`;
          });
          alert(message);
        } else {
          alert('Error importing actuals: ' + result.error);
        }
      } catch (error) {
        alert('Error importing actuals: ' + error.message);
        console.error('Import error:', error);
      }
      setImportingActuals(false);
    };

    input.click();
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
            {addingUsers ? 'ADDING USERS...' : 'ADD 11 USERS (10 ADMINS + 1 MANAGER)'}
          </button>
          <button onClick={handleImportActivity} disabled={importingData} style={styles.importButton}>
            {importingData ? 'IMPORTING...' : 'IMPORT ACTIVITY DATA'}
          </button>
          <button onClick={handleClearAndReimport} disabled={clearingAndImporting} style={styles.clearReimportButton}>
            {clearingAndImporting ? 'CLEARING & IMPORTING...' : 'CLEAR & RE-IMPORT ALL DATA'}
          </button>
          <button onClick={handleFixUsers} disabled={fixingUsers} style={styles.fixUsersButton}>
            {fixingUsers ? 'FIXING USERS...' : 'FIX USER DOCUMENTS'}
          </button>
          <button onClick={handleImportActuals} disabled={importingActuals} style={styles.importButton}>
            {importingActuals ? 'IMPORTING ACTUALS...' : 'IMPORT ACTUALS DATA'}
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
  buttonGroup: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  initButton: { padding: '0.75rem 1.5rem', backgroundColor: '#666666', color: '#FFFFFF', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' },
  addUsersButton: { padding: '0.75rem 1.5rem', backgroundColor: '#000000', color: '#FFFFFF', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' },
  importButton: { padding: '0.75rem 1.5rem', backgroundColor: '#333333', color: '#FFFFFF', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' },
  clearReimportButton: { padding: '0.75rem 1.5rem', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' },
  fixUsersButton: { padding: '0.75rem 1.5rem', backgroundColor: '#FF6B00', color: '#FFFFFF', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' },
  tabsContainer: { display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #EEEEEE' },
  tab: { padding: '1rem 2rem', backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#666666', transition: 'all 0.2s' },
  activeTab: { color: '#000000', borderBottomColor: '#000000' },
  content: { padding: '2rem 0' }
};

export default AdminTabs;
