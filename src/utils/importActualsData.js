import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import * as XLSX from 'xlsx';

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

export const importActualsFromExcel = async (file) => {
  try {
    console.log('Reading Excel file...');

    // Read the file
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    console.log(`Total rows in Excel: ${rows.length}`);

    // Clear existing actuals
    console.log('\nClearing existing actuals...');
    const actualsSnapshot = await getDocs(collection(db, 'actuals'));
    for (const docSnapshot of actualsSnapshot.docs) {
      await deleteDoc(docSnapshot.ref);
    }
    console.log(`✓ Cleared ${actualsSnapshot.size} existing actuals`);

    const actuals = [];
    let currentMarket = null;

    // Process each row starting from row 5 (after headers)
    for (let i = 5; i < rows.length; i++) {
      const row = rows[i];

      // Check if this is a market header row
      if (row[0] && row[0].toString().trim() !== '') {
        const marketName = row[0].toString().trim();
        // Check if it's a known market
        const mappedMarket = MARKET_MAPPINGS[marketName];
        if (mappedMarket) {
          currentMarket = mappedMarket;
          console.log(`\nProcessing market: ${currentMarket}`);
        }
        continue;
      }

      // Skip if no current market or no medium
      if (!currentMarket || !row[1]) continue;

      const medium = row[1].toString().trim();

      // Skip totals and empty rows
      if (medium.toUpperCase().includes('TOTAL') || medium === '') continue;

      console.log(`  Processing medium: ${medium}`);

      // Parse monthly data
      const monthlyActuals = {};

      // Each month has 8 columns: Rate Card, Discount, After Discount, Nett Nett, % Disc, Added Value, AV %, Nett Nett (ZAR)
      // Starting at column 2 (index 2)
      let colIndex = 2;

      for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
        const month = MONTHS[monthIdx];

        const rateCard = parseFloat(row[colIndex]) || 0;
        const discount = parseFloat(row[colIndex + 1]) || 0;
        const nettNett = parseFloat(row[colIndex + 3]) || 0; // Nett Nett is at position 3

        monthlyActuals[month] = {
          rateCard: rateCard,
          discount: discount,
          nettNett: nettNett
        };

        // Move to next month (8 columns per month)
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

    // Upload to Firestore
    console.log('\nUploading to Firestore...');
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

    const summary = {
      total: uploaded,
      byMarket: marketCounts
    };

    return {
      success: true,
      message: `Successfully imported ${uploaded} actuals`,
      summary
    };
  } catch (error) {
    console.error('❌ Error importing actuals:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default importActualsFromExcel;
