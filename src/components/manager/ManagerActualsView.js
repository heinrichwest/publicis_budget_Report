import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
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

const ManagerActualsView = () => {
  const [actuals, setActuals] = useState([]);
  const [markets, setMarkets] = useState([]);
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

  const calculateRowTotal = (monthlyActuals, market) => {
    return MONTHS.reduce((sum, month) => {
      const monthData = monthlyActuals?.[month] || { rateCard: 0, discount: 0, addedValue: 0 };
      const rateCard = convertToZAR(parseFloat(monthData.rateCard) || 0, market);
      const discount = convertToZAR(parseFloat(monthData.discount) || 0, market);
      const addedValue = convertToZAR(parseFloat(monthData.addedValue) || 0, market);
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
    return filteredActuals.reduce((sum, actual) => {
      const monthData = actual.monthlyActuals?.[month] || { rateCard: 0, discount: 0, addedValue: 0 };

      if (field === 'nett') {
        const rateCard = convertToZAR(parseFloat(monthData.rateCard) || 0, actual.market);
        const discount = convertToZAR(parseFloat(monthData.discount) || 0, actual.market);
        return sum + (rateCard - discount);
      }

      const value = parseFloat(monthData[field]) || 0;
      return sum + convertToZAR(value, actual.market);
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
            {FIXED_MEDIUMS.map(medium => (
              <option key={medium} value={medium}>{medium}</option>
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
            {/* Main header row */}
            <tr>
              <th style={{ ...styles.thFixed, left: 0, width: '120px' }} rowSpan="2">Market</th>
              <th style={{ ...styles.thFixed, left: '120px', width: '150px' }} rowSpan="2">Medium</th>
              <th style={styles.thTotal} colSpan="6">TOTAL (ZAR)</th>
              {MONTHS.map((month, index) => (
                <th key={month} style={{...styles.th, borderRight: index === 11 ? '1px solid #555555' : '2px solid #000000'}} colSpan="6">{month} (ZAR)</th>
              ))}
            </tr>
            {/* Sub-header row */}
            <tr>
              {/* Total columns */}
              <th style={styles.thSub}>Rate Card</th>
              <th style={styles.thSub}>Discount</th>
              <th style={styles.thSub}>Disc %</th>
              <th style={styles.thSub}>Nett</th>
              <th style={styles.thSub}>Added Value</th>
              <th style={{...styles.thSub, borderRight: '2px solid #DDDDDD'}}>AV %</th>

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
            {/* Total Row */}
            <tr style={styles.totalRow}>
              <td style={{ ...styles.totalLabel, left: 0, width: '120px' }}>TOTAL</td>
              <td style={{ ...styles.totalLabel, left: '120px', width: '150px' }}></td>

              {/* Grand totals */}
              {(() => {
                const grandTotals = filteredActuals.reduce((sum, actual) => {
                  const rowTotals = calculateRowTotal(actual.monthlyActuals, actual.market);
                  return {
                    rateCard: sum.rateCard + rowTotals.rateCard,
                    discount: sum.discount + rowTotals.discount,
                    nett: sum.nett + rowTotals.nett,
                    addedValue: sum.addedValue + rowTotals.addedValue
                  };
                }, { rateCard: 0, discount: 0, nett: 0, addedValue: 0 });

                const grandDiscPerc = grandTotals.rateCard > 0 ? (grandTotals.discount / grandTotals.rateCard) * 100 : 0;
                const grandAVPerc = grandTotals.rateCard > 0 ? (grandTotals.addedValue / grandTotals.rateCard) * 100 : 0;

                return (
                  <>
                    <td style={styles.totalCell}>{formatNumber(grandTotals.rateCard)}</td>
                    <td style={styles.totalCell}>{formatNumber(grandTotals.discount)}</td>
                    <td style={styles.totalCell}>{grandDiscPerc.toFixed(2)}%</td>
                    <td style={styles.totalCell}>{formatNumber(grandTotals.nett)}</td>
                    <td style={styles.totalCell}>{formatNumber(grandTotals.addedValue)}</td>
                    <td style={{...styles.totalCell, borderRight: '2px solid #333333'}}>{grandAVPerc.toFixed(2)}%</td>
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

            {/* Data Rows */}
            {filteredActuals.map(actual => {
              const totals = calculateRowTotal(actual.monthlyActuals, actual.market);
              const totalDiscPerc = totals.rateCard > 0 ? (totals.discount / totals.rateCard) * 100 : 0;
              const totalAVPerc = totals.rateCard > 0 ? (totals.addedValue / totals.rateCard) * 100 : 0;

              return (
                <tr key={actual.id} style={styles.tr}>
                  <td style={{ ...styles.tdFixed, left: 0, width: '120px' }}>{actual.market}</td>
                  <td style={{ ...styles.tdFixed, left: '120px', width: '150px' }}>{actual.medium}</td>

                  {/* Total columns */}
                  <td style={styles.tdTotal}>{formatNumber(totals.rateCard)}</td>
                  <td style={styles.tdTotal}>{formatNumber(totals.discount)}</td>
                  <td style={styles.tdTotal}>{totalDiscPerc.toFixed(2)}%</td>
                  <td style={styles.tdTotal}>{formatNumber(totals.nett)}</td>
                  <td style={styles.tdTotal}>{formatNumber(totals.addedValue)}</td>
                  <td style={{...styles.tdTotal, borderRight: '2px solid #DDDDDD'}}>{totalAVPerc.toFixed(2)}%</td>

                  {/* Monthly columns */}
                  {MONTHS.map((month, monthIndex) => {
                    const monthData = actual.monthlyActuals?.[month] || { rateCard: 0, discount: 0, addedValue: 0 };
                    const rateCard = convertToZAR(parseFloat(monthData.rateCard) || 0, actual.market);
                    const discount = convertToZAR(parseFloat(monthData.discount) || 0, actual.market);
                    const addedValue = convertToZAR(parseFloat(monthData.addedValue) || 0, actual.market);
                    const nett = rateCard - discount;
                    const discPerc = rateCard > 0 ? (discount / rateCard) * 100 : 0;
                    const avPerc = rateCard > 0 ? (addedValue / rateCard) * 100 : 0;

                    return (
                      <React.Fragment key={month}>
                        <td style={styles.td}>{formatNumber(rateCard)}</td>
                        <td style={styles.td}>{formatNumber(discount)}</td>
                        <td style={styles.td}>{discPerc.toFixed(2)}%</td>
                        <td style={styles.td}>{formatNumber(nett)}</td>
                        <td style={styles.td}>{formatNumber(addedValue)}</td>
                        <td style={{...styles.td, borderRight: monthIndex === 11 ? '1px solid #EEEEEE' : '2px solid #DDDDDD'}}>{avPerc.toFixed(2)}%</td>
                      </React.Fragment>
                    );
                  })}
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
    zIndex: 4,
    whiteSpace: 'nowrap'
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
    minWidth: '90px'
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
