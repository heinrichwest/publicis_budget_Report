import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { getCurrencySymbol } from '../../utils/currencyMap';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Fixed list of 11 mediums in order
const FIXED_MEDIUMS = [
  'Television',
  'Digital',
  'Search',
  'META',
  'LinkedIn',
  'Programmatic Display',
  'Programmatic Video',
  'Radio',
  'Print',
  'OOH',
  'DOOH'
];

const AdminActualsView = () => {
  const [actuals, setActuals] = useState([]);
  const [userMarket, setUserMarket] = useState('');
  const [currencyRate, setCurrencyRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState(null); // { index, month, field }
  const [editValue, setEditValue] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

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

        // Load currency rate for this market
        const ratesSnapshot = await getDocs(collection(db, 'currencyRates'));
        ratesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.market === market) {
            setCurrencyRate(data.rate || 1);
          }
        });

        // Load actuals for this market
        const actualsSnapshot = await getDocs(
          query(collection(db, 'actuals'), where('market', '==', market))
        );
        const actualsData = actualsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Create ordered list of actuals based on FIXED_MEDIUMS
        const orderedActuals = FIXED_MEDIUMS.map(mediumName => {
          const actual = actualsData.find(a => a.medium === mediumName);
          return actual || {
            medium: mediumName,
            monthlyActuals: MONTHS.reduce((acc, month) => {
              acc[month] = { rateCard: 0, discount: 0, addedValue: 0 };
              return acc;
            }, {})
          };
        });

        setActuals(orderedActuals);
      }
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

  const calculateRowTotal = (monthlyActuals) => {
    return MONTHS.reduce((sum, month) => {
      const monthData = monthlyActuals?.[month] || { rateCard: 0, discount: 0, addedValue: 0 };
      const rateCard = parseFloat(monthData.rateCard) || 0;
      const discount = parseFloat(monthData.discount) || 0;
      const addedValue = parseFloat(monthData.addedValue) || 0;
      const nett = rateCard - discount;

      return {
        rateCard: sum.rateCard + rateCard,
        discount: sum.discount + discount,
        nett: sum.nett + nett,
        addedValue: sum.addedValue + addedValue
      };
    }, { rateCard: 0, discount: 0, nett: 0, addedValue: 0 });
  };

  const calculateMonthTotal = (month, field) => {
    return actuals.reduce((sum, actual) => {
      const monthData = actual.monthlyActuals?.[month] || { rateCard: 0, discount: 0, addedValue: 0 };

      if (field === 'nett') {
        const rateCard = parseFloat(monthData.rateCard) || 0;
        const discount = parseFloat(monthData.discount) || 0;
        return sum + (rateCard - discount);
      }

      const value = parseFloat(monthData[field]) || 0;
      return sum + value;
    }, 0);
  };

  // Cell editing handlers
  const startEditing = (index, month, field, currentValue) => {
    setEditingCell({ index, month, field });
    setEditValue(currentValue?.toString() || '0');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditChange = (e) => {
    setEditValue(e.target.value);
  };

  const saveEdit = () => {
    if (!editingCell) return;

    const { index, month, field } = editingCell;
    const newValue = parseFloat(editValue) || 0;

    // Update local state
    setActuals(prevActuals =>
      prevActuals.map((actual, i) => {
        if (i === index) {
          const updatedMonthlyActuals = { ...actual.monthlyActuals };
          if (!updatedMonthlyActuals[month]) {
            updatedMonthlyActuals[month] = { rateCard: 0, discount: 0, addedValue: 0 };
          }
          updatedMonthlyActuals[month] = {
            ...updatedMonthlyActuals[month],
            [field]: newValue
          };
          return { ...actual, monthlyActuals: updatedMonthlyActuals };
        }
        return actual;
      })
    );

    setHasChanges(true);
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const saveAllChanges = async () => {
    setSaving(true);
    setError('');

    try {
      // Save all actuals to Firestore
      const updatePromises = actuals.map(async (actual) => {
        if (actual.id) {
          // Update existing document
          const actualRef = doc(db, 'actuals', actual.id);
          return updateDoc(actualRef, {
            monthlyActuals: actual.monthlyActuals
          });
        } else {
          // Create new document for this medium
          return addDoc(collection(db, 'actuals'), {
            market: userMarket,
            medium: actual.medium,
            monthlyActuals: actual.monthlyActuals
          });
        }
      });

      await Promise.all(updatePromises);
      setHasChanges(false);

      // Reload data to get the new IDs
      await loadData();
      alert('All changes saved successfully!');
    } catch (err) {
      setError('Error saving changes: ' + err.message);
    }
    setSaving(false);
  };

  const currencySymbol = getCurrencySymbol(userMarket);

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>{userMarket} - Actuals</h2>
        {hasChanges && (
          <button
            onClick={saveAllChanges}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? 'SAVING...' : 'SAVE ALL CHANGES'}
          </button>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Actuals Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            {/* Main header row */}
            <tr>
              <th style={{ ...styles.thFixed, left: 0, width: '180px' }} rowSpan="2">Medium</th>
              <th style={styles.thTotal} colSpan="7">TOTAL</th>
              {MONTHS.map((month, index) => (
                <th key={month} style={{...styles.th, borderRight: index === 11 ? '1px solid #555555' : '2px solid #000000'}} colSpan="6">{month}</th>
              ))}
            </tr>
            {/* Sub-header row */}
            <tr>
              {/* Total columns */}
              <th style={styles.thSub}>Rate Card<br/>({currencySymbol})</th>
              <th style={styles.thSub}>Discount<br/>({currencySymbol})</th>
              <th style={styles.thSub}>Disc %</th>
              <th style={styles.thSub}>Nett<br/>({currencySymbol})</th>
              <th style={styles.thSub}>Added Value<br/>({currencySymbol})</th>
              <th style={styles.thSub}>AV %</th>
              <th style={{...styles.thSub, borderRight: '2px solid #DDDDDD'}}>Nett<br/>(ZAR)</th>

              {/* Monthly columns */}
              {MONTHS.map((month, monthIndex) => (
                <React.Fragment key={month}>
                  <th style={styles.thSub}>Rate Card</th>
                  <th style={styles.thSub}>Discount</th>
                  <th style={styles.thSub}>Disc %</th>
                  <th style={styles.thSub}>Nett</th>
                  <th style={styles.thSub}>Added Value</th>
                  <th style={{...styles.thSub, borderRight: monthIndex === 11 ? '1px solid #EEEEEE' : '2px solid #DDDDDD'}}>AV %</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {actuals.map((actual, index) => {
              const totals = calculateRowTotal(actual.monthlyActuals);
              const totalNettZAR = totals.nett * currencyRate;
              const totalDiscPerc = totals.rateCard > 0 ? (totals.discount / totals.rateCard) * 100 : 0;
              const totalAVPerc = totals.rateCard > 0 ? (totals.addedValue / totals.rateCard) * 100 : 0;

              return (
                <tr key={index}>
                  <td style={{ ...styles.tdFixed, left: 0, width: '180px' }}>{actual.medium}</td>

                  {/* Total columns */}
                  <td style={styles.tdTotal}>{formatNumber(totals.rateCard)}</td>
                  <td style={styles.tdTotal}>{formatNumber(totals.discount)}</td>
                  <td style={styles.tdTotal}>{totalDiscPerc.toFixed(2)}%</td>
                  <td style={styles.tdTotal}>{formatNumber(totals.nett)}</td>
                  <td style={styles.tdTotal}>{formatNumber(totals.addedValue)}</td>
                  <td style={styles.tdTotal}>{totalAVPerc.toFixed(2)}%</td>
                  <td style={{...styles.tdTotal, borderRight: '2px solid #DDDDDD'}}>{formatNumber(totalNettZAR)}</td>

                  {/* Monthly columns - Editable */}
                  {MONTHS.map((month, monthIndex) => {
                    const monthData = actual.monthlyActuals?.[month] || { rateCard: 0, discount: 0, addedValue: 0 };
                    const rateCard = parseFloat(monthData.rateCard) || 0;
                    const discount = parseFloat(monthData.discount) || 0;
                    const addedValue = parseFloat(monthData.addedValue) || 0;
                    const nett = rateCard - discount;
                    const discPerc = rateCard > 0 ? (discount / rateCard) * 100 : 0;
                    const avPerc = rateCard > 0 ? (addedValue / rateCard) * 100 : 0;

                    const isEditingRateCard = editingCell?.index === index && editingCell?.month === month && editingCell?.field === 'rateCard';
                    const isEditingDiscount = editingCell?.index === index && editingCell?.month === month && editingCell?.field === 'discount';
                    const isEditingAddedValue = editingCell?.index === index && editingCell?.month === month && editingCell?.field === 'addedValue';

                    return (
                      <React.Fragment key={month}>
                        {/* Rate Card - Editable */}
                        <td style={styles.tdEditable} onClick={() => !isEditingRateCard && startEditing(index, month, 'rateCard', rateCard)}>
                          {isEditingRateCard ? (
                            <input
                              type="number"
                              value={editValue}
                              onChange={handleEditChange}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              style={styles.editInput}
                              autoFocus
                            />
                          ) : (
                            formatNumber(rateCard)
                          )}
                        </td>
                        {/* Discount - Editable */}
                        <td style={styles.tdEditable} onClick={() => !isEditingDiscount && startEditing(index, month, 'discount', discount)}>
                          {isEditingDiscount ? (
                            <input
                              type="number"
                              value={editValue}
                              onChange={handleEditChange}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              style={styles.editInput}
                              autoFocus
                            />
                          ) : (
                            formatNumber(discount)
                          )}
                        </td>
                        {/* Disc % - Calculated */}
                        <td style={styles.td}>{discPerc.toFixed(2)}%</td>
                        {/* Nett - Calculated */}
                        <td style={styles.td}>{formatNumber(nett)}</td>
                        {/* Added Value - Editable */}
                        <td style={styles.tdEditable} onClick={() => !isEditingAddedValue && startEditing(index, month, 'addedValue', addedValue)}>
                          {isEditingAddedValue ? (
                            <input
                              type="number"
                              value={editValue}
                              onChange={handleEditChange}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              style={styles.editInput}
                              autoFocus
                            />
                          ) : (
                            formatNumber(addedValue)
                          )}
                        </td>
                        {/* AV % - Calculated */}
                        <td style={{...styles.td, borderRight: monthIndex === 11 ? '1px solid #EEEEEE' : '2px solid #DDDDDD'}}>{avPerc.toFixed(2)}%</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}

            {/* Totals Row */}
            <tr style={styles.totalRow}>
              <td style={{ ...styles.totalLabel, left: 0, width: '180px' }}>TOTAL</td>

              {/* Grand totals */}
              {(() => {
                const grandTotals = actuals.reduce((sum, actual) => {
                  const rowTotals = calculateRowTotal(actual.monthlyActuals);
                  return {
                    rateCard: sum.rateCard + rowTotals.rateCard,
                    discount: sum.discount + rowTotals.discount,
                    nett: sum.nett + rowTotals.nett,
                    addedValue: sum.addedValue + rowTotals.addedValue
                  };
                }, { rateCard: 0, discount: 0, nett: 0, addedValue: 0 });

                const grandNettZAR = grandTotals.nett * currencyRate;
                const grandDiscPerc = grandTotals.rateCard > 0 ? (grandTotals.discount / grandTotals.rateCard) * 100 : 0;
                const grandAVPerc = grandTotals.rateCard > 0 ? (grandTotals.addedValue / grandTotals.rateCard) * 100 : 0;

                return (
                  <>
                    <td style={styles.totalCell}>{formatNumber(grandTotals.rateCard)}</td>
                    <td style={styles.totalCell}>{formatNumber(grandTotals.discount)}</td>
                    <td style={styles.totalCell}>{grandDiscPerc.toFixed(2)}%</td>
                    <td style={styles.totalCell}>{formatNumber(grandTotals.nett)}</td>
                    <td style={styles.totalCell}>{formatNumber(grandTotals.addedValue)}</td>
                    <td style={styles.totalCell}>{grandAVPerc.toFixed(2)}%</td>
                    <td style={{...styles.totalCell, borderRight: '2px solid #333333'}}>{formatNumber(grandNettZAR)}</td>
                  </>
                );
              })()}

              {/* Monthly totals */}
              {MONTHS.map((month, monthIndex) => {
                const monthTotals = {
                  rateCard: calculateMonthTotal(month, 'rateCard'),
                  discount: calculateMonthTotal(month, 'discount'),
                  nett: calculateMonthTotal(month, 'nett'),
                  addedValue: calculateMonthTotal(month, 'addedValue')
                };
                const monthDiscPerc = monthTotals.rateCard > 0 ? (monthTotals.discount / monthTotals.rateCard) * 100 : 0;
                const monthAVPerc = monthTotals.rateCard > 0 ? (monthTotals.addedValue / monthTotals.rateCard) * 100 : 0;

                return (
                  <React.Fragment key={month}>
                    <td style={styles.totalCell}>{formatNumber(monthTotals.rateCard)}</td>
                    <td style={styles.totalCell}>{formatNumber(monthTotals.discount)}</td>
                    <td style={styles.totalCell}>{monthDiscPerc.toFixed(2)}%</td>
                    <td style={styles.totalCell}>{formatNumber(monthTotals.nett)}</td>
                    <td style={styles.totalCell}>{formatNumber(monthTotals.addedValue)}</td>
                    <td style={{...styles.totalCell, borderRight: monthIndex === 11 ? '1px solid #333333' : '2px solid #333333'}}>{monthAVPerc.toFixed(2)}%</td>
                  </React.Fragment>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div style={styles.instructions}>
        <p><strong>Tip:</strong> Click on Rate Card, Discount, or Added Value cells to edit. Press Enter to save or Escape to cancel. {hasChanges && <span style={{color: '#DC2626', fontWeight: '600'}}>You have unsaved changes!</span>}</p>
      </div>
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
  error: {
    backgroundColor: '#FEE',
    color: '#C00',
    padding: '1rem 2rem',
    margin: '0',
    fontSize: '14px',
    borderBottom: '1px solid #FCC'
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
    left: 0,
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    textAlign: 'left',
    padding: '0.75rem 0.5rem',
    borderRight: '1px solid #333333',
    zIndex: 4
  },
  thTotal: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    textAlign: 'center',
    padding: '0.75rem 0.5rem',
    borderRight: '2px solid #666666',
    zIndex: 2
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
    minWidth: '90px',
    zIndex: 2
  },
  tdFixed: {
    position: 'sticky',
    left: 0,
    backgroundColor: '#FFFFFF',
    padding: '0.5rem',
    borderRight: '1px solid #EEEEEE',
    borderBottom: '1px solid #EEEEEE',
    fontSize: '12px',
    fontWeight: '600',
    zIndex: 1
  },
  tdTotal: {
    backgroundColor: '#FAFAFA',
    padding: '0.5rem',
    textAlign: 'right',
    borderRight: '1px solid #DDDDDD',
    borderBottom: '1px solid #EEEEEE',
    minWidth: '90px',
    fontSize: '12px',
    fontWeight: '600'
  },
  td: {
    padding: '0.5rem',
    textAlign: 'right',
    borderRight: '1px solid #EEEEEE',
    borderBottom: '1px solid #EEEEEE',
    minWidth: '90px',
    fontSize: '12px'
  },
  totalRow: {
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontWeight: '700'
  },
  totalLabel: {
    position: 'sticky',
    left: 0,
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
    borderRight: '1px solid #333333',
    minWidth: '90px'
  },
  instructions: {
    padding: '1rem 2rem',
    backgroundColor: '#F9F9F9',
    borderTop: '1px solid #EEEEEE',
    fontSize: '12px',
    color: '#666666'
  },
  saveButton: {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    transition: 'background-color 0.2s'
  },
  tdEditable: {
    padding: '0.5rem',
    textAlign: 'right',
    borderRight: '1px solid #EEEEEE',
    borderBottom: '1px solid #EEEEEE',
    minWidth: '90px',
    fontSize: '12px',
    cursor: 'pointer',
    backgroundColor: '#FFFEF0',
    transition: 'background-color 0.2s'
  },
  editInput: {
    width: '100%',
    padding: '0.25rem',
    fontSize: '12px',
    fontWeight: '500',
    border: '2px solid #10B981',
    borderRadius: '2px',
    textAlign: 'right',
    outline: 'none',
    backgroundColor: '#FFFFFF'
  }
};

export default AdminActualsView;
