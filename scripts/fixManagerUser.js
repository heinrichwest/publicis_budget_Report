const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, signOut } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase config (same as your app)
const firebaseConfig = {
  apiKey: "AIzaSyBUecwql2Ilwv0jE9UVY6iDdj0uz7NRIaI",
  authDomain: "publicis-budget-report.firebaseapp.com",
  projectId: "publicis-budget-report",
  storageBucket: "publicis-budget-report.firebasestorage.app",
  messagingSenderId: "156084645926",
  appId: "1:156084645926:web:a8b34291dca2bef00a8c3d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function fixManagerUser() {
  try {
    console.log('Signing in as manager@test.co.za...');

    // Sign in to get the UID
    const userCredential = await signInWithEmailAndPassword(
      auth,
      'manager@test.co.za',
      'Speccon'
    );

    const uid = userCredential.user.uid;
    console.log(`✓ Signed in successfully (UID: ${uid})`);

    // Create the Firestore document with correct UID
    console.log('Creating Firestore document with UID as document ID...');

    await setDoc(doc(db, 'users', uid), {
      email: 'manager@test.co.za',
      username: 'Manager',
      role: 'manager',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('✓ Firestore document created successfully!');
    console.log(`  Document ID: ${uid}`);
    console.log('  Email: manager@test.co.za');
    console.log('  Role: manager');
    console.log('  Market: (none - can view all markets)');

    await signOut(auth);
    console.log('✓ Signed out');

    console.log('\n✅ Manager user fixed successfully!');
    console.log('The user should now appear in the User Management screen.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixManagerUser();
