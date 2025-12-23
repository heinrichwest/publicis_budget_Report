import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { formatCurrencyWithSymbol } from '../../utils/currencyMap';

const ManagerActivityOverview = () => {
  const [activities, setActivities] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [currencyRates, setCurrencyRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('table');
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
      const marketsSnapshot = await getDocs(collection(db, 'markets'));
      const marketsList = marketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMarkets(marketsList);

      const mediumsSnapshot = await getDocs(collection(db, 'mediums'));
      const mediumsList = mediumsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMediums(mediumsList);

      const ratesSnapshot = await getDocs(collection(db, 'currencyRates'));
      const ratesMap = {};
      ratesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        ratesMap[data.market] = data.rate;
      });
      setCurrencyRates(ratesMap);

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
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatZAR = (amount) => {
    return `R ${formatNumber(amount)}`;
  };

  const calculateTotalSpend = (monthlySpend) => {
    return Object.values(monthlySpend || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const convertToZAR = (localAmount, market) => {
    const rate = currencyRates[market] || 1;
    return localAmount * rate;
  };

  const getLocalTotal = (activity) => {
    if (typeof activity.totalSpendLocal === 'number') {
      return activity.totalSpendLocal;
    }
    return calculateTotalSpend(activity.monthlySpend);
  };

  const getZarTotal = (activity) => {
    if (typeof activity.totalSpendZAR === 'number') {
      return activity.totalSpendZAR;
    }
    return convertToZAR(getLocalTotal(activity), activity.market);
  };

  const businessUnits = useMemo(() => {
    return [...new Set(activities.map(a => a.businessUnit).filter(Boolean))].sort();
  }, [activities]);

  const campaigns = useMemo(() => {
    return [...new Set(activities.map(a => a.campaign).filter(Boolean))].sort();
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      if (filters.market && activity.market !== filters.market) return false;
      if (filters.businessUnit && activity.businessUnit !== filters.businessUnit) return false;
      if (filters.campaign && activity.campaign !== filters.campaign) return false;
      if (filters.medium && activity.medium !== filters.medium) return false;
      return true;
    });
  }, [activities, filters]);

  const sortedActivities = useMemo(() => {
    return [...filteredActivities].sort((a, b) => {
      if (a.market !== b.market) return (a.market || '').localeCompare(b.market || '');
      return (a.campaign || '').localeCompare(b.campaign || '');
    });
  }, [filteredActivities]);

  const totals = useMemo(() => {
    const totalZAR = filteredActivities.reduce((sum, activity) => sum + getZarTotal(activity), 0);
    return {
      count: filteredActivities.length,
      totalZAR
    };
  }, [filteredActivities, currencyRates]);

  const marketStats = useMemo(() => {
    const stats = {};
    filteredActivities.forEach(activity => {
      const market = activity.market || 'Unknown';
      if (!stats[market]) {
        stats[market] = { market, count: 0, totalLocal: 0, totalZAR: 0 };
      }
      const localTotal = getLocalTotal(activity);
      const zarTotal = getZarTotal(activity);
      stats[market].count += 1;
      stats[market].totalLocal += localTotal;
      stats[market].totalZAR += zarTotal;
    });
    return Object.values(stats).sort((a, b) => b.totalZAR - a.totalZAR);
  }, [filteredActivities, currencyRates]);

  const maxMarketZAR = useMemo(() => {
    return marketStats.reduce((max, stat) => Math.max(max, stat.totalZAR), 0);
  }, [marketStats]);

  if (loading) {
    return <div style={styles.loading}>Loading Activity Plans...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Activity Plans - All Markets</h2>
          <p style={styles.subtitle}>Manager overview of all market submissions</p>
        </div>
        <div style={styles.viewToggle}>
          <button
            onClick={() => setActiveView('table')}
            style={activeView === 'table' ? styles.viewButtonActive : styles.viewButton}
          >
            TABLE VIEW
          </button>
          <button
            onClick={() => setActiveView('dashboard')}
            style={activeView === 'dashboard' ? styles.viewButtonActive : styles.viewButton}
          >
            DASHBOARD VIEW
          </button>
        </div>
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}

      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Activities</div>
          <div style={styles.statValue}>{totals.count}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Spend (ZAR)</div>
          <div style={styles.statValue}>{formatZAR(totals.totalZAR)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Average Spend (ZAR)</div>
          <div style={styles.statValue}>
            {formatZAR(totals.count ? totals.totalZAR / totals.count : 0)}
          </div>
        </div>
      </div>

      <div style={styles.filtersContainer}>
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
            {businessUnits.map(bu => <option key={bu} value={bu}>{bu}</option>)}
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
            {campaigns.map(campaign => <option key={campaign} value={campaign}>{campaign}</option>)}
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
            {mediums.map(medium => <option key={medium.id} value={medium.name}>{medium.name}</option>)}
          </select>
        </div>
        {(filters.market || filters.businessUnit || filters.campaign || filters.medium) && (
          <button
            onClick={() => setFilters({ market: '', businessUnit: '', campaign: '', medium: '' })}
            style={styles.clearFiltersButton}
          >
            CLEAR FILTERS
          </button>
        )}
      </div>

      {activeView === 'table' ? (
        <div style={styles.tableWrapper}>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.thSticky}>Market</th>
                  <th style={styles.thSticky}>Business Unit</th>
                  <th style={styles.thSticky}>Campaign</th>
                  <th style={styles.thSticky}>Medium</th>
                  <th style={styles.thSticky}>Total (Local)</th>
                  <th style={styles.thSticky}>Total (ZAR)</th>
                </tr>
              </thead>
              <tbody>
                {sortedActivities.map(activity => {
                  const localTotal = getLocalTotal(activity);
                  const zarTotal = getZarTotal(activity);
                  return (
                    <tr key={activity.id} style={styles.tableRow}>
                      <td style={styles.td}>{activity.market || '-'}</td>
                      <td style={styles.td}>{activity.businessUnit}</td>
                      <td style={styles.td}>{activity.campaign}</td>
                      <td style={styles.td}>{activity.medium}</td>
                      <td style={styles.td}>{formatCurrencyWithSymbol(localTotal, activity.market)}</td>
                      <td style={styles.td}>{formatZAR(zarTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={styles.totalRow}>
                  <td style={styles.totalLabel}>TOTAL</td>
                  <td style={styles.totalLabel}></td>
                  <td style={styles.totalLabel}></td>
                  <td style={styles.totalLabel}></td>
                  <td style={styles.totalLabel}>MIXED</td>
                  <td style={styles.totalValue}>{formatZAR(totals.totalZAR)}</td>
                </tr>
              </tfoot>
            </table>

            {sortedActivities.length === 0 && (
              <div style={styles.emptyState}>No activities found for the selected filters.</div>
            )}
          </div>
        </div>
      ) : (
        <div style={styles.dashboardGrid}>
          <div style={styles.marketSummaryCard}>
            <h3 style={styles.sectionTitle}>Market Summary (ZAR)</h3>
            <div style={styles.marketBars}>
              {marketStats.map(stat => {
                const percentage = maxMarketZAR ? (stat.totalZAR / maxMarketZAR) * 100 : 0;
                return (
                  <div key={stat.market} style={styles.barRow}>
                    <div style={styles.barLabel}>{stat.market}</div>
                    <div style={styles.barWrapper}>
                      <div style={{ ...styles.bar, width: `${percentage}%` }}></div>
                      <div style={styles.barValue}>{formatZAR(stat.totalZAR)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={styles.marketTableCard}>
            <h3 style={styles.sectionTitle}>Market Totals</h3>
            <div style={styles.marketTableWrapper}>
              <table style={styles.marketTable}>
                <thead>
                  <tr>
                    <th style={styles.marketTh}>Market</th>
                    <th style={styles.marketTh}>Activities</th>
                    <th style={styles.marketTh}>Total (Local)</th>
                    <th style={styles.marketTh}>Total (ZAR)</th>
                  </tr>
                </thead>
                <tbody>
                  {marketStats.map(stat => (
                    <tr key={stat.market} style={styles.marketTr}>
                      <td style={styles.marketTd}>{stat.market}</td>
                      <td style={styles.marketTd}>{stat.count}</td>
                      <td style={styles.marketTd}>{formatCurrencyWithSymbol(stat.totalLocal, stat.market)}</td>
                      <td style={styles.marketTd}>{formatZAR(stat.totalZAR)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {marketStats.length === 0 && (
                <div style={styles.emptyState}>No activities found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '0',
    backgroundColor: '#FFFFFF',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '2rem',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: 0,
    color: '#000000'
  },
  subtitle: {
    margin: '0.5rem 0 0 0',
    fontSize: '13px',
    color: '#666666'
  },
  viewToggle: {
    display: 'flex',
    gap: '0.5rem'
  },
  viewButton: {
    padding: '0.6rem 1.25rem',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    border: '1px solid #CCCCCC',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.5px'
  },
  viewButtonActive: {
    padding: '0.6rem 1.25rem',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    border: '1px solid #000000',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.5px'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2rem'
  },
  statCard: {
    backgroundColor: '#000000',
    color: '#FFFFFF',
    padding: '1.25rem',
    borderRadius: '2px'
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: '0.5rem',
    opacity: 0.8
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700'
  },
  filtersContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    alignItems: 'flex-end'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '200px'
  },
  filterLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#666666',
    marginBottom: '0.5rem',
    textTransform: 'uppercase'
  },
  filterSelect: {
    padding: '0.75rem',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    fontSize: '14px',
    fontFamily: 'Montserrat, sans-serif'
  },
  clearFiltersButton: {
    padding: '0.75rem 1rem',
    backgroundColor: '#FFFFFF',
    color: '#666666',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600'
  },
  tableWrapper: {
    paddingBottom: '2rem'
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    backgroundColor: '#000000',
    color: '#FFFFFF'
  },
  thSticky: {
    padding: '1rem',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    borderBottom: '2px solid #000000'
  },
  tableRow: {
    borderBottom: '1px solid #EEEEEE'
  },
  td: {
    padding: '1rem',
    fontSize: '14px',
    verticalAlign: 'middle'
  },
  totalRow: {
    backgroundColor: '#000000',
    color: '#FFFFFF'
  },
  totalLabel: {
    padding: '0.9rem 1rem',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  totalValue: {
    padding: '0.9rem 1rem',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '700'
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    paddingBottom: '2rem'
  },
  marketSummaryCard: {
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    padding: '1.5rem',
    backgroundColor: '#FFFFFF'
  },
  marketTableCard: {
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    padding: '1.5rem',
    backgroundColor: '#FFFFFF'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#000000'
  },
  marketBars: {
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
    minWidth: '90px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#000000'
  },
  barWrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: '999px',
    position: 'relative',
    height: '22px'
  },
  bar: {
    backgroundColor: '#000000',
    height: '100%',
    borderRadius: '999px'
  },
  barValue: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '11px',
    fontWeight: '600',
    color: '#FFFFFF'
  },
  marketTableWrapper: {
    overflowX: 'auto'
  },
  marketTable: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  marketTh: {
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    padding: '0.75rem 0',
    borderBottom: '1px solid #EEEEEE'
  },
  marketTr: {
    borderBottom: '1px solid #F0F0F0'
  },
  marketTd: {
    padding: '0.75rem 0',
    fontSize: '13px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666666',
    fontSize: '14px'
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
  }
};

export default ManagerActivityOverview;
