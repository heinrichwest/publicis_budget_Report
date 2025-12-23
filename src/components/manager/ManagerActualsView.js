import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getCurrencySymbol } from '../../utils/currencyMap';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ManagerActualsView = () => {
  const [actuals, setActuals] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [currencyRates, setCurrencyRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    market: '',
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

      // Load actuals - all markets for managers
      const actualsSnapshot = await getDocs(collection(db, 'actuals'));
      const actualsList = actualsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActuals(actualsList);

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

  const convertToZAR = (localAmount, market) => {
    const rate = currencyRates[market] || 1;
    return localAmount * rate;
  };

  const getFilteredActuals = () => {
    return actuals.filter(actual => {
      if (filters.market && actual.market !== filters.market) return false;
      if (filters.medium && actual.medium !== filters.medium) return false;
      return true;
    });
  };

  const filteredActuals = getFilteredActuals();

  const calculateMonthTotal = (month, field) => {
    return filteredActuals.reduce((sum, actual) => {
      const value = parseFloat(actual.monthlyActuals?.[month]?.[field]) || 0;
      const zarValue = convertToZAR(value, actual.market);
      return sum + zarValue;
    }, 0);
  };

  const calculateGrandTotal = (field) => {
    return filteredActuals.reduce((sum, actual) => {
      return sum + MONTHS.reduce((monthSum, month) => {
        const value = parseFloat(actual.monthlyActuals?.[month]?.[field]) || 0;
        const zarValue = convertToZAR(value, actual.market);
        return monthSum + zarValue;
      }, 0);
    }, 0);
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
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
        {(filters.market || filters.medium) && (
          <button
            onClick={() => setFilters({ market: '', medium: '' })}
            style={styles.clearButton}
          >
            CLEAR FILTERS
          </button>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Actuals Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.thFixed, left: 0, width: '120px', minWidth: '120px', maxWidth: '120px' }}>Market</th>
              <th style={{ ...styles.thFixed, left: '120px', width: '120px', minWidth: '120px', maxWidth: '120px' }}>Medium</th>
              {MONTHS.map(month => (
                <React.Fragment key={month}>
                  <th style={styles.th} colSpan="3">{month}</th>
                </React.Fragment>
              ))}
              <th style={{ ...styles.thTotal, width: '130px', minWidth: '130px', maxWidth: '130px' }}>Total Rate Card</th>
              <th style={{ ...styles.thTotal, width: '130px', minWidth: '130px', maxWidth: '130px' }}>Total Discount</th>
              <th style={{ ...styles.thTotal, width: '130px', minWidth: '130px', maxWidth: '130px' }}>Total Nett Nett</th>
            </tr>
            <tr>
              <th style={{ ...styles.thFixed, left: 0, width: '120px', minWidth: '120px', maxWidth: '120px' }}></th>
              <th style={{ ...styles.thFixed, left: '120px', width: '120px', minWidth: '120px', maxWidth: '120px' }}></th>
              {MONTHS.map(month => (
                <React.Fragment key={month}>
                  <th style={styles.thSub}>Rate Card</th>
                  <th style={styles.thSub}>Discount</th>
                  <th style={styles.thSub}>Nett Nett</th>
                </React.Fragment>
              ))}
              <th style={{ ...styles.thTotal, width: '130px', minWidth: '130px', maxWidth: '130px' }}>(ZAR)</th>
              <th style={{ ...styles.thTotal, width: '130px', minWidth: '130px', maxWidth: '130px' }}>(ZAR)</th>
              <th style={{ ...styles.thTotal, width: '130px', minWidth: '130px', maxWidth: '130px' }}>(ZAR)</th>
            </tr>
          </thead>
          <tbody>
            {/* Total Row */}
            <tr style={styles.totalRow}>
              <td style={{ ...styles.totalLabel, left: 0, width: '120px', minWidth: '120px', maxWidth: '120px' }}>TOTAL</td>
              <td style={{ ...styles.totalLabel, left: '120px', width: '120px', minWidth: '120px', maxWidth: '120px' }}></td>
              {MONTHS.map(month => (
                <React.Fragment key={month}>
                  <td style={styles.totalCell}>{formatNumber(calculateMonthTotal(month, 'rateCard'))}</td>
                  <td style={styles.totalCell}>{formatNumber(calculateMonthTotal(month, 'discount'))}</td>
                  <td style={styles.totalCell}>{formatNumber(calculateMonthTotal(month, 'nettNett'))}</td>
                </React.Fragment>
              ))}
              <td style={{ ...styles.grandTotal, width: '130px', minWidth: '130px', maxWidth: '130px' }}>{formatNumber(calculateGrandTotal('rateCard'))}</td>
              <td style={{ ...styles.grandTotal, width: '130px', minWidth: '130px', maxWidth: '130px' }}>{formatNumber(calculateGrandTotal('discount'))}</td>
              <td style={{ ...styles.grandTotal, width: '130px', minWidth: '130px', maxWidth: '130px' }}>{formatNumber(calculateGrandTotal('nettNett'))}</td>
            </tr>
            {filteredActuals.map(actual => {
              const currencySymbol = getCurrencySymbol(actual.market);

              // Calculate totals for this row
              const totalRateCard = MONTHS.reduce((sum, month) => {
                const value = parseFloat(actual.monthlyActuals?.[month]?.rateCard) || 0;
                return sum + value;
              }, 0);

              const totalDiscount = MONTHS.reduce((sum, month) => {
                const value = parseFloat(actual.monthlyActuals?.[month]?.discount) || 0;
                return sum + value;
              }, 0);

              const totalNettNett = MONTHS.reduce((sum, month) => {
                const value = parseFloat(actual.monthlyActuals?.[month]?.nettNett) || 0;
                return sum + value;
              }, 0);

              return (
                <tr key={actual.id} style={styles.tr}>
                  <td style={{ ...styles.tdFixed, left: 0, width: '120px', minWidth: '120px', maxWidth: '120px' }}>{actual.market}</td>
                  <td style={{ ...styles.tdFixed, left: '120px', width: '120px', minWidth: '120px', maxWidth: '120px' }}>{actual.medium}</td>
                  {MONTHS.map(month => {
                    const monthData = actual.monthlyActuals?.[month] || {};
                    return (
                      <React.Fragment key={month}>
                        <td style={styles.td}>
                          {monthData.rateCard ? formatNumber(monthData.rateCard) : '-'}
                        </td>
                        <td style={styles.td}>
                          {monthData.discount ? formatNumber(monthData.discount) : '-'}
                        </td>
                        <td style={styles.td}>
                          {monthData.nettNett ? formatNumber(monthData.nettNett) : '-'}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td style={{ ...styles.tdTotalCell, width: '130px', minWidth: '130px', maxWidth: '130px' }}>
                    {formatNumber(convertToZAR(totalRateCard, actual.market))}
                  </td>
                  <td style={{ ...styles.tdTotalCell, width: '130px', minWidth: '130px', maxWidth: '130px' }}>
                    {formatNumber(convertToZAR(totalDiscount, actual.market))}
                  </td>
                  <td style={{ ...styles.tdTotalCell, width: '130px', minWidth: '130px', maxWidth: '130px' }}>
                    {formatNumber(convertToZAR(totalNettNett, actual.market))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={styles.instructions}>
        <p><strong>Note:</strong> Manager view is read-only. All values are converted to ZAR for comparison.</p>
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
    whiteSpace: 'nowrap'
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
    borderRight: '1px solid #333333',
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
    fontWeight: '600',
    zIndex: 1,
    whiteSpace: 'nowrap'
  },
  tdTotalCell: {
    backgroundColor: '#F9F9F9',
    padding: '0.5rem',
    borderRight: '1px solid #EEEEEE',
    borderBottom: '1px solid #EEEEEE',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'right'
  },
  td: {
    padding: '0.5rem',
    textAlign: 'right',
    borderRight: '1px solid #EEEEEE',
    borderBottom: '1px solid #EEEEEE',
    minWidth: '100px',
    fontSize: '12px'
  },
  totalRow: {
    position: 'sticky',
    top: '5rem',
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
  totalCell: {
    padding: '0.75rem 0.5rem',
    textAlign: 'right',
    fontSize: '11px',
    fontWeight: '700',
    borderRight: '1px solid #333333',
    minWidth: '100px'
  },
  grandTotal: {
    backgroundColor: '#000000',
    color: '#FFFFFF',
    padding: '0.75rem 0.5rem',
    fontSize: '11px',
    fontWeight: '700',
    textAlign: 'right',
    borderRight: '1px solid #333333'
  },
  instructions: {
    padding: '1rem 2rem',
    backgroundColor: '#F9F9F9',
    borderTop: '1px solid #EEEEEE',
    fontSize: '12px',
    color: '#666666'
  }
};

export default ManagerActualsView;
