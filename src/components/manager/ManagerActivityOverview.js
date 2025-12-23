import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getCurrencySymbol } from '../../utils/currencyMap';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ManagerActivityOverview = () => {
  const [activities, setActivities] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [currencyRates, setCurrencyRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reportingMonth, setReportingMonth] = useState('Dec');

  // Filter state
  const [filters, setFilters] = useState({
    market: '',
    businessUnit: '',
    campaign: '',
    medium: ''
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

      // Load currency rates
      const ratesSnapshot = await getDocs(collection(db, 'currencyRates'));
      const ratesMap = {};
      ratesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        ratesMap[data.market] = data.rate;
      });
      setCurrencyRates(ratesMap);

      // Load mediums
      const mediumsSnapshot = await getDocs(collection(db, 'mediums'));
      const mediumsList = mediumsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMediums(mediumsList);

      // Load activities - all markets for managers
      const activitiesSnapshot = await getDocs(collection(db, 'activityPlan'));
      const activitiesList = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(activitiesList);

      // Extract unique business units and campaigns
      const uniqueBusinessUnits = [...new Set(activitiesList.map(a => a.businessUnit).filter(Boolean))].sort();
      const uniqueCampaigns = [...new Set(activitiesList.map(a => a.campaign).filter(Boolean))].sort();
      setBusinessUnits(uniqueBusinessUnits);
      setCampaigns(uniqueCampaigns);

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

  const formatRate = (rate) => {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(rate || 1);
  };

  const calculateRowTotal = (monthlySpend) => {
    return Object.values(monthlySpend || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const convertToZAR = (localAmount, market) => {
    const rate = currencyRates[market] || 1;
    return localAmount * rate;
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

  const calculateColumnTotal = (month) => {
    return filteredActivities.reduce((sum, activity) => {
      return sum + (parseFloat(activity.monthlySpend?.[month]) || 0);
    }, 0);
  };

  const calculateGrandTotal = () => {
    return filteredActivities.reduce((sum, activity) => {
      return sum + calculateRowTotal(activity.monthlySpend);
    }, 0);
  };

  const getFilteredActivities = () => {
    return activities.filter(activity => {
      if (filters.market && activity.market !== filters.market) return false;
      if (filters.businessUnit && activity.businessUnit !== filters.businessUnit) return false;
      if (filters.campaign && activity.campaign !== filters.campaign) return false;
      if (filters.medium && activity.medium !== filters.medium) return false;
      return true;
    });
  };

  const filteredActivities = getFilteredActivities();

  const getStatistics = () => {
    const filtered = filteredActivities;

    // Business Unit stats
    const businessUnitTotals = {};
    filtered.forEach(activity => {
      const bu = activity.businessUnit || 'Unknown';
      const totalZAR = convertToZAR(calculateRowTotal(activity.monthlySpend), activity.market);
      if (!businessUnitTotals[bu]) businessUnitTotals[bu] = 0;
      businessUnitTotals[bu] += totalZAR;
    });

    // Campaign stats (top 10)
    const campaignTotals = {};
    filtered.forEach(activity => {
      const campaign = activity.campaign || 'Unknown';
      const totalZAR = convertToZAR(calculateRowTotal(activity.monthlySpend), activity.market);
      if (!campaignTotals[campaign]) campaignTotals[campaign] = 0;
      campaignTotals[campaign] += totalZAR;
    });

    // Medium stats
    const mediumTotals = {};
    filtered.forEach(activity => {
      const medium = activity.medium || 'Unknown';
      const totalZAR = convertToZAR(calculateRowTotal(activity.monthlySpend), activity.market);
      if (!mediumTotals[medium]) mediumTotals[medium] = 0;
      mediumTotals[medium] += totalZAR;
    });

    return {
      businessUnit: Object.entries(businessUnitTotals).sort((a, b) => b[1] - a[1]),
      campaign: Object.entries(campaignTotals).sort((a, b) => b[1] - a[1]).slice(0, 10),
      medium: Object.entries(mediumTotals).sort((a, b) => b[1] - a[1])
    };
  };

  const statistics = getStatistics();

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Compact Header */}
      <div style={styles.compactHeader}>
        <h2 style={styles.marketTitle}>All Markets</h2>
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
          {/* Filters */}
          <div style={styles.filtersBar}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Market</label>
              <select
                value={filters.market}
                onChange={(e) => setFilters({ ...filters, market: e.target.value })}
                style={styles.filterSelect}
              >
                <option value="">All Markets</option>
                {markets.map(market => (
                  <option key={market.id} value={market.name}>{market.name}</option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Business Unit</label>
              <select
                value={filters.businessUnit}
                onChange={(e) => setFilters({ ...filters, businessUnit: e.target.value })}
                style={styles.filterSelect}
              >
                <option value="">All Units</option>
                {businessUnits.map(bu => (
                  <option key={bu} value={bu}>{bu}</option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Campaign</label>
              <select
                value={filters.campaign}
                onChange={(e) => setFilters({ ...filters, campaign: e.target.value })}
                style={styles.filterSelect}
              >
                <option value="">All Campaigns</option>
                {campaigns.map(campaign => (
                  <option key={campaign} value={campaign}>{campaign}</option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Medium</label>
              <select
                value={filters.medium}
                onChange={(e) => setFilters({ ...filters, medium: e.target.value })}
                style={styles.filterSelect}
              >
                <option value="">All Mediums</option>
                {mediums.map(medium => (
                  <option key={medium.id} value={medium.name}>{medium.name}</option>
                ))}
              </select>
            </div>
            {(filters.market || filters.businessUnit || filters.campaign || filters.medium) && (
              <button
                onClick={() => setFilters({ market: '', businessUnit: '', campaign: '', medium: '' })}
                style={styles.clearButton}
              >
                CLEAR FILTERS
              </button>
            )}
          </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{...styles.thFixed, left: 0, width: '100px', minWidth: '100px', maxWidth: '100px'}}>Market</th>
              <th style={{...styles.thFixed, left: '100px', width: '80px', minWidth: '80px', maxWidth: '80px', whiteSpace: 'normal', lineHeight: '1.2'}}>Business Unit</th>
              <th style={{...styles.thFixed, left: '180px', width: '160px', minWidth: '160px', maxWidth: '160px'}}>Campaign</th>
              <th style={{...styles.thFixed, left: '340px', width: '120px', minWidth: '120px', maxWidth: '120px'}}>Medium</th>
              <th style={{...styles.thTotal, left: '460px', width: '130px', minWidth: '130px', maxWidth: '130px'}}>Total (ZAR)</th>
              <th style={{...styles.thTotal, left: '590px', width: '130px', minWidth: '130px', maxWidth: '130px'}}>Total (Local)</th>
              <th style={{...styles.thTotal, left: '720px', width: '130px', minWidth: '130px', maxWidth: '130px'}}>YTD (ZAR)</th>
              <th style={{...styles.thTotal, left: '850px', width: '130px', minWidth: '130px', maxWidth: '130px'}}>YTD (Local)</th>
              {MONTHS.map(month => (
                <th key={month} style={styles.th}>{month}</th>
              ))}
            </tr>
          </thead>
            <tbody>
              {filteredActivities.map(activity => {
                const totalLocal = calculateRowTotal(activity.monthlySpend);
                const totalZAR = convertToZAR(totalLocal, activity.market);
                const currencySymbol = getCurrencySymbol(activity.market);

                return (
                  <tr key={activity.id} style={styles.tr}>
                    <td style={{...styles.tdFixed, left: 0, width: '100px', minWidth: '100px', maxWidth: '100px'}}>{activity.market}</td>
                    <td style={{...styles.tdFixed, ...styles.tdBusinessUnit, left: '100px', width: '80px', minWidth: '80px', maxWidth: '80px'}}>
                      {activity.businessUnit}
                    </td>
                    <td style={{...styles.tdFixed, ...styles.tdSmallText, left: '180px', width: '160px', minWidth: '160px', maxWidth: '160px'}}>
                      {activity.campaign}
                    </td>
                    <td style={{...styles.tdFixed, ...styles.tdSmallText, left: '340px', width: '120px', minWidth: '120px', maxWidth: '120px'}}>
                      {activity.medium}
                    </td>
                    <td style={{...styles.tdTotalCell, left: '460px', width: '130px', minWidth: '130px', maxWidth: '130px'}}>{formatNumber(totalZAR)}</td>
                    <td style={{...styles.tdTotalCell, left: '590px', width: '130px', minWidth: '130px', maxWidth: '130px'}}>{formatNumber(totalLocal)}</td>
                    <td style={{...styles.tdTotalCell, left: '720px', width: '130px', minWidth: '130px', maxWidth: '130px'}}>{formatNumber(convertToZAR(calculateYTD(activity.monthlySpend, reportingMonth), activity.market))}</td>
                    <td style={{...styles.tdTotalCell, left: '850px', width: '130px', minWidth: '130px', maxWidth: '130px'}}>{formatNumber(calculateYTD(activity.monthlySpend, reportingMonth))}</td>
                    {MONTHS.map(month => {
                      const value = activity.monthlySpend?.[month] || 0;

                      return (
                        <td key={month} style={styles.td}>
                          <span style={value > 0 ? styles.cellValue : styles.cellEmpty}>
                            {value > 0 ? formatNumber(value) : '-'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr style={styles.totalRow}>
                <td style={{...styles.totalLabel, left: 0, width: '100px', minWidth: '100px', maxWidth: '100px'}}>TOTAL</td>
                <td style={{...styles.totalLabel, left: '100px', width: '80px', minWidth: '80px', maxWidth: '80px'}}></td>
                <td style={{...styles.totalLabel, left: '180px', width: '160px', minWidth: '160px', maxWidth: '160px'}}></td>
                <td style={{...styles.totalLabel, left: '340px', width: '120px', minWidth: '120px', maxWidth: '120px'}}></td>
                <td style={{...styles.grandTotal, left: '460px', width: '130px', minWidth: '130px', maxWidth: '130px'}}>{formatNumber(filteredActivities.reduce((sum, a) => sum + convertToZAR(calculateRowTotal(a.monthlySpend), a.market), 0))}</td>
                <td style={{...styles.grandTotal, left: '590px', width: '130px', minWidth: '130px', maxWidth: '130px'}}>{formatNumber(calculateGrandTotal())}</td>
                <td style={{...styles.grandTotal, left: '720px', width: '130px', minWidth: '130px', maxWidth: '130px'}}></td>
                <td style={{...styles.grandTotal, left: '850px', width: '130px', minWidth: '130px', maxWidth: '130px'}}></td>
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
            <p><strong>Note:</strong> Manager view is read-only. You cannot edit or delete activities.</p>
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
    backgroundColor: '#FEE',
    color: '#C00',
    padding: '1rem 2rem',
    margin: '0',
    fontSize: '14px',
    borderBottom: '1px solid #FCC'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '1.5rem',
    padding: '2rem',
    overflowY: 'auto',
    flex: 1
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    border: '2px solid #000000',
    borderRadius: '2px',
    padding: '1.5rem'
  },
  statTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#000000',
    marginBottom: '1rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  barChartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  barLabel: {
    minWidth: '120px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#000000',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  barWrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: '2px',
    position: 'relative',
    height: '24px',
    minWidth: 0
  },
  bar: {
    backgroundColor: '#000000',
    height: '100%',
    borderRadius: '2px',
    minWidth: '2px'
  },
  barValue: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '10px',
    fontWeight: '700',
    color: '#FFFFFF',
    textShadow: '0 0 2px rgba(0,0,0,0.5)'
  },
  filtersBar: {
    display: 'flex',
    gap: '1rem',
    padding: '1.5rem 2rem',
    backgroundColor: '#F9F9F9',
    borderBottom: '1px solid #EEEEEE',
    flexWrap: 'wrap',
    alignItems: 'flex-end'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  filterLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#666666',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  filterSelect: {
    padding: '0.5rem',
    fontSize: '13px',
    fontWeight: '500',
    border: '1px solid #CCCCCC',
    borderRadius: '2px',
    backgroundColor: '#FFFFFF',
    minWidth: '150px',
    outline: 'none'
  },
  clearButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#666666',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    height: 'fit-content'
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
    zIndex: 3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  thTotal: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#333333',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    textAlign: 'left',
    padding: '0.75rem 0.5rem',
    borderRight: '1px solid #555555',
    zIndex: 3,
    whiteSpace: 'nowrap'
  },
  th: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#F5F5F5',
    color: '#000000',
    fontWeight: '700',
    fontSize: '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    textAlign: 'center',
    padding: '0.75rem 0.5rem',
    borderRight: '1px solid #EEEEEE',
    borderBottom: '2px solid #DDDDDD',
    minWidth: '110px',
    width: '110px',
    maxWidth: '110px',
    zIndex: 2
  },
  tr: {
    borderBottom: '1px solid #EEEEEE'
  },
  tdFixed: {
    position: 'sticky',
    backgroundColor: '#FFFFFF',
    padding: '0.5rem',
    borderRight: '1px solid #EEEEEE',
    borderBottom: '1px solid #EEEEEE',
    fontSize: '12px',
    zIndex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  tdBusinessUnit: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  tdSmallText: {
    fontSize: '11px'
  },
  tdTotalCell: {
    position: 'sticky',
    backgroundColor: '#F9F9F9',
    padding: '0.5rem',
    borderRight: '1px solid #EEEEEE',
    borderBottom: '1px solid #EEEEEE',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'right',
    zIndex: 1
  },
  td: {
    padding: '0.5rem',
    textAlign: 'right',
    borderRight: '1px solid #EEEEEE',
    borderBottom: '1px solid #EEEEEE',
    minWidth: '110px',
    width: '110px',
    maxWidth: '110px',
    fontSize: '12px'
  },
  cellValue: {
    color: '#000000',
    fontWeight: '500'
  },
  cellEmpty: {
    color: '#CCCCCC',
    fontWeight: '400'
  },
  totalRow: {
    position: 'sticky',
    bottom: 0,
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontWeight: '700',
    zIndex: 2
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
  grandTotal: {
    position: 'sticky',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    padding: '0.75rem 0.5rem',
    fontSize: '11px',
    fontWeight: '700',
    textAlign: 'right',
    borderRight: '1px solid #333333',
    zIndex: 3
  },
  totalCell: {
    padding: '0.75rem 0.5rem',
    textAlign: 'right',
    fontSize: '11px',
    fontWeight: '700',
    borderRight: '1px solid #333333',
    minWidth: '110px',
    width: '110px',
    maxWidth: '110px'
  },
  instructions: {
    padding: '1rem 2rem',
    backgroundColor: '#F9F9F9',
    borderTop: '1px solid #EEEEEE',
    fontSize: '12px',
    color: '#666666'
  }
};

export default ManagerActivityOverview;
