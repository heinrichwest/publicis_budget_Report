const admin = require('firebase-admin');
const XLSX = require('xlsx');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Market name mappings from Excel to our system
const MARKET_MAPPINGS = {
  'Botswana (BWP)': 'Botswana',
  'Ghana \n(GHS)': 'Ghana',
  'Ghana (GHS)': 'Ghana',
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
    const actualsSnapshot = await db.collection('actuals').get();
    const batch = db.batch();
    actualsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`✓ Cleared ${actualsSnapshot.size} existing actuals`);

    const actuals = [];
    let currentMarket = null;

    // Process each row starting from row 5 (after headers)
    for (let i = 5; i < data.length; i++) {
      const row = data[i];

      // Check if this is a market header row
      if (row[0] && row[0].toString().trim() !== '') {
        const marketName = row[0].toString().trim();
        // Check if it's a known market
        const mappedMarket = MARKET_MAPPINGS[marketName];
        if (mappedMarket) {
          currentMarket = mappedMarket;
          console.log(`\nProcessing market: ${currentMarket}`);
        }
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

    // Upload to Firestore using batched writes
    console.log('\n\nUploading to Firestore...');
    let uploaded = 0;
    let currentBatch = db.batch();
    let batchCount = 0;

    for (const actual of actuals) {
      const docRef = db.collection('actuals').doc();
      currentBatch.set(docRef, {
        ...actual,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      batchCount++;
      uploaded++;

      // Firestore batches have a limit of 500 operations
      if (batchCount >= 500) {
        await currentBatch.commit();
        console.log(`  Committed batch (${uploaded}/${actuals.length})...`);
        currentBatch = db.batch();
        batchCount = 0;
      }
    }

    // Commit remaining operations
    if (batchCount > 0) {
      await currentBatch.commit();
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
