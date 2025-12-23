const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } = require('firebase/firestore');
const XLSX = require('xlsx');

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

// Market name mappings from Excel to our system
const MARKET_MAPPINGS = {
  'Botswana (BWP)': 'Botswana',
  'Ghana \n(GHS)': 'Ghana',
  'Ghana': 'Ghana',
  'Hub': 'Hub',
  'Kenya': 'Kenya',
  'Mauritius': 'Mauritius',
  'Mozambique': 'Mozambique',
  'Seychelles': 'Seychelles',
  'Tanzania': 'Tanzania',
  'Uganda': 'Uganda',
  'Zambia': 'Zambia'
};

async function importActuals() {
  try {
    console.log('Reading Actuals.xlsx...');
    const workbook = XLSX.readFile('Actuals.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    console.log(`Total rows in Excel: ${data.length}`);

    // Clear existing actuals
    console.log('\nClearing existing actuals...');
    const actualsSnapshot = await getDocs(collection(db, 'actuals'));
    for (const doc of actualsSnapshot.docs) {
      await deleteDoc(doc.ref);
    }
    console.log(`✓ Cleared ${actualsSnapshot.size} existing actuals`);

    const actuals = [];
    let currentMarket = null;

    // Process each row starting from row 5 (after headers)
    for (let i = 5; i < data.length; i++) {
      const row = data[i];

      // Check if this is a market header row
      if (row[0] && row[0].toString().trim() !== '') {
        const marketName = row[0].toString().trim();
        currentMarket = MARKET_MAPPINGS[marketName] || marketName;
        console.log(`\nProcessing market: ${currentMarket}`);
        // Don't continue - process this row's medium too
      }

      // Skip if no current market or no medium
      if (!currentMarket || !row[1]) continue;

      const medium = row[1].toString().trim();

      // Skip totals and empty rows
      if (medium.toUpperCase().includes('TOTAL') || medium === '') continue;

      console.log(`  Processing medium: ${medium}`);

      // Parse monthly data
      const monthlyActuals = {};

      // Columns 2-9 are TOTAL section (skip these)
      // Monthly data starts at column 11
      // Each month has: Rate Card, Discount, After Discount, Nett Nett, % Disc, Added Value, AV %, (gap)
      // We need: Rate Card, Discount, Added Value
      // Nett will be calculated as Rate Card - Discount
      // That's 8 columns total per month (7 data + 1 gap)
      let colIndex = 11; // Start at column 11 for January

      for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
        const month = MONTHS[monthIdx];

        const rateCard = parseFloat(row[colIndex]) || 0;        // Rate Card
        const discount = parseFloat(row[colIndex + 1]) || 0;    // Discount
        const addedValue = parseFloat(row[colIndex + 5]) || 0;  // Added Value (column 6 in each month section)

        monthlyActuals[month] = {
          rateCard: rateCard,
          discount: discount,
          addedValue: addedValue
        };

        // Move to next month (8 columns per month including gap)
        colIndex += 8;

        // Break if we've gone past the available columns
        if (colIndex >= row.length) break;
      }

      actuals.push({
        market: currentMarket,
        medium: medium,
        monthlyActuals: monthlyActuals
      });
    }

    console.log(`\n\nParsed ${actuals.length} actuals entries`);
    console.log('\nSample actuals:');
    actuals.slice(0, 3).forEach(actual => {
      console.log(`  ${actual.market} - ${actual.medium}`);
      console.log(`    Jan: Rate Card=${actual.monthlyActuals.Jan.rateCard}, Discount=${actual.monthlyActuals.Jan.discount}, Nett=${actual.monthlyActuals.Jan.nettNett}`);
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

importActuals();
