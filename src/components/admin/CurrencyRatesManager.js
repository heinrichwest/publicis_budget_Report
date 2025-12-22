import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const CurrencyRatesManager = () => {
  const [rates, setRates] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ market: '', rate: '' });
  const [newRate, setNewRate] = useState({ market: '', rate: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load markets
      const marketsSnapshot = await getDocs(collection(db, 'markets'));
      const marketsList = marketsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMarkets(marketsList);

      // Load currency rates
      const ratesSnapshot = await getDocs(collection(db, 'currencyRates'));
      const ratesList = ratesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRates(ratesList);
    } catch (err) {
      setError('Error loading data: ' + err.message);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newRate.market.trim()) {
      setError('Market is required');
      return;
    }
    if (!newRate.rate || isNaN(newRate.rate) || parseFloat(newRate.rate) <= 0) {
      setError('Valid exchange rate is required');
      return;
    }

    setError('');
    setSuccess('');
    try {
      await addDoc(collection(db, 'currencyRates'), {
        market: newRate.market.trim(),
        rate: parseFloat(newRate.rate),
        createdAt: new Date().toISOString()
      });
      setSuccess('Currency rate added successfully');
      setNewRate({ market: '', rate: '' });
      setShowAddForm(false);
      loadData();
    } catch (err) {
      setError('Error adding currency rate: ' + err.message);
    }
  };

  const handleEdit = (rate) => {
    setEditingId(rate.id);
    setEditData({ market: rate.market, rate: rate.rate.toString() });
    setError('');
    setSuccess('');
  };

  const handleUpdate = async (id) => {
    if (!editData.market.trim()) {
      setError('Market is required');
      return;
    }
    if (!editData.rate || isNaN(editData.rate) || parseFloat(editData.rate) <= 0) {
      setError('Valid exchange rate is required');
      return;
    }

    setError('');
    setSuccess('');
    try {
      await updateDoc(doc(db, 'currencyRates', id), {
        market: editData.market.trim(),
        rate: parseFloat(editData.rate),
        updatedAt: new Date().toISOString()
      });
      setSuccess('Currency rate updated successfully');
      setEditingId(null);
      setEditData({ market: '', rate: '' });
      loadData();
    } catch (err) {
      setError('Error updating currency rate: ' + err.message);
    }
  };

  const handleDelete = async (id, market) => {
    if (!window.confirm(`Are you sure you want to delete the currency rate for "${market}"?`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await deleteDoc(doc(db, 'currencyRates', id));
      setSuccess('Currency rate deleted successfully');
      loadData();
    } catch (err) {
      setError('Error deleting currency rate: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ market: '', rate: '' });
    setError('');
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewRate({ market: '', rate: '' });
    setError('');
  };

  if (loading) {
    return <div style={styles.loading}>Loading currency rates...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Currency Rates Management</h3>
        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} style={styles.addButton}>
            + ADD RATE
          </button>
        )}
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}
      {success && <div style={styles.successMessage}>{success}</div>}

      {showAddForm && (
        <div style={styles.addForm}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Market</label>
              <select
                value={newRate.market}
                onChange={(e) => setNewRate({ ...newRate, market: e.target.value })}
                style={styles.select}
              >
                <option value="">Select Market</option>
                {markets.map((market) => (
                  <option key={market.id} value={market.name}>
                    {market.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Exchange Rate</label>
              <input
                type="number"
                step="0.001"
                value={newRate.rate}
                onChange={(e) => setNewRate({ ...newRate, rate: e.target.value })}
                placeholder="Enter exchange rate"
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.formActions}>
            <button onClick={handleAdd} style={styles.saveButton}>SAVE</button>
            <button onClick={handleCancelAdd} style={styles.cancelButton}>CANCEL</button>
          </div>
        </div>
      )}

      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <div style={styles.headerCell}>Market</div>
          <div style={styles.headerCell}>Exchange Rate</div>
          <div style={styles.headerCell}>Actions</div>
        </div>

        {rates.map((rate) => (
          <div key={rate.id} style={styles.tableRow}>
            {editingId === rate.id ? (
              <>
                <div style={styles.tableCell}>
                  <select
                    value={editData.market}
                    onChange={(e) => setEditData({ ...editData, market: e.target.value })}
                    style={styles.select}
                  >
                    <option value="">Select Market</option>
                    {markets.map((market) => (
                      <option key={market.id} value={market.name}>
                        {market.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.tableCell}>
                  <input
                    type="number"
                    step="0.001"
                    value={editData.rate}
                    onChange={(e) => setEditData({ ...editData, rate: e.target.value })}
                    style={styles.input}
                    autoFocus
                  />
                </div>
                <div style={styles.tableCell}>
                  <button onClick={() => handleUpdate(rate.id)} style={styles.saveButton}>
                    SAVE
                  </button>
                  <button onClick={handleCancelEdit} style={styles.cancelButton}>
                    CANCEL
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={styles.tableCell}>{rate.market}</div>
                <div style={styles.tableCell}>{rate.rate.toFixed(3)}</div>
                <div style={styles.tableCell}>
                  <button onClick={() => handleEdit(rate)} style={styles.editButton}>
                    EDIT
                  </button>
                  <button onClick={() => handleDelete(rate.id, rate.market)} style={styles.deleteButton}>
                    DELETE
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {rates.length === 0 && !showAddForm && (
        <div style={styles.emptyState}>
          No currency rates found. Click "ADD RATE" to create one.
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    color: '#000000'
  },
  addButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: 'Montserrat, sans-serif'
  },
  addForm: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EEEEEE',
    padding: '1.5rem',
    marginBottom: '2rem',
    borderRadius: '2px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#333333',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    fontSize: '14px',
    fontFamily: 'Montserrat, sans-serif',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    fontSize: '14px',
    fontFamily: 'Montserrat, sans-serif',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF'
  },
  formActions: {
    display: 'flex',
    gap: '1rem'
  },
  table: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EEEEEE',
    borderRadius: '2px'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  headerCell: {
    padding: '1rem 1.5rem'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    borderBottom: '1px solid #EEEEEE'
  },
  tableCell: {
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '14px'
  },
  saveButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    fontFamily: 'Montserrat, sans-serif'
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    border: '1px solid #000000',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    fontFamily: 'Montserrat, sans-serif'
  },
  editButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    fontFamily: 'Montserrat, sans-serif'
  },
  deleteButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#FFFFFF',
    color: '#666666',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    fontFamily: 'Montserrat, sans-serif'
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '14px',
    color: '#666666'
  },
  errorMessage: {
    backgroundColor: '#FEE',
    border: '1px solid #FCC',
    padding: '1rem',
    marginBottom: '1.5rem',
    borderRadius: '2px',
    color: '#C00',
    fontSize: '14px'
  },
  successMessage: {
    backgroundColor: '#EFE',
    border: '1px solid #CFC',
    padding: '1rem',
    marginBottom: '1.5rem',
    borderRadius: '2px',
    color: '#060',
    fontSize: '14px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#666666',
    fontSize: '14px',
    border: '1px dashed #EEEEEE',
    borderRadius: '2px'
  }
};

export default CurrencyRatesManager;
