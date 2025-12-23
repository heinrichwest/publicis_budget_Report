const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBUecwql2Ilwv0jE9UVY6iDdj0uz7NRIaI",
  authDomain: "publicis-budget-report.firebaseapp.com",
  projectId: "publicis-budget-report",
  storageBucket: "publicis-budget-report.firebasestorage.app",
  messagingSenderId: "156084645926",
  appId: "1:156084645926:web:a8b34291dca2bef00a8c3d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Market name mappings from CSV to our system
const MARKET_MAPPINGS = {
  'Botswana (BWP)': 'Botswana',
  'Ghana \n(GHS)': 'Ghana',
  'Ghana (GHS)': 'Ghana',
  'Kenya\n (KES)': 'Kenya',
  'Kenya (KES)': 'Kenya',
  'Mauritius \n(MUR)': 'Mauritius',
  'Mauritius (MUR)': 'Mauritius',
  'Mozambique \n(MZN)': 'Mozambique',
  'Mozambique (MZN)': 'Mozambique',
  'Seychelles (SCR)': 'Seychelles',
  'Tanzania (TZS)': 'Tanzania',
  'Uganda (UGX)': 'Uganda',
  'Zambia (ZMW)': 'Zambia',
  'Hub': 'Hub'
};

// Medium name mappings
const MEDIUM_MAPPINGS = {
  'Google Display Network': 'Programmatic Display',
  'Programmatic Display': 'Programmatic Display'
};

// Parse CSV value - handle spaces and dashes
function parseValue(value) {
  if (!value || value.trim() === '-' || value.trim() === '') {
    return 0;
  }
  // Remove spaces and parse
  const cleaned = value.replace(/\s+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Parse CSV line considering quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

async function importActualsFromCSV() {
  try {
    console.log('Reading Actuals.csv...');
    const csvPath = path.join(__dirname, '..', 'Actuals.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    console.log(`Total lines in CSV: ${lines.length}`);

    // Clear existing actuals
    console.log('\nClearing existing actuals...');
    const actualsSnapshot = await getDocs(collection(db, 'actuals'));
    for (const docSnapshot of actualsSnapshot.docs) {
      await deleteDoc(docSnapshot.ref);
    }
    console.log(`✓ Cleared ${actualsSnapshot.size} existing actuals`);

    // Group data by market and medium
    const actualsMap = {};

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);

      if (fields.length < 6) continue;

      const marketRaw = fields[0];
      const mediumRaw = fields[1];
      const month = fields[2].trim();
      const rateCard = parseValue(fields[3]);
      const discount = parseValue(fields[4]);
      const addedValue = parseValue(fields[5]);

      // Map market name
      const market = MARKET_MAPPINGS[marketRaw] || marketRaw;

      // Map medium name
      const medium = MEDIUM_MAPPINGS[mediumRaw] || mediumRaw;

      if (!MONTHS.includes(month)) {
        console.log(`  Warning: Unknown month '${month}' on line ${i + 1}`);
        continue;
      }

      // Create unique key for market-medium combination
      const key = `${market}|${medium}`;

      if (!actualsMap[key]) {
        actualsMap[key] = {
          market: market,
          medium: medium,
          monthlyActuals: {}
        };
      }

      actualsMap[key].monthlyActuals[month] = {
        rateCard: rateCard,
        discount: discount,
        addedValue: addedValue
      };
    }

    const actuals = Object.values(actualsMap);
    console.log(`\n\nParsed ${actuals.length} unique market-medium combinations`);

    // Show sample
    console.log('\nSample actuals:');
    actuals.slice(0, 3).forEach(actual => {
      console.log(`  ${actual.market} - ${actual.medium}`);
      console.log(`    Jan: Rate Card=${actual.monthlyActuals.Jan?.rateCard || 0}, Discount=${actual.monthlyActuals.Jan?.discount || 0}, Added Value=${actual.monthlyActuals.Jan?.addedValue || 0}`);
    });

    // Upload to Firestore
    console.log('\n\nUploading to Firestore...');
    let uploaded = 0;

    for (const actual of actuals) {
      const docRef = doc(collection(db, 'actuals'));
      await setDoc(docRef, {
        ...actual,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      uploaded++;

      if (uploaded % 10 === 0) {
        console.log(`  Uploaded ${uploaded}/${actuals.length} actuals...`);
      }
    }

    console.log(`\n✅ Successfully imported ${uploaded} actuals!`);

    // Show summary by market
    const marketCounts = {};
    actuals.forEach(actual => {
      marketCounts[actual.market] = (marketCounts[actual.market] || 0) + 1;
    });

    console.log('\nActuals by market:');
    Object.entries(marketCounts).sort((a, b) => a[0].localeCompare(b[0])).forEach(([market, count]) => {
      console.log(`  ${market}: ${count} mediums`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing actuals:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

importActualsFromCSV();
