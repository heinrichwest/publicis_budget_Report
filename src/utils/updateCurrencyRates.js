import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Correct currency conversion rates from the spreadsheet
const CORRECT_RATES = {
  'Botswana': 1.32,
  'Ghana': 1.68,
  'Hub': 1,
  'Kenya': 0.14,
  'Mauritius': 0.39,
  'Mozambique': 0.28,
  'Seychelles': 1.2107,
  'Tanzania': 0.007,
  'Uganda': 0.005,
  'Zambia': 0.76
};

export const updateCurrencyRates = async () => {
  try {
    console.log('Starting currency rate update...');
    const results = {
      updated: [],
      created: [],
      failed: []
    };

    // Get all existing currency rates
    const snapshot = await getDocs(collection(db, 'currencyRates'));
    const existingRates = {};

    snapshot.forEach(doc => {
      existingRates[doc.data().market] = doc.id;
    });

    // Update or create each rate
    for (const [market, rate] of Object.entries(CORRECT_RATES)) {
      try {
        const rateData = {
          market: market,
          rate: rate,
          updatedAt: new Date().toISOString()
        };

        if (existingRates[market]) {
          // Update existing rate
          await updateDoc(doc(db, 'currencyRates', existingRates[market]), rateData);
          results.updated.push(`${market}: ${rate}`);
          console.log(`✓ Updated ${market}: ${rate}`);
        } else {
          // Create new rate
          await setDoc(doc(collection(db, 'currencyRates')), {
            ...rateData,
            createdAt: new Date().toISOString()
          });
          results.created.push(`${market}: ${rate}`);
          console.log(`✓ Created ${market}: ${rate}`);
        }
      } catch (error) {
        results.failed.push({
          market,
          rate,
          error: error.message
        });
        console.error(`✗ Failed ${market}:`, error.message);
      }
    }

    console.log('\n=== Currency Rate Update Complete ===');
    console.log(`Updated: ${results.updated.length}`);
    console.log(`Created: ${results.created.length}`);
    console.log(`Failed: ${results.failed.length}`);

    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('Error updating currency rates:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

export default updateCurrencyRates;
