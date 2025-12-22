import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ActivityPlan = () => {
  const { currentUser, userRole, userMarket } = useAuth();
  const [activities, setActivities] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [currencyRates, setCurrencyRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [filterMarket, setFilterMarket] = useState('');
  const [filterBusinessUnit, setFilterBusinessUnit] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [filterMedium, setFilterMedium] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    market: '',
    businessUnit: '',
    campaign: '',
    medium: '',
    monthlySpend: {}
  });

  useEffect(() => {
    loadData();
  }, []);

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

      // Load activities (filter by market if user is a manager)
      let activitiesQuery = collection(db, 'activityPlan');
      if (userRole === 'manager' && userMarket) {
        activitiesQuery = query(activitiesQuery, where('market', '==', userMarket));
      }

      const activitiesSnapshot = await getDocs(activitiesQuery);
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

  const calculateTotalSpend = (monthlySpend) => {
    return Object.values(monthlySpend).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const convertToZAR = (localAmount, market) => {
    const rate = currencyRates[market] || 1;
    return localAmount * rate;
  };

  const getFilteredActivities = () => {
    return activities.filter(activity => {
      if (filterMarket && activity.market !== filterMarket) return false;
      if (filterBusinessUnit && activity.businessUnit !== filterBusinessUnit) return false;
      if (filterCampaign && activity.campaign !== filterCampaign) return false;
      if (filterMedium && activity.medium !== filterMedium) return false;
      return true;
    });
  };

  const calculateStats = () => {
    const filtered = getFilteredActivities();
    let totalLocal = 0;
    let totalZAR = 0;
    const byMedium = {};
    const byMarket = {};

    filtered.forEach(activity => {
      const local = calculateTotalSpend(activity.monthlySpend);
      const zar = convertToZAR(local, activity.market);

      totalLocal += local;
      totalZAR += zar;

      byMedium[activity.medium] = (byMedium[activity.medium] || 0) + zar;
      byMarket[activity.market] = (byMarket[activity.market] || 0) + zar;
    });

    return { totalLocal, totalZAR, byMedium, byMarket, count: filtered.length };
  };

  const handleAdd = async () => {
    if (!formData.market || !formData.businessUnit || !formData.campaign || !formData.medium) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setSuccess('');
    try {
      const totalLocal = calculateTotalSpend(formData.monthlySpend);
      const totalZAR = convertToZAR(totalLocal, formData.market);

      await addDoc(collection(db, 'activityPlan'), {
        market: formData.market,
        businessUnit: formData.businessUnit,
        campaign: formData.campaign,
        medium: formData.medium,
        monthlySpend: formData.monthlySpend,
        totalSpendLocal: totalLocal,
        totalSpendZAR: totalZAR,
        conversionRate: currencyRates[formData.market] || 1,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.email
      });

      setSuccess('Activity added successfully');
      setShowAddForm(false);
      setFormData({ market: '', businessUnit: '', campaign: '', medium: '', monthlySpend: {} });
      loadData();
    } catch (err) {
      setError('Error adding activity: ' + err.message);
    }
  };

  const handleUpdate = async (id) => {
    setError('');
    setSuccess('');
    try {
      const totalLocal = calculateTotalSpend(formData.monthlySpend);
      const totalZAR = convertToZAR(totalLocal, formData.market);

      await updateDoc(doc(db, 'activityPlan', id), {
        market: formData.market,
        businessUnit: formData.businessUnit,
        campaign: formData.campaign,
        medium: formData.medium,
        monthlySpend: formData.monthlySpend,
        totalSpendLocal: totalLocal,
        totalSpendZAR: totalZAR,
        conversionRate: currencyRates[formData.market] || 1,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.email
      });

      setSuccess('Activity updated successfully');
      setEditingId(null);
      loadData();
    } catch (err) {
      setError('Error updating activity: ' + err.message);
    }
  };

  const handleDelete = async (id, campaign) => {
    if (!window.confirm(`Delete activity for ${campaign}?`)) return;

    setError('');
    setSuccess('');
    try {
      await deleteDoc(doc(db, 'activityPlan', id));
      setSuccess('Activity deleted successfully');
      loadData();
    } catch (err) {
      setError('Error deleting activity: ' + err.message);
    }
  };

  const handleEdit = (activity) => {
    setEditingId(activity.id);
    setFormData({
      market: activity.market,
      businessUnit: activity.businessUnit,
      campaign: activity.campaign,
      medium: activity.medium,
      monthlySpend: activity.monthlySpend || {}
    });
  };

  const handleMonthChange = (month, value) => {
    setFormData({
      ...formData,
      monthlySpend: {
        ...formData.monthlySpend,
        [month]: parseFloat(value) || 0
      }
    });
  };

  const stats = calculateStats();
  const filteredActivities = getFilteredActivities();
  const uniqueBusinessUnits = [...new Set(activities.map(a => a.businessUnit))];
  const uniqueCampaigns = [...new Set(activities.map(a => a.campaign))];

  if (loading) {
    return <div style={styles.loading}>Loading Activity Plan...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Activity Plan</h2>
        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} style={styles.addButton}>
            + ADD ACTIVITY
          </button>
        )}
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}
      {success && <div style={styles.successMessage}>{success}</div>}

      {/* Statistics Dashboard */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Activities</div>
          <div style={styles.statValue}>{stats.count}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Spend (ZAR)</div>
          <div style={styles.statValue}>R {stats.totalZAR.toFixed(2)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Avg per Activity</div>
          <div style={styles.statValue}>
            R {stats.count > 0 ? (stats.totalZAR / stats.count).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Market</label>
          <select value={filterMarket} onChange={(e) => setFilterMarket(e.target.value)} style={styles.filterSelect}>
            <option value="">All Markets</option>
            {markets.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Business Unit</label>
          <select value={filterBusinessUnit} onChange={(e) => setFilterBusinessUnit(e.target.value)} style={styles.filterSelect}>
            <option value="">All Units</option>
            {uniqueBusinessUnits.map(bu => <option key={bu} value={bu}>{bu}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Campaign</label>
          <select value={filterCampaign} onChange={(e) => setFilterCampaign(e.target.value)} style={styles.filterSelect}>
            <option value="">All Campaigns</option>
            {uniqueCampaigns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Medium</label>
          <select value={filterMedium} onChange={(e) => setFilterMedium(e.target.value)} style={styles.filterSelect}>
            <option value="">All Mediums</option>
            {mediums.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </div>
        {(filterMarket || filterBusinessUnit || filterCampaign || filterMedium) && (
          <button
            onClick={() => {
              setFilterMarket('');
              setFilterBusinessUnit('');
              setFilterCampaign('');
              setFilterMedium('');
            }}
            style={styles.clearFiltersButton}
          >
            CLEAR FILTERS
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div style={styles.formContainer}>
          <h3 style={styles.formTitle}>Add New Activity</h3>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Market *</label>
              <select value={formData.market} onChange={(e) => setFormData({ ...formData, market: e.target.value })} style={styles.select}>
                <option value="">Select Market</option>
                {markets.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Business Unit *</label>
              <input type="text" value={formData.businessUnit} onChange={(e) => setFormData({ ...formData, businessUnit: e.target.value })} style={styles.input} placeholder="e.g., CIB, RBB" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Campaign *</label>
              <input type="text" value={formData.campaign} onChange={(e) => setFormData({ ...formData, campaign: e.target.value })} style={styles.input} placeholder="Campaign name" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Medium *</label>
              <select value={formData.medium} onChange={(e) => setFormData({ ...formData, medium: e.target.value })} style={styles.select}>
                <option value="">Select Medium</option>
                {mediums.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div style={styles.monthlyGrid}>
            <label style={styles.monthlyLabel}>Monthly Spend (Local Currency)</label>
            <div style={styles.monthsContainer}>
              {MONTHS.map(month => (
                <div key={month} style={styles.monthInput}>
                  <label style={styles.monthLabel}>{month}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthlySpend[month] || ''}
                    onChange={(e) => handleMonthChange(month, e.target.value)}
                    style={styles.input}
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
            <div style={styles.totalsRow}>
              <strong>Total (Local): </strong>{calculateTotalSpend(formData.monthlySpend).toFixed(2)}
              {formData.market && <span style={styles.zarTotal}> | Total (ZAR): R {convertToZAR(calculateTotalSpend(formData.monthlySpend), formData.market).toFixed(2)}</span>}
            </div>
          </div>
          <div style={styles.formActions}>
            <button onClick={handleAdd} style={styles.saveButton}>SAVE ACTIVITY</button>
            <button onClick={() => { setShowAddForm(false); setFormData({ market: '', businessUnit: '', campaign: '', medium: '', monthlySpend: {} }); }} style={styles.cancelButton}>CANCEL</button>
          </div>
        </div>
      )}

      {/* Activity Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Market</th>
              <th style={styles.th}>Business Unit</th>
              <th style={styles.th}>Campaign</th>
              <th style={styles.th}>Medium</th>
              <th style={styles.th}>Total (Local)</th>
              <th style={styles.th}>Total (ZAR)</th>
              <th style={styles.th}>Conv. Rate</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.map(activity => (
              <tr key={activity.id} style={styles.tableRow}>
                <td style={styles.td}>{activity.market}</td>
                <td style={styles.td}>{activity.businessUnit}</td>
                <td style={styles.td}>{activity.campaign}</td>
                <td style={styles.td}>{activity.medium}</td>
                <td style={styles.td}>{(activity.totalSpendLocal || 0).toFixed(2)}</td>
                <td style={styles.td}>R {(activity.totalSpendZAR || 0).toFixed(2)}</td>
                <td style={styles.td}>{(activity.conversionRate || 1).toFixed(3)}</td>
                <td style={styles.td}>
                  <button onClick={() => handleEdit(activity)} style={styles.editButton}>EDIT</button>
                  <button onClick={() => handleDelete(activity.id, activity.campaign)} style={styles.deleteButton}>DELETE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredActivities.length === 0 && (
          <div style={styles.emptyState}>No activities found. Add one to get started.</div>
        )}
      </div>

      {/* Edit Modal - Similar to add form but for editing */}
      {editingId && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.formTitle}>Edit Activity</h3>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Market *</label>
                <select value={formData.market} onChange={(e) => setFormData({ ...formData, market: e.target.value })} style={styles.select}>
                  <option value="">Select Market</option>
                  {markets.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Business Unit *</label>
                <input type="text" value={formData.businessUnit} onChange={(e) => setFormData({ ...formData, businessUnit: e.target.value })} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Campaign *</label>
                <input type="text" value={formData.campaign} onChange={(e) => setFormData({ ...formData, campaign: e.target.value })} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Medium *</label>
                <select value={formData.medium} onChange={(e) => setFormData({ ...formData, medium: e.target.value })} style={styles.select}>
                  <option value="">Select Medium</option>
                  {mediums.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.monthlyGrid}>
              <label style={styles.monthlyLabel}>Monthly Spend (Local Currency)</label>
              <div style={styles.monthsContainer}>
                {MONTHS.map(month => (
                  <div key={month} style={styles.monthInput}>
                    <label style={styles.monthLabel}>{month}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.monthlySpend[month] || ''}
                      onChange={(e) => handleMonthChange(month, e.target.value)}
                      style={styles.input}
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
              <div style={styles.totalsRow}>
                <strong>Total (Local): </strong>{calculateTotalSpend(formData.monthlySpend).toFixed(2)}
                {formData.market && <span style={styles.zarTotal}> | Total (ZAR): R {convertToZAR(calculateTotalSpend(formData.monthlySpend), formData.market).toFixed(2)}</span>}
              </div>
            </div>
            <div style={styles.formActions}>
              <button onClick={() => handleUpdate(editingId)} style={styles.saveButton}>UPDATE ACTIVITY</button>
              <button onClick={() => { setEditingId(null); setFormData({ market: '', businessUnit: '', campaign: '', medium: '', monthlySpend: {} }); }} style={styles.cancelButton}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '2rem', backgroundColor: '#FFFFFF', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { fontSize: '28px', fontWeight: '700', margin: 0, color: '#000000' },
  addButton: { padding: '0.75rem 1.5rem', backgroundColor: '#000000', color: '#FFFFFF', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },

  statsContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  statCard: { backgroundColor: '#000000', color: '#FFFFFF', padding: '1.5rem', borderRadius: '2px' },
  statLabel: { fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.8 },
  statValue: { fontSize: '32px', fontWeight: '700' },

  filtersContainer: { display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' },
  filterGroup: { display: 'flex', flexDirection: 'column', minWidth: '200px' },
  filterLabel: { fontSize: '11px', fontWeight: '600', color: '#666666', marginBottom: '0.5rem', textTransform: 'uppercase' },
  filterSelect: { padding: '0.75rem', border: '1px solid #EEEEEE', borderRadius: '2px', fontSize: '14px', fontFamily: 'Montserrat, sans-serif' },
  clearFiltersButton: { padding: '0.75rem 1rem', backgroundColor: '#FFFFFF', color: '#666666', border: '1px solid #EEEEEE', borderRadius: '2px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' },

  formContainer: { backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', padding: '2rem', marginBottom: '2rem', borderRadius: '2px' },
  formTitle: { fontSize: '20px', fontWeight: '600', marginBottom: '1.5rem', color: '#000000' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  formGroup: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '11px', fontWeight: '600', color: '#333333', marginBottom: '0.5rem', textTransform: 'uppercase' },
  input: { padding: '0.75rem', border: '1px solid #EEEEEE', borderRadius: '2px', fontSize: '14px', fontFamily: 'Montserrat, sans-serif' },
  select: { padding: '0.75rem', border: '1px solid #EEEEEE', borderRadius: '2px', fontSize: '14px', fontFamily: 'Montserrat, sans-serif', backgroundColor: '#FFFFFF' },

  monthlyGrid: { marginBottom: '1.5rem' },
  monthlyLabel: { fontSize: '11px', fontWeight: '600', color: '#333333', marginBottom: '1rem', textTransform: 'uppercase', display: 'block' },
  monthsContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  monthInput: { display: 'flex', flexDirection: 'column' },
  monthLabel: { fontSize: '11px', fontWeight: '600', color: '#666666', marginBottom: '0.5rem' },
  totalsRow: { padding: '1rem', backgroundColor: '#EEEEEE', borderRadius: '2px', fontSize: '14px', fontWeight: '600' },
  zarTotal: { color: '#000000', marginLeft: '1rem' },

  formActions: { display: 'flex', gap: '1rem' },
  saveButton: { padding: '0.75rem 1.5rem', backgroundColor: '#000000', color: '#FFFFFF', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  cancelButton: { padding: '0.75rem 1.5rem', backgroundColor: '#FFFFFF', color: '#000000', border: '1px solid #000000', borderRadius: '2px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },

  tableContainer: { backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', borderRadius: '2px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#000000', color: '#FFFFFF' },
  th: { padding: '1rem', textAlign: 'left', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', borderBottom: '2px solid #000000' },
  tableRow: { borderBottom: '1px solid #EEEEEE' },
  td: { padding: '1rem', fontSize: '14px' },
  editButton: { padding: '0.5rem 1rem', backgroundColor: '#FFFFFF', color: '#000000', border: '1px solid #EEEEEE', borderRadius: '2px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', marginRight: '0.5rem' },
  deleteButton: { padding: '0.5rem 1rem', backgroundColor: '#FFFFFF', color: '#666666', border: '1px solid #EEEEEE', borderRadius: '2px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' },

  emptyState: { textAlign: 'center', padding: '3rem', color: '#666666', fontSize: '14px' },
  loading: { textAlign: 'center', padding: '3rem', fontSize: '14px', color: '#666666' },
  errorMessage: { backgroundColor: '#FEE', border: '1px solid #FCC', padding: '1rem', marginBottom: '1.5rem', borderRadius: '2px', color: '#C00', fontSize: '14px' },
  successMessage: { backgroundColor: '#EFE', border: '1px solid #CFC', padding: '1rem', marginBottom: '1.5rem', borderRadius: '2px', color: '#060', fontSize: '14px' },

  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem', overflow: 'auto' },
  modalContent: { backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '2px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }
};

export default ActivityPlan;
