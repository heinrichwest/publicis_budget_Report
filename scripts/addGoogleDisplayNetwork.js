const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');

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

const MARKETS = [
  'Botswana',
  'Ghana',
  'Kenya',
  'Mauritius',
  'Mozambique',
  'Seychelles',
  'Tanzania',
  'Uganda',
  'Zambia',
  'Hub'
];

async function addGoogleDisplayNetwork() {
  try {
    console.log('Adding Google Display Network medium to all markets...\n');

    let added = 0;

    for (const market of MARKETS) {
      console.log(`Adding Google Display Network for ${market}...`);

      // Create empty monthly actuals - data will be filled in via admin interface
      const monthlyActuals = {};

      const docRef = doc(collection(db, 'actuals'));
      await setDoc(docRef, {
        market: market,
        medium: 'Google Display Network',
        monthlyActuals: monthlyActuals,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      added++;
      console.log(`  ✓ Added Google Display Network for ${market}`);
    }

    console.log(`\n✅ Successfully added Google Display Network for ${added} markets!`);
    console.log('\nAll markets now have Google Display Network medium.');
    console.log('Data can be entered via the Admin Actuals interface.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding Google Display Network:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

addGoogleDisplayNetwork();
