import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { getCurrencySymbol } from '../../utils/currencyMap';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Add global style to remove number input arrows
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;
if (!document.querySelector('style[data-admin-activity-plan]')) {
  styleTag.setAttribute('data-admin-activity-plan', 'true');
  document.head.appendChild(styleTag);
}

const AdminActivityPlanView = () => {
  const { userMarket } = useAuth();
  const [activities, setActivities] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [currencyRates, setCurrencyRates] = useState({});
  const [selectedMarket, setSelectedMarket] = useState('');
  const [reportingMonth, setReportingMonth] = useState('Dec');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingMetadata, setEditingMetadata] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    businessUnit: '',
    campaign: '',
    medium: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Auto-select user's assigned market
    if (userMarket) {
      setSelectedMarket(userMarket);
    } else if (markets.length > 0 && !selectedMarket) {
      setSelectedMarket(markets[0].name);
    }
  }, [markets, userMarket]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load markets
      const marketsSnapshot = await getDocs(collection(db, 'markets'));
      const marketsList = marketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMarkets(marketsList);

      // Load mediums
      const mediumsSnapshot = await getDocs(collection(db, 'mediums'));
      const mediumsList = mediumsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMediums(mediumsList);

      // Load currency rates
      const ratesSnapshot = await getDocs(collection(db, 'currencyRates'));
      const ratesMap = {};
      ratesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        ratesMap[data.market] = data.rate;
      });
      setCurrencyRates(ratesMap);

      // Load all activities (admin sees everything)
      const activitiesSnapshot = await getDocs(collection(db, 'activityPlan'));
      const activitiesList = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(activitiesList);
    } catch (err) {
      setError('Error loading data: ' + err.message);
    }
    setLoading(false);
  };

  const formatNumber = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatRate = (rate) => {
    if (!rate && rate !== 0) return '-';
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(rate);
  };

  const calculateRowTotal = (monthlySpend) => {
    return Object.values(monthlySpend || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const convertToZAR = (localAmount, market) => {
    const rate = currencyRates[market] || 1;
    return localAmount * rate;
  };

  const getFilteredActivities = () => {
    if (!selectedMarket) return [];
    return activities.filter(a => a.market === selectedMarket);
  };

  const calculateYTD = (monthlySpend, reportingMonth) => {
    const monthIndex = MONTHS.indexOf(reportingMonth);
    if (monthIndex === -1) return 0;

    let ytd = 0;
    for (let i = 0; i <= monthIndex; i++) {
      ytd += parseFloat(monthlySpend[MONTHS[i]]) || 0;
    }
    return ytd;
  };

  const getStatistics = () => {
    const filtered = getFilteredActivities();

    // Business Unit stats
    const businessUnitTotals = {};
    filtered.forEach(activity => {
      const bu = activity.businessUnit || 'Unknown';
      if (!businessUnitTotals[bu]) businessUnitTotals[bu] = 0;
      businessUnitTotals[bu] += activity.totalSpendZAR || 0;
    });

    // Campaign stats
    const campaignTotals = {};
    filtered.forEach(activity => {
      const campaign = activity.campaign || 'Unknown';
      if (!campaignTotals[campaign]) campaignTotals[campaign] = 0;
      campaignTotals[campaign] += activity.totalSpendZAR || 0;
    });

    // Medium stats
    const mediumTotals = {};
    filtered.forEach(activity => {
      const medium = activity.medium || 'Unknown';
      if (!mediumTotals[medium]) mediumTotals[medium] = 0;
      mediumTotals[medium] += activity.totalSpendZAR || 0;
    });

    return {
      businessUnit: Object.entries(businessUnitTotals).sort((a, b) => b[1] - a[1]),
      campaign: Object.entries(campaignTotals).sort((a, b) => b[1] - a[1]).slice(0, 10),
      medium: Object.entries(mediumTotals).sort((a, b) => b[1] - a[1])
    };
  };

  const handleCellClick = (activityId, month) => {
    setEditingCell({ activityId, month });
    const activity = activities.find(a => a.id === activityId);
    setEditValue(activity?.monthlySpend?.[month] || '0');
  };

  const handleCellBlur = async () => {
    if (!editingCell) return;

    const { activityId, month } = editingCell;
    const activity = activities.find(a => a.id === activityId);

    if (!activity) {
      setEditingCell(null);
      return;
    }

    const newValue = parseFloat(editValue) || 0;
    const currentValue = activity.monthlySpend?.[month] || 0;

    // Only update if value changed
    if (newValue !== currentValue) {
      try {
        const updatedMonthlySpend = {
          ...activity.monthlySpend,
          [month]: newValue
        };

        // Remove month if value is 0
        if (newValue === 0) {
          delete updatedMonthlySpend[month];
        }

        const totalLocal = calculateRowTotal(updatedMonthlySpend);
        const totalZAR = convertToZAR(totalLocal, activity.market);

        await updateDoc(doc(db, 'activityPlan', activityId), {
          monthlySpend: updatedMonthlySpend,
          totalSpendLocal: totalLocal,
          totalSpendZAR: totalZAR,
          updatedAt: new Date().toISOString()
        });

        // Update local state
        setActivities(prev => prev.map(a =>
          a.id === activityId
            ? { ...a, monthlySpend: updatedMonthlySpend, totalSpendLocal: totalLocal, totalSpendZAR: totalZAR }
            : a
        ));
      } catch (err) {
        setError('Error updating cell: ' + err.message);
      }
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const calculateColumnTotal = (month) => {
    const filtered = getFilteredActivities();
    return filtered.reduce((sum, activity) => {
      return sum + (parseFloat(activity.monthlySpend?.[month]) || 0);
    }, 0);
  };

  const calculateGrandTotal = () => {
    const filtered = getFilteredActivities();
    return filtered.reduce((sum, activity) => {
      return sum + calculateRowTotal(activity.monthlySpend);
    }, 0);
  };

  const handleAddActivity = async () => {
    if (!newActivity.businessUnit || !newActivity.campaign || !newActivity.medium) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const activityData = {
        market: selectedMarket,
        businessUnit: newActivity.businessUnit,
        campaign: newActivity.campaign,
        medium: newActivity.medium,
        monthlySpend: {},
        totalSpendLocal: 0,
        totalSpendZAR: 0,
        conversionRate: currencyRates[selectedMarket] || 1,
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      };

      const docRef = await addDoc(collection(db, 'activityPlan'), activityData);

      setActivities(prev => [...prev, { id: docRef.id, ...activityData }]);
      setNewActivity({ businessUnit: '', campaign: '', medium: '' });
      setShowAddForm(false);
    } catch (err) {
      setError('Error adding activity: ' + err.message);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'activityPlan', activityId));
      setActivities(prev => prev.filter(a => a.id !== activityId));
    } catch (err) {
      setError('Error deleting activity: ' + err.message);
    }
  };

  const handleMetadataEdit = (activityId, field) => {
    const activity = activities.find(a => a.id === activityId);
    setEditingMetadata({ activityId, field, value: activity[field] });
  };

  const handleMetadataUpdate = async (activityId) => {
    if (!editingMetadata) return;

    const { field, value } = editingMetadata;

    try {
      await updateDoc(doc(db, 'activityPlan', activityId), {
        [field]: value,
        updatedAt: new Date().toISOString()
      });

      setActivities(prev => prev.map(a =>
        a.id === activityId ? { ...a, [field]: value } : a
      ));

      setEditingMetadata(null);
    } catch (err) {
      setError('Error updating activity: ' + err.message);
    }
  };

  // Get unique business units and campaigns from existing activities
  const businessUnits = ['CIB', 'RBB', 'Brand'];
  const campaigns = [...new Set(activities.map(a => a.campaign))].sort();

  const filteredActivities = getFilteredActivities();
  const currencySymbol = getCurrencySymbol(selectedMarket);
  const conversionRate = currencyRates[selectedMarket] || 1;
  const statistics = getStatistics();

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Compact Header */}
      <div style={styles.compactHeader}>
        <h2 style={styles.marketTitle}>{selectedMarket}</h2>
        <div style={styles.headerControls}>
          <div style={styles.controlItem}>
            <span style={styles.controlLabel}>Reporting Month:</span>
            <select
              value={reportingMonth}
              onChange={(e) => setReportingMonth(e.target.value)}
              style={styles.controlSelect}
            >
              {MONTHS.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div style={styles.controlItem}>
            <span style={styles.controlLabel}>Conversion:</span>
            <span style={styles.controlValue}>1 {currencySymbol} = {formatRate(conversionRate)} ZAR</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            ...styles.tab,
            ...(activeTab === 'dashboard' ? styles.activeTab : {})
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('activityPlan')}
          style={{
            ...styles.tab,
            ...(activeTab === 'activityPlan' ? styles.activeTab : {})
          }}
        >
          Activity Plan
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Business Unit (ZAR)</h3>
          <div style={styles.barChartContainer}>
            {statistics.businessUnit.map(([name, total]) => {
              const maxTotal = Math.max(...statistics.businessUnit.map(([,t]) => t));
              const percentage = (total / maxTotal) * 100;
              return (
                <div key={name} style={styles.barRow}>
                  <div style={styles.barLabel}>{name}</div>
                  <div style={styles.barWrapper}>
                    <div style={{...styles.bar, width: `${percentage}%`}}></div>
                    <div style={styles.barValue}>{formatNumber(total)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Top 10 Campaigns (ZAR)</h3>
          <div style={styles.barChartContainer}>
            {statistics.campaign.map(([name, total]) => {
              const maxTotal = Math.max(...statistics.campaign.map(([,t]) => t));
              const percentage = (total / maxTotal) * 100;
              return (
                <div key={name} style={styles.barRow}>
                  <div style={styles.barLabel}>{name}</div>
                  <div style={styles.barWrapper}>
                    <div style={{...styles.bar, width: `${percentage}%`}}></div>
                    <div style={styles.barValue}>{formatNumber(total)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.statCard}>
          <h3 style={styles.statTitle}>Medium (ZAR)</h3>
          <div style={styles.barChartContainer}>
            {statistics.medium.map(([name, total]) => {
              const maxTotal = Math.max(...statistics.medium.map(([,t]) => t));
              const percentage = (total / maxTotal) * 100;
              return (
                <div key={name} style={styles.barRow}>
                  <div style={styles.barLabel}>{name}</div>
                  <div style={styles.barWrapper}>
                    <div style={{...styles.bar, width: `${percentage}%`}}></div>
                    <div style={styles.barValue}>{formatNumber(total)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      )}

      {/* Activity Plan Tab */}
      {activeTab === 'activityPlan' && (
        <>
          <div style={styles.actionBar}>
            <button onClick={() => setShowAddForm(!showAddForm)} style={styles.addButton}>
              {showAddForm ? 'CANCEL' : '+ ADD NEW ACTIVITY'}
            </button>
          </div>

      {showAddForm && (
        <div style={styles.addForm}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Business Unit</label>
              <select
                value={newActivity.businessUnit}
                onChange={(e) => setNewActivity({...newActivity, businessUnit: e.target.value})}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {businessUnits.map(bu => (
                  <option key={bu} value={bu}>{bu}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Campaign</label>
              <input
                type="text"
                value={newActivity.campaign}
                onChange={(e) => setNewActivity({...newActivity, campaign: e.target.value})}
                style={styles.formInput}
                placeholder="Enter campaign name"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Medium</label>
              <select
                value={newActivity.medium}
                onChange={(e) => setNewActivity({...newActivity, medium: e.target.value})}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {mediums.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
            <button onClick={handleAddActivity} style={styles.saveButton}>ADD</button>
          </div>
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{...styles.thFixed, left: 0, width: '50px', minWidth: '50px', maxWidth: '50px'}}>Del</th>
              <th style={{...styles.thFixed, left: '50px', width: '80px', minWidth: '80px', maxWidth: '80px', whiteSpace: 'normal', lineHeight: '1.2'}}>Business Unit</th>
              <th style={{...styles.thFixed, left: '130px', width: '160px', minWidth: '160px', maxWidth: '160px'}}>Campaign</th>
              <th style={{...styles.thFixed, left: '290px', width: '120px', minWidth: '120px', maxWidth: '120px'}}>Medium</th>
              <th style={{...styles.thTotal, left: '410px', width: '100px', minWidth: '100px', maxWidth: '100px'}}>Total (ZAR)</th>
              <th style={{...styles.thTotal, left: '510px', width: '100px', minWidth: '100px', maxWidth: '100px'}}>Total ({currencySymbol})</th>
              <th style={{...styles.thTotal, left: '610px', width: '100px', minWidth: '100px', maxWidth: '100px'}}>YTD (ZAR)</th>
              <th style={{...styles.thTotal, left: '710px', width: '100px', minWidth: '100px', maxWidth: '100px'}}>YTD ({currencySymbol})</th>
              {MONTHS.map(month => (
                <th key={month} style={styles.th}>{month}</th>
              ))}
            </tr>
          </thead>
            <tbody>
              {filteredActivities.map(activity => {
                const totalLocal = calculateRowTotal(activity.monthlySpend);
                const totalZAR = convertToZAR(totalLocal, activity.market);

                const isEditingBU = editingMetadata?.activityId === activity.id && editingMetadata?.field === 'businessUnit';
                const isEditingCampaign = editingMetadata?.activityId === activity.id && editingMetadata?.field === 'campaign';
                const isEditingMedium = editingMetadata?.activityId === activity.id && editingMetadata?.field === 'medium';

                return (
                  <tr key={activity.id} style={styles.tr}>
                    <td style={{...styles.tdFixed, left: 0, width: '50px', minWidth: '50px', maxWidth: '50px', textAlign: 'center', padding: '0.2rem'}}>
                      <button onClick={() => handleDeleteActivity(activity.id)} style={styles.deleteBtn}>×</button>
                    </td>
                    <td
                      style={{...styles.tdFixed, ...styles.tdBusinessUnit, left: '50px', width: '80px', minWidth: '80px', maxWidth: '80px', cursor: 'pointer'}}
                      onClick={() => !isEditingBU && handleMetadataEdit(activity.id, 'businessUnit')}
                    >
                      {isEditingBU ? (
                        <select
                          value={editingMetadata.value}
                          onChange={(e) => setEditingMetadata({...editingMetadata, value: e.target.value})}
                          onBlur={() => handleMetadataUpdate(activity.id)}
                          style={styles.editSelect}
                          autoFocus
                        >
                          {businessUnits.map(bu => (
                            <option key={bu} value={bu}>{bu}</option>
                          ))}
                        </select>
                      ) : (
                        activity.businessUnit
                      )}
                    </td>
                    <td
                      style={{...styles.tdFixed, ...styles.tdSmallText, left: '130px', width: '160px', minWidth: '160px', maxWidth: '160px', cursor: 'pointer'}}
                      onClick={() => !isEditingCampaign && handleMetadataEdit(activity.id, 'campaign')}
                    >
                      {isEditingCampaign ? (
                        <input
                          type="text"
                          value={editingMetadata.value}
                          onChange={(e) => setEditingMetadata({...editingMetadata, value: e.target.value})}
                          onBlur={() => handleMetadataUpdate(activity.id)}
                          style={styles.editInput}
                          autoFocus
                        />
                      ) : (
                        activity.campaign
                      )}
                    </td>
                    <td
                      style={{...styles.tdFixed, ...styles.tdSmallText, left: '290px', width: '120px', minWidth: '120px', maxWidth: '120px', cursor: 'pointer'}}
                      onClick={() => !isEditingMedium && handleMetadataEdit(activity.id, 'medium')}
                    >
                      {isEditingMedium ? (
                        <select
                          value={editingMetadata.value}
                          onChange={(e) => setEditingMetadata({...editingMetadata, value: e.target.value})}
                          onBlur={() => handleMetadataUpdate(activity.id)}
                          style={styles.editSelect}
                          autoFocus
                        >
                          {mediums.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                      ) : (
                        activity.medium
                      )}
                    </td>
                    <td style={{...styles.tdTotalCell, left: '410px', width: '100px', minWidth: '100px', maxWidth: '100px'}}>{formatNumber(totalZAR)}</td>
                    <td style={{...styles.tdTotalCell, left: '510px', width: '100px', minWidth: '100px', maxWidth: '100px'}}>{formatNumber(totalLocal)}</td>
                    <td style={{...styles.tdTotalCell, left: '610px', width: '100px', minWidth: '100px', maxWidth: '100px'}}>{formatNumber(convertToZAR(calculateYTD(activity.monthlySpend, reportingMonth), activity.market))}</td>
                    <td style={{...styles.tdTotalCell, left: '710px', width: '100px', minWidth: '100px', maxWidth: '100px'}}>{formatNumber(calculateYTD(activity.monthlySpend, reportingMonth))}</td>
                    {MONTHS.map(month => {
                      const value = activity.monthlySpend?.[month] || 0;
                      const isEditing = editingCell?.activityId === activity.id && editingCell?.month === month;

                      return (
                        <td
                          key={month}
                          style={styles.td}
                          onClick={() => !isEditing && handleCellClick(activity.id, month)}
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={handleKeyDown}
                              style={styles.input}
                              autoFocus
                            />
                          ) : (
                            <span style={value > 0 ? styles.cellValue : styles.cellEmpty}>
                              {value > 0 ? formatNumber(value) : '-'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr style={styles.totalRow}>
                <td style={{...styles.totalLabel, left: 0, width: '50px', minWidth: '50px', maxWidth: '50px'}}></td>
                <td style={{...styles.totalLabel, left: '50px', width: '80px', minWidth: '80px', maxWidth: '80px'}}>TOTAL</td>
                <td style={{...styles.totalLabel, left: '130px', width: '160px', minWidth: '160px', maxWidth: '160px'}}></td>
                <td style={{...styles.totalLabel, left: '290px', width: '120px', minWidth: '120px', maxWidth: '120px'}}></td>
                <td style={{...styles.grandTotal, left: '410px', width: '100px', minWidth: '100px', maxWidth: '100px'}}>{formatNumber(convertToZAR(calculateGrandTotal(), selectedMarket))}</td>
                <td style={{...styles.grandTotal, left: '510px', width: '100px', minWidth: '100px', maxWidth: '100px'}}>{formatNumber(calculateGrandTotal())}</td>
                <td style={{...styles.grandTotal, left: '610px', width: '100px', minWidth: '100px', maxWidth: '100px'}}></td>
                <td style={{...styles.grandTotal, left: '710px', width: '100px', minWidth: '100px', maxWidth: '100px'}}></td>
                {MONTHS.map(month => (
                  <td key={month} style={styles.totalCell}>
                    {formatNumber(calculateColumnTotal(month))}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
      </div>

          <div style={styles.instructions}>
            <p><strong>Instructions:</strong> Click on any month cell to edit the value. Press Enter to save or Escape to cancel.</p>
          </div>
        </>
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
  compactHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    borderBottom: '2px solid #000000',
    flexShrink: 0,
    backgroundColor: '#FFFFFF'
  },
  marketTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#000000',
    margin: 0
  },
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem'
  },
  controlItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  controlLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#666666',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  controlSelect: {
    padding: '0.4rem 0.6rem',
    fontSize: '13px',
    fontWeight: '600',
    border: '1px solid #CCCCCC',
    borderRadius: '2px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    outline: 'none'
  },
  controlValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#000000'
  },
  tabsContainer: {
    display: 'flex',
    gap: '0.5rem',
    padding: '0 2rem',
    borderBottom: '2px solid #EEEEEE',
    backgroundColor: '#FFFFFF'
  },
  tab: {
    padding: '1rem 2rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#666666',
    transition: 'all 0.2s',
    outline: 'none'
  },
  activeTab: {
    color: '#000000',
    borderBottomColor: '#000000'
  },
  error: {
    padding: '1rem',
    margin: '1rem 2rem',
    backgroundColor: '#FFEBEE',
    border: '1px solid #F44336',
    borderRadius: '4px',
    color: '#C62828',
    fontSize: '14px'
  },
  tableWrapper: {
    flex: 1,
    width: '100%',
    overflowX: 'auto',
    overflowY: 'auto',
    position: 'relative'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11px',
    minWidth: '1400px'
  },
  thFixed: {
    position: 'sticky',
    padding: '0.5rem',
    textAlign: 'left',
    fontSize: '9px',
    fontWeight: '600',
    textTransform: 'uppercase',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    borderRight: '1px solid #333333',
    top: 0,
    zIndex: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  th: {
    padding: '0.5rem',
    textAlign: 'center',
    fontSize: '9px',
    fontWeight: '600',
    textTransform: 'uppercase',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    borderRight: '1px solid #333333',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    minWidth: '80px'
  },
  thTotal: {
    position: 'sticky',
    padding: '0.5rem',
    textAlign: 'right',
    fontSize: '9px',
    fontWeight: '600',
    textTransform: 'uppercase',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    borderRight: '3px solid #FFFFFF',
    top: 0,
    zIndex: 20
  },
  tr: {
    borderBottom: '1px solid #EEEEEE',
    transition: 'background-color 0.2s'
  },
  tdFixed: {
    position: 'sticky',
    padding: '0.4rem',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #EEEEEE',
    fontSize: '11px',
    fontWeight: '500',
    zIndex: 5,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  tdBusinessUnit: {
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    lineHeight: '1.2',
    fontSize: '10px'
  },
  tdSmallText: {
    fontSize: '10px',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    lineHeight: '1.3'
  },
  tdTotalCell: {
    position: 'sticky',
    padding: '0.3rem',
    textAlign: 'right',
    fontWeight: '600',
    backgroundColor: '#F5F5F5',
    borderRight: '3px solid #CCCCCC',
    zIndex: 5,
    fontSize: '10px'
  },
  td: {
    padding: '0.3rem',
    textAlign: 'center',
    borderRight: '1px solid #F5F5F5',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    minWidth: '80px',
    fontSize: '11px'
  },
  cellValue: {
    color: '#000000',
    fontWeight: '500',
    fontSize: '11px'
  },
  cellEmpty: {
    color: '#CCCCCC',
    fontSize: '11px'
  },
  input: {
    width: '100%',
    padding: '0.2rem',
    fontSize: '11px',
    border: '2px solid #000000',
    borderRadius: '2px',
    textAlign: 'center',
    fontFamily: "'Montserrat', sans-serif",
    MozAppearance: 'textfield',
    appearance: 'textfield'
  },
  totalRow: {
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontWeight: '700',
    position: 'sticky',
    bottom: 0,
    zIndex: 10
  },
  totalLabel: {
    position: 'sticky',
    padding: '0.5rem',
    textAlign: 'left',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    backgroundColor: '#000000',
    zIndex: 15
  },
  totalCell: {
    padding: '0.5rem',
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: '700',
    minWidth: '80px'
  },
  grandTotal: {
    position: 'sticky',
    padding: '0.5rem',
    textAlign: 'right',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#000000',
    borderRight: '3px solid #FFFFFF',
    zIndex: 15
  },
  instructions: {
    padding: '0.75rem 2rem',
    backgroundColor: '#F5F5F5',
    fontSize: '11px',
    color: '#666666',
    flexShrink: 0
  },
  actionBar: {
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'flex-start',
    gap: '1rem'
  },
  addButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.5px'
  },
  addForm: {
    padding: '1rem 2rem',
    backgroundColor: '#F5F5F5',
    borderBottom: '1px solid #EEEEEE'
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-end'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1
  },
  formLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#666666',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  formSelect: {
    padding: '0.5rem',
    fontSize: '11px',
    border: '1px solid #CCCCCC',
    borderRadius: '2px',
    fontFamily: "'Montserrat', sans-serif"
  },
  formInput: {
    padding: '0.5rem',
    fontSize: '11px',
    border: '1px solid #CCCCCC',
    borderRadius: '2px',
    fontFamily: "'Montserrat', sans-serif"
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
    letterSpacing: '0.5px',
    height: '35px'
  },
  deleteBtn: {
    width: '25px',
    height: '25px',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    lineHeight: '1',
    padding: 0
  },
  editSelect: {
    width: '100%',
    padding: '0.2rem',
    fontSize: '10px',
    border: '2px solid #000000',
    borderRadius: '2px',
    fontFamily: "'Montserrat', sans-serif"
  },
  editInput: {
    width: '100%',
    padding: '0.2rem',
    fontSize: '10px',
    border: '2px solid #000000',
    borderRadius: '2px',
    fontFamily: "'Montserrat', sans-serif"
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
    padding: '2rem',
    backgroundColor: '#F5F5F5',
    overflowY: 'auto',
    flex: 1
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: '1.5rem',
    borderRadius: '4px',
    border: '1px solid #EEEEEE'
  },
  statTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '1rem',
    margin: 0
  },
  barChartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1rem'
  },
  barRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },
  barLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#333333',
    minWidth: '80px',
    maxWidth: '80px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  barWrapper: {
    flex: 1,
    position: 'relative',
    height: '20px',
    backgroundColor: '#EEEEEE',
    borderRadius: '2px',
    display: 'flex',
    alignItems: 'center'
  },
  bar: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: '2px',
    minWidth: '2px'
  },
  barValue: {
    position: 'absolute',
    right: '8px',
    fontSize: '10px',
    fontWeight: '700',
    color: '#666666'
  }
};

export default AdminActivityPlanView;
