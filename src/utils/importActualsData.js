import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import * as XLSX from 'xlsx';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Market name mappings from Excel/CSV to our system
const MARKET_MAPPINGS = {
  'Botswana (BWP)': 'Botswana',
  'Ghana \n(GHS)': 'Ghana',
  'Ghana (GHS)': 'Ghana',
  'Ghana': 'Ghana',
  'Kenya\n (KES)': 'Kenya',
  'Kenya (KES)': 'Kenya',
  'Kenya': 'Kenya',
  'Mauritius \n(MUR)': 'Mauritius',
  'Mauritius (MUR)': 'Mauritius',
  'Mauritius': 'Mauritius',
  'Mozambique \n(MZN)': 'Mozambique',
  'Mozambique (MZN)': 'Mozambique',
  'Mozambique': 'Mozambique',
  'Seychelles (SCR)': 'Seychelles',
  'Seychelles': 'Seychelles',
  'Tanzania (TZS)': 'Tanzania',
  'Tanzania': 'Tanzania',
  'Uganda (UGX)': 'Uganda',
  'Uganda': 'Uganda',
  'Zambia (ZMW)': 'Zambia',
  'Zambia': 'Zambia',
  'Hub': 'Hub'
};

// Medium name mappings
const MEDIUM_MAPPINGS = {
  'Google Display Network': 'Programmatic Display',
  'Programmatic Display': 'Programmatic Display'
};

// Parse CSV value - handle spaces and dashes
const parseValue = (value) => {
  if (!value || value.toString().trim() === '-' || value.toString().trim() === '') {
    return 0;
  }
  // Remove spaces and parse
  const cleaned = value.toString().replace(/\s+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const importActualsFromExcel = async (file) => {
  try {
    const fileName = file.name.toLowerCase();

    // Check if it's a CSV file
    if (fileName.endsWith('.csv')) {
      return await importActualsFromCSV(file);
    }

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

// CSV Import Function
const importActualsFromCSV = async (file) => {
  try {
    console.log('Reading CSV file...');

    // Read the CSV file
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    console.log(`Total lines in CSV: ${lines.length}`);

    // Clear existing actuals
    console.log('\nClearing existing actuals...');
    const actualsSnapshot = await getDocs(collection(db, 'actuals'));
    for (const docSnapshot of actualsSnapshot.docs) {
      await deleteDoc(docSnapshot.ref);
    }
    console.log(`✓ Cleared ${actualsSnapshot.size} existing actuals`);

    // Parse CSV line considering quoted fields
    const parseCSVLine = (line) => {
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
    };

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
      const janData = actual.monthlyActuals.Jan || { rateCard: 0, discount: 0, addedValue: 0 };
      console.log(`    Jan: Rate Card=${janData.rateCard}, Discount=${janData.discount}, Added Value=${janData.addedValue}`);
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

    const summary = {
      total: uploaded,
      byMarket: marketCounts
    };

    return {
      success: true,
      message: `Successfully imported ${uploaded} actuals from CSV`,
      summary
    };
  } catch (error) {
    console.error('❌ Error importing CSV actuals:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default importActualsFromExcel;
