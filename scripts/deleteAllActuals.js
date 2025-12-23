const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc } = require('firebase/firestore');

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

async function deleteAllActuals() {
  try {
    console.log('Fetching all actuals...');
    const actualsSnapshot = await getDocs(collection(db, 'actuals'));

    console.log(`Found ${actualsSnapshot.size} actuals to delete`);

    if (actualsSnapshot.size === 0) {
      console.log('No actuals to delete');
      process.exit(0);
    }

    console.log('Deleting actuals...');
    let count = 0;

    for (const docSnapshot of actualsSnapshot.docs) {
      await deleteDoc(docSnapshot.ref);
      count++;
      if (count % 10 === 0) {
        console.log(`  Deleted ${count}/${actualsSnapshot.size}...`);
      }
    }

    console.log(`✅ Successfully deleted ${count} actuals!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting actuals:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

deleteAllActuals();
