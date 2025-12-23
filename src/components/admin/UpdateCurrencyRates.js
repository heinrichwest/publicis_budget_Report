import React, { useState } from 'react';
import { updateCurrencyRates } from '../../utils/updateCurrencyRates';

const UpdateCurrencyRates = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setResult(null);

    const updateResult = await updateCurrencyRates();
    setResult(updateResult);
    setIsUpdating(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Update Currency Conversion Rates</h2>
      <p style={styles.description}>
        This will update all currency conversion rates to the correct values from the spreadsheet.
      </p>

      <div style={styles.rates}>
        <h3 style={styles.ratesTitle}>New Rates:</h3>
        <ul style={styles.ratesList}>
          <li>Botswana: 1.32</li>
          <li>Ghana: 1.68</li>
          <li>Hub: 1</li>
          <li>Kenya: 0.14</li>
          <li>Mauritius: 0.39</li>
          <li>Mozambique: 0.28</li>
          <li>Seychelles: 1.2107</li>
          <li>Tanzania: 0.007</li>
          <li>Uganda: 0.005</li>
          <li>Zambia: 0.76</li>
        </ul>
      </div>

      <button
        onClick={handleUpdate}
        disabled={isUpdating}
        style={{
          ...styles.button,
          ...(isUpdating ? styles.buttonDisabled : {})
        }}
      >
        {isUpdating ? 'Updating...' : 'Update Currency Rates'}
      </button>

      {result && (
        <div style={result.success ? styles.success : styles.error}>
          {result.success ? (
            <>
              <h3>✓ Update Complete</h3>
              <p>Updated: {result.results.updated.length} markets</p>
              <p>Created: {result.results.created.length} markets</p>
              {result.results.failed.length > 0 && (
                <p>Failed: {result.results.failed.length} markets</p>
              )}
            </>
          ) : (
            <>
              <h3>✗ Update Failed</h3>
              <p>{result.message}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '800px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#000000',
    marginBottom: '1rem'
  },
  description: {
    fontSize: '14px',
    color: '#666666',
    marginBottom: '2rem'
  },
  rates: {
    backgroundColor: '#F5F5F5',
    padding: '1.5rem',
    borderRadius: '4px',
    marginBottom: '2rem'
  },
  ratesTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '1rem'
  },
  ratesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem',
    fontSize: '14px'
  },
  button: {
    padding: '0.75rem 2rem',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: "'Montserrat', sans-serif"
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    cursor: 'not-allowed'
  },
  success: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#E8F5E9',
    border: '1px solid #4CAF50',
    borderRadius: '4px'
  },
  error: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#FFEBEE',
    border: '1px solid #F44336',
    borderRadius: '4px'
  }
};

export default UpdateCurrencyRates;
