import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export const INITIAL_MARKETS = [
  'Botswana',
  'Ghana',
  'Hub',
  'Kenya',
  'Mauritius',
  'Mozambique',
  'Seychelles',
  'Tanzania',
  'Uganda',
  'Zambia'
];

export const INITIAL_CURRENCY_RATES = [
  { market: 'Botswana', rate: 68.640 },
  { market: 'Ghana', rate: 63.840 },
  { market: 'Hub', rate: 9.000 },
  { market: 'Kenya', rate: 4.340 },
  { market: 'Mauritius', rate: 19.500 },
  { market: 'Mozambique', rate: 3.640 },
  { market: 'Seychelles', rate: 30.268 },
  { market: 'Tanzania', rate: 0.126 },
  { market: 'Uganda', rate: 0.145 },
  { market: 'Zambia', rate: 32.680 }
];

export const INITIAL_MEDIUMS = [
  'Digital',
  'DOOH',
  'Influencers',
  'Online Publications',
  'OOH',
  'Other',
  'OUTDOOR',
  'Podcast',
  'Print',
  'Radio',
  'SOCIAL',
  'TECH COSTS',
  'Television'
];

export const initializeMarkets = async () => {
  try {
    const marketsCol = collection(db, 'markets');
    const snapshot = await getDocs(marketsCol);
    
    if (snapshot.empty) {
      for (const marketName of INITIAL_MARKETS) {
        await addDoc(marketsCol, {
          name: marketName,
          createdAt: new Date().toISOString()
        });
      }
      return { success: true, message: 'Markets initialized successfully' };
    }
    return { success: true, message: 'Markets already exist' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const initializeCurrencyRates = async () => {
  try {
    const ratesCol = collection(db, 'currencyRates');
    const snapshot = await getDocs(ratesCol);
    
    if (snapshot.empty) {
      for (const rateData of INITIAL_CURRENCY_RATES) {
        await addDoc(ratesCol, {
          ...rateData,
          createdAt: new Date().toISOString()
        });
      }
      return { success: true, message: 'Currency rates initialized successfully' };
    }
    return { success: true, message: 'Currency rates already exist' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const initializeMediums = async () => {
  try {
    const mediumsCol = collection(db, 'mediums');
    const snapshot = await getDocs(mediumsCol);
    
    if (snapshot.empty) {
      for (const mediumName of INITIAL_MEDIUMS) {
        await addDoc(mediumsCol, {
          name: mediumName,
          createdAt: new Date().toISOString()
        });
      }
      return { success: true, message: 'Mediums initialized successfully' };
    }
    return { success: true, message: 'Mediums already exist' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const initializeAllData = async () => {
  const results = {
    markets: await initializeMarkets(),
    currencyRates: await initializeCurrencyRates(),
    mediums: await initializeMediums()
  };
  return results;
};
