import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AdminActualsView = () => {
  const [actuals, setActuals] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [userMarket, setUserMarket] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    medium: '',
    monthlyActuals: {
      Jan: { rateCard: '', discount: '', nettNett: '' },
      Feb: { rateCard: '', discount: '', nettNett: '' },
      Mar: { rateCard: '', discount: '', nettNett: '' },
      Apr: { rateCard: '', discount: '', nettNett: '' },
      May: { rateCard: '', discount: '', nettNett: '' },
      Jun: { rateCard: '', discount: '', nettNett: '' },
      Jul: { rateCard: '', discount: '', nettNett: '' },
      Aug: { rateCard: '', discount: '', nettNett: '' },
      Sep: { rateCard: '', discount: '', nettNett: '' },
      Oct: { rateCard: '', discount: '', nettNett: '' },
      Nov: { rateCard: '', discount: '', nettNett: '' },
      Dec: { rateCard: '', discount: '', nettNett: '' }
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Get current user's market
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('User not authenticated');
        return;
      }

      const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', currentUser.email)));
      if (!userDoc.empty) {
        const market = userDoc.docs[0].data().assignedMarket;
        setUserMarket(market);

        // Load actuals for this market
        const actualsSnapshot = await getDocs(
          query(collection(db, 'actuals'), where('market', '==', market))
        );
        const actualsList = actualsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActuals(actualsList);
      }

      // Load mediums
      const mediumsSnapshot = await getDocs(collection(db, 'mediums'));
      const mediumsList = mediumsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMediums(mediumsList);

    } catch (err) {
      setError('Error loading data: ' + err.message);
    }
    setLoading(false);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const calculateAfterDiscount = (rateCard, discount) => {
    const rc = parseFloat(rateCard) || 0;
    const disc = parseFloat(discount) || 0;
    return rc - disc;
  };

  const calculateDiscountPercentage = (rateCard, discount) => {
    const rc = parseFloat(rateCard) || 0;
    const disc = parseFloat(discount) || 0;
    if (rc === 0) return 0;
    return (disc / rc) * 100;
  };

  const calculateMonthTotal = (month, field) => {
    return actuals.reduce((sum, actual) => {
      const value = parseFloat(actual.monthlyActuals?.[month]?.[field]) || 0;
      return sum + value;
    }, 0);
  };

  const calculateGrandTotal = (field) => {
    return actuals.reduce((sum, actual) => {
      return sum + MONTHS.reduce((monthSum, month) => {
        const value = parseFloat(actual.monthlyActuals?.[month]?.[field]) || 0;
        return monthSum + value;
      }, 0);
    }, 0);
  };

  const handleAdd = () => {
    setShowAddForm(true);
    setFormData({
      medium: '',
      monthlyActuals: MONTHS.reduce((acc, month) => {
        acc[month] = { rateCard: '', discount: '', nettNett: '' };
        return acc;
      }, {})
    });
  };

  const handleEdit = (actual) => {
    setEditingId(actual.id);
    setFormData({
      medium: actual.medium,
      monthlyActuals: { ...actual.monthlyActuals }
    });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      medium: '',
      monthlyActuals: MONTHS.reduce((acc, month) => {
        acc[month] = { rateCard: '', discount: '', nettNett: '' };
        return acc;
      }, {})
    });
  };

  const handleSave = async () => {
    if (!formData.medium) {
      setError('Please select a medium');
      return;
    }

    try {
      const actualData = {
        market: userMarket,
        medium: formData.medium,
        monthlyActuals: formData.monthlyActuals,
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        await setDoc(doc(db, 'actuals', editingId), actualData);
      } else {
        const docRef = doc(collection(db, 'actuals'));
        await setDoc(docRef, {
          ...actualData,
          createdAt: new Date().toISOString()
        });
      }

      handleCancel();
      loadData();
      setError('');
    } catch (err) {
      setError('Error saving actual: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this actual entry?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'actuals', id));
      loadData();
      setError('');
    } catch (err) {
      setError('Error deleting actual: ' + err.message);
    }
  };

  const handleMonthlyFieldChange = (month, field, value) => {
    setFormData(prev => ({
      ...prev,
      monthlyActuals: {
        ...prev.monthlyActuals,
        [month]: {
          ...prev.monthlyActuals[month],
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>{userMarket} - Actuals</h2>
        {!showAddForm && !editingId && (
          <button onClick={handleAdd} style={styles.addButton}>
            + ADD ACTUAL
          </button>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div style={styles.formContainer}>
          <h3 style={styles.formTitle}>{editingId ? 'Edit Actual' : 'Add New Actual'}</h3>

          {/* Medium Selection */}
          <div style={styles.formRow}>
            <label style={styles.label}>Medium *</label>
            <select
              value={formData.medium}
              onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
              style={styles.select}
              disabled={editingId}
            >
              <option value="">Select Medium</option>
              {mediums.map(medium => (
                <option key={medium.id} value={medium.name}>{medium.name}</option>
              ))}
            </select>
          </div>

          {/* Monthly Data Table */}
          <div style={styles.monthlyTableWrapper}>
            <table style={styles.monthlyTable}>
              <thead>
                <tr>
                  <th style={styles.monthlyTh}>Month</th>
                  <th style={styles.monthlyTh}>Rate Card</th>
                  <th style={styles.monthlyTh}>Discount</th>
                  <th style={styles.monthlyTh}>After Discount</th>
                  <th style={styles.monthlyTh}>Nett Nett</th>
                  <th style={styles.monthlyTh}>% Disc</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS.map(month => {
                  const rateCard = formData.monthlyActuals[month].rateCard;
                  const discount = formData.monthlyActuals[month].discount;
                  const afterDiscount = calculateAfterDiscount(rateCard, discount);
                  const discPercentage = calculateDiscountPercentage(rateCard, discount);

                  return (
                    <tr key={month}>
                      <td style={styles.monthlyTd}><strong>{month}</strong></td>
                      <td style={styles.monthlyTd}>
                        <input
                          type="number"
                          value={formData.monthlyActuals[month].rateCard}
                          onChange={(e) => handleMonthlyFieldChange(month, 'rateCard', e.target.value)}
                          style={styles.monthlyInput}
                          placeholder="0"
                        />
                      </td>
                      <td style={styles.monthlyTd}>
                        <input
                          type="number"
                          value={formData.monthlyActuals[month].discount}
                          onChange={(e) => handleMonthlyFieldChange(month, 'discount', e.target.value)}
                          style={styles.monthlyInput}
                          placeholder="0"
                        />
                      </td>
                      <td style={styles.monthlyTd}>
                        <span style={styles.calculatedValue}>{formatNumber(afterDiscount)}</span>
                      </td>
                      <td style={styles.monthlyTd}>
                        <input
                          type="number"
                          value={formData.monthlyActuals[month].nettNett}
                          onChange={(e) => handleMonthlyFieldChange(month, 'nettNett', e.target.value)}
                          style={styles.monthlyInput}
                          placeholder="0"
                        />
                      </td>
                      <td style={styles.monthlyTd}>
                        <span style={styles.calculatedValue}>{discPercentage.toFixed(2)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={styles.formActions}>
            <button onClick={handleSave} style={styles.saveButton}>SAVE</button>
            <button onClick={handleCancel} style={styles.cancelButton}>CANCEL</button>
          </div>
        </div>
      )}

      {/* Actuals Table */}
      {!showAddForm && !editingId && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.thFixed, left: 0, width: '150px' }}>Medium</th>
                <th style={{ ...styles.thFixed, left: '150px', width: '80px' }}>Actions</th>
                {MONTHS.map(month => (
                  <React.Fragment key={month}>
                    <th style={styles.th} colSpan="3">{month}</th>
                  </React.Fragment>
                ))}
              </tr>
              <tr>
                <th style={{ ...styles.thFixed, left: 0, width: '150px' }}></th>
                <th style={{ ...styles.thFixed, left: '150px', width: '80px' }}></th>
                {MONTHS.map(month => (
                  <React.Fragment key={month}>
                    <th style={styles.thSub}>Rate Card</th>
                    <th style={styles.thSub}>Discount</th>
                    <th style={styles.thSub}>Nett Nett</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {actuals.map(actual => (
                <tr key={actual.id}>
                  <td style={{ ...styles.tdFixed, left: 0, width: '150px' }}>{actual.medium}</td>
                  <td style={{ ...styles.tdFixed, left: '150px', width: '80px' }}>
                    <button onClick={() => handleEdit(actual)} style={styles.editButton}>Edit</button>
                    <button onClick={() => handleDelete(actual.id)} style={styles.deleteButton}>Delete</button>
                  </td>
                  {MONTHS.map(month => {
                    const monthData = actual.monthlyActuals?.[month] || {};
                    return (
                      <React.Fragment key={month}>
                        <td style={styles.td}>{formatNumber(monthData.rateCard)}</td>
                        <td style={styles.td}>{formatNumber(monthData.discount)}</td>
                        <td style={styles.td}>{formatNumber(monthData.nettNett)}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
              {/* Totals Row */}
              <tr style={styles.totalRow}>
                <td style={{ ...styles.totalLabel, left: 0, width: '150px' }}>TOTAL</td>
                <td style={{ ...styles.totalLabel, left: '150px', width: '80px' }}></td>
                {MONTHS.map(month => (
                  <React.Fragment key={month}>
                    <td style={styles.totalCell}>{formatNumber(calculateMonthTotal(month, 'rateCard'))}</td>
                    <td style={styles.totalCell}>{formatNumber(calculateMonthTotal(month, 'discount'))}</td>
                    <td style={styles.totalCell}>{formatNumber(calculateMonthTotal(month, 'nettNett'))}</td>
                  </React.Fragment>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {!showAddForm && !editingId && actuals.length === 0 && (
        <div style={styles.emptyState}>
          <p>No actuals found. Click "ADD ACTUAL" to create your first entry.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '0',
    backgroundColor: '#FFFFFF',
    fontFamily: "'Montserrat', sans-serif",
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column'
  },
  loading: {
    padding: '3rem',
    textAlign: 'center',
    fontSize: '16px',
    color: '#666666'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '2px solid #000000',
    backgroundColor: '#FFFFFF'
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#000000',
    margin: 0
  },
  addButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.5px'
  },
  error: {
    backgroundColor: '#FEE',
    color: '#C00',
    padding: '1rem 2rem',
    margin: '0',
    fontSize: '14px',
    borderBottom: '1px solid #FCC'
  },
  formContainer: {
    padding: '2rem',
    backgroundColor: '#F9F9F9',
    borderBottom: '2px solid #EEEEEE',
    overflowY: 'auto',
    flex: 1
  },
  formTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#000000',
    marginBottom: '1.5rem'
  },
  formRow: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: '#666666',
    marginBottom: '0.5rem',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  select: {
    width: '300px',
    padding: '0.75rem',
    fontSize: '14px',
    border: '1px solid #CCCCCC',
    borderRadius: '2px',
    outline: 'none'
  },
  monthlyTableWrapper: {
    marginTop: '2rem',
    marginBottom: '2rem',
    overflowX: 'auto'
  },
  monthlyTable: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#FFFFFF',
    border: '1px solid #DDDDDD'
  },
  monthlyTh: {
    padding: '0.75rem',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '700',
    textAlign: 'left',
    borderRight: '1px solid #333333',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  monthlyTd: {
    padding: '0.75rem',
    borderBottom: '1px solid #EEEEEE',
    borderRight: '1px solid #EEEEEE',
    fontSize: '13px'
  },
  monthlyInput: {
    width: '100%',
    padding: '0.5rem',
    fontSize: '13px',
    border: '1px solid #CCCCCC',
    borderRadius: '2px',
    outline: 'none'
  },
  calculatedValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#666666'
  },
  formActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem'
  },
  saveButton: {
    padding: '0.75rem 2rem',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.5px'
  },
  cancelButton: {
    padding: '0.75rem 2rem',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    border: '1px solid #000000',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.5px'
  },
  tableWrapper: {
    flex: 1,
    overflowX: 'auto',
    overflowY: 'auto',
    position: 'relative',
    backgroundColor: '#FFFFFF'
  },
  table: {
    width: 'max-content',
    borderCollapse: 'separate',
    borderSpacing: 0,
    fontSize: '13px'
  },
  thFixed: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    textAlign: 'left',
    padding: '0.75rem 0.5rem',
    borderRight: '1px solid #333333',
    zIndex: 3
  },
  th: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#333333',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    textAlign: 'center',
    padding: '0.75rem 0.5rem',
    borderRight: '1px solid #555555',
    zIndex: 2
  },
  thSub: {
    position: 'sticky',
    top: '2.5rem',
    backgroundColor: '#F5F5F5',
    color: '#000000',
    fontWeight: '600',
    fontSize: '9px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    textAlign: 'center',
    padding: '0.5rem',
    borderRight: '1px solid #EEEEEE',
    borderBottom: '2px solid #DDDDDD',
    minWidth: '100px',
    zIndex: 2
  },
  tdFixed: {
    position: 'sticky',
    backgroundColor: '#FFFFFF',
    padding: '0.5rem',
    borderRight: '1px solid #EEEEEE',
    borderBottom: '1px solid #EEEEEE',
    fontSize: '12px',
    fontWeight: '600',
    zIndex: 1
  },
  td: {
    padding: '0.5rem',
    textAlign: 'right',
    borderRight: '1px solid #EEEEEE',
    borderBottom: '1px solid #EEEEEE',
    minWidth: '100px',
    fontSize: '12px'
  },
  editButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '600',
    marginRight: '0.25rem'
  },
  deleteButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#FFFFFF',
    color: '#C00',
    border: '1px solid #C00',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '600'
  },
  totalRow: {
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontWeight: '700'
  },
  totalLabel: {
    position: 'sticky',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    padding: '0.75rem 0.5rem',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    borderRight: '1px solid #333333',
    zIndex: 3
  },
  totalCell: {
    padding: '0.75rem 0.5rem',
    textAlign: 'right',
    fontSize: '11px',
    fontWeight: '700',
    borderRight: '1px solid #333333'
  },
  emptyState: {
    padding: '3rem',
    textAlign: 'center',
    color: '#666666',
    fontSize: '14px'
  }
};

export default AdminActualsView;
