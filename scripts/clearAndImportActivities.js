require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, addDoc, doc } = require('firebase/firestore');
const path = require('path');

// Firebase config from .env
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Import the activity data
const XLSX = require('xlsx');
const filePath = path.join(__dirname, '..', 'Activity plan example.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const VALID_MARKETS = ['Botswana', 'Ghana', 'Hub', 'Kenya', 'Mauritius', 'Mozambique', 'Seychelles', 'Tanzania', 'Uganda', 'Zambia'];

// Get data rows (starting from row 3, index 3)
const dataRows = rawData.slice(3).filter(row => row[1] && VALID_MARKETS.includes(row[1]));

// Convert to activity data format
const ACTIVITY_DATA = dataRows.map(row => {
  const monthlySpend = {};

  // Extract monthly spend from columns 7-18 (Jan-Dec)
  MONTHS.forEach((month, index) => {
    const value = row[7 + index];
    if (value && value !== '' && value !== 0) {
      monthlySpend[month] = parseFloat(value);
    }
  });

  return {
    market: row[1],
    businessUnit: row[2],
    campaign: row[3],
    medium: row[4],
    conversionRate: parseFloat(row[0]) || 1,
    monthlySpend: monthlySpend
  };
});

const calculateTotalSpend = (monthlySpend) => {
  return Object.values(monthlySpend).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
};

const convertToZAR = (localAmount, conversionRate) => {
  return localAmount * conversionRate;
};

async function clearAndImport() {
  try {
    console.log('Starting clear and import process...\n');

    // Step 1: Clear existing data
    console.log('Step 1: Clearing existing activityPlan collection...');
    const snapshot = await getDocs(collection(db, 'activityPlan'));
    console.log(`Found ${snapshot.size} existing documents`);

    if (snapshot.size > 0) {
      const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, 'activityPlan', document.id)));
      await Promise.all(deletePromises);
      console.log(`✓ Deleted ${snapshot.size} existing documents\n`);
    } else {
      console.log('✓ Collection is already empty\n');
    }

    // Step 2: Import new data
    console.log(`Step 2: Importing ${ACTIVITY_DATA.length} activities from Excel...`);

    const results = {
      success: [],
      failed: []
    };

    let count = 0;
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

        count++;
        if (count % 50 === 0) {
          console.log(`  Imported ${count}/${ACTIVITY_DATA.length} activities...`);
        }

        results.success.push(`${activity.market} - ${activity.campaign} - ${activity.medium}`);
      } catch (error) {
        results.failed.push({
          activity: `${activity.market} - ${activity.campaign} - ${activity.medium}`,
          error: error.message
        });
        console.error(`✗ Failed: ${activity.market} - ${activity.campaign} - ${activity.medium}`);
      }
    }

    console.log(`\n✓ Import complete!\n`);
    console.log(`Successfully imported: ${results.success.length}`);
    console.log(`Failed: ${results.failed.length}`);

    // Show breakdown by market
    const marketCounts = {};
    ACTIVITY_DATA.forEach(activity => {
      marketCounts[activity.market] = (marketCounts[activity.market] || 0) + 1;
    });

    console.log('\nActivities imported by market:');
    Object.entries(marketCounts).sort((a, b) => b[1] - a[1]).forEach(([market, count]) => {
      console.log(`  ${market}: ${count} activities`);
    });

    if (results.failed.length > 0) {
      console.log('\nFailed imports:');
      results.failed.forEach(f => console.log(`  - ${f.activity}: ${f.error}`));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error during clear and import:', error);
    process.exit(1);
  }
}

clearAndImport();
