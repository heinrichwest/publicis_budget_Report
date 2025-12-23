const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '..', 'Activity plan example.xlsx');
const workbook = XLSX.readFile(filePath);

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log('Total rows in Excel:', rawData.length);

// Get header row (row 2, index 2)
// Headers: [Conversion Rate, Market, Business Unit, Campaign, Medium, Total Spend (ZAR), Total Spend, Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Valid market names (countries)
const VALID_MARKETS = ['Botswana', 'Ghana', 'Hub', 'Kenya', 'Mauritius', 'Mozambique', 'Seychelles', 'Tanzania', 'Uganda', 'Zambia'];

// Get data rows (starting from row 3, index 3)
// Filter out empty rows and summary rows (those with CIB, RBB, Brand as market)
const dataRows = rawData.slice(3).filter(row => row[1] && VALID_MARKETS.includes(row[1]));

console.log('Total valid data rows:', dataRows.length);

// Convert to activity data format
const activityData = dataRows.map(row => {
  const monthlySpend = {};
  const market = row[1];
  const totalSpend = parseFloat(row[6]) || 0; // Total Spend column (index 6)

  // Extract monthly spend from columns 7-18 (Jan-Dec)
  MONTHS.forEach((month, index) => {
    const value = row[7 + index];
    if (value && value !== '' && value !== 0) {
      monthlySpend[month] = parseFloat(value);
    }
  });

  // Special handling for Seychelles: if no monthly data, put total in January
  if (market === 'Seychelles' && Object.keys(monthlySpend).length === 0 && totalSpend > 0) {
    monthlySpend['Jan'] = totalSpend;
  }

  return {
    market: market,
    businessUnit: row[2],
    campaign: row[3],
    medium: row[4],
    conversionRate: parseFloat(row[0]) || 1,
    monthlySpend: monthlySpend
  };
});

console.log('\nConverted activities:', activityData.length);

// Count by market
const marketCounts = {};
activityData.forEach(activity => {
  marketCounts[activity.market] = (marketCounts[activity.market] || 0) + 1;
});

console.log('\nActivities by market:');
Object.entries(marketCounts).sort((a, b) => b[1] - a[1]).forEach(([market, count]) => {
  console.log(`  ${market}: ${count}`);
});

// Generate JavaScript code
const outputPath = path.join(__dirname, '..', 'src', 'utils', 'importActivityData.js');

const jsCode = `import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// All activity data from Excel file
const ACTIVITY_DATA = ${JSON.stringify(activityData, null, 2)};

const calculateTotalSpend = (monthlySpend) => {
  return Object.values(monthlySpend).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
};

const convertToZAR = (localAmount, conversionRate) => {
  return localAmount * conversionRate;
};

export const importActivityData = async () => {
  try {
    // Check if data already exists
    const snapshot = await getDocs(collection(db, 'activityPlan'));
    if (!snapshot.empty) {
      return {
        success: false,
        message: 'Activity data already exists. Clear the collection first if you want to re-import.'
      };
    }

    const results = {
      success: [],
      failed: []
    };

    for (const activity of ACTIVITY_DATA) {
      try {
        const totalLocal = calculateTotalSpend(activity.monthlySpend);
        const totalZAR = convertToZAR(totalLocal, activity.conversionRate);

        await addDoc(collection(db, 'activityPlan'), {
          market: activity.market,
          businessUnit: activity.businessUnit,
          campaign: activity.campaign,
          medium: activity.medium,
          monthlySpend: activity.monthlySpend,
          totalSpendLocal: totalLocal,
          totalSpendZAR: totalZAR,
          conversionRate: activity.conversionRate,
          createdAt: new Date().toISOString(),
          createdBy: 'system-import'
        });

        results.success.push(\`\${activity.campaign} - \${activity.medium}\`);
      } catch (error) {
        results.failed.push({
          activity: \`\${activity.campaign} - \${activity.medium}\`,
          error: error.message
        });
      }
    }

    return {
      success: true,
      imported: results.success.length,
      failed: results.failed.length,
      details: results
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error importing data: ' + error.message
    };
  }
};

export default importActivityData;
`;

fs.writeFileSync(outputPath, jsCode);
console.log(`\n✓ Generated import file with ${activityData.length} activities`);
console.log(`  Output: ${outputPath}`);
