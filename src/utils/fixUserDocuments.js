import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

const USERS_TO_FIX = [
  { email: 'Botswana@test.co.za', password: 'Speccon', market: 'Botswana', role: 'marketAdmin' },
  { email: 'Ghana@test.co.za', password: 'Speccon', market: 'Ghana', role: 'marketAdmin' },
  { email: 'Hub@test.co.za', password: 'Speccon', market: 'Hub', role: 'marketAdmin' },
  { email: 'Kenya@test.co.za', password: 'Speccon', market: 'Kenya', role: 'marketAdmin' },
  { email: 'Mauritius@test.co.za', password: 'Speccon', market: 'Mauritius', role: 'marketAdmin' },
  { email: 'Mozambique@test.co.za', password: 'Speccon', market: 'Mozambique', role: 'marketAdmin' },
  { email: 'Seychelles@test.co.za', password: 'Speccon', market: 'Seychelles', role: 'marketAdmin' },
  { email: 'Tanzania@test.co.za', password: 'Speccon', market: 'Tanzania', role: 'marketAdmin' },
  { email: 'Uganda@test.co.za', password: 'Speccon', market: 'Uganda', role: 'marketAdmin' },
  { email: 'Zambia@test.co.za', password: 'Speccon', market: 'Zambia', role: 'marketAdmin' },
  { email: 'manager@test.co.za', password: 'Speccon', market: null, role: 'manager' }
];

/**
 * Fix user documents by creating them with the correct UID-based document IDs
 * This function signs in as each user to get their UID, then creates the proper document
 */
export const fixUserDocuments = async () => {
  const results = {
    fixed: [],
    failed: [],
    skipped: []
  };

  console.log('Starting user document fix...');
  console.log(`Total users to process: ${USERS_TO_FIX.length}`);

  for (const userData of USERS_TO_FIX) {
    try {
      console.log(`\n--- Processing ${userData.email} ---`);

      // Sign in as the user to get their UID
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const uid = userCredential.user.uid;
      console.log(`✓ Signed in successfully (UID: ${uid})`);

      // Create/update the user document with the correct UID as document ID
      console.log(`Creating/updating Firestore document for ${userData.email}...`);

      const userDocData = {
        email: userData.email,
        role: userData.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Only add assignedMarket if it exists (not null for managers)
      if (userData.market) {
        userDocData.assignedMarket = userData.market;
      }

      await setDoc(doc(db, 'users', uid), userDocData, { merge: true });

      console.log(`✓ Firestore document created/updated`);

      results.fixed.push({
        email: userData.email,
        uid: uid,
        market: userData.market,
        role: userData.role
      });

      console.log(`✓✓ COMPLETED ${userData.email}`);

      // Sign out
      await signOut(auth);
      console.log(`✓ Signed out`);

      // Add a small delay between operations to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`\n✗✗ FAILED ${userData.email}:`);
      console.error(`Error type: ${error.code}`);
      console.error(`Error message: ${error.message}`);
      console.error('Full error:', error);

      results.failed.push({
        email: userData.email,
        error: error.message,
        code: error.code
      });

      // Try to sign out even if there was an error
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error('Could not sign out after error:', signOutError.message);
      }
    }
  }

  console.log('\n\n=== User Document Fix Complete ===');
  console.log(`Total processed: ${USERS_TO_FIX.length}`);
  console.log(`✓ Fixed: ${results.fixed.length}`);
  console.log(`✗ Failed: ${results.failed.length}`);
  console.log(`○ Skipped: ${results.skipped.length}`);

  if (results.fixed.length > 0) {
    console.log('\nFixed users:');
    results.fixed.forEach(u => console.log(`  - ${u.email} (${u.role} - ${u.market})`));
  }

  if (results.failed.length > 0) {
    console.log('\nFailed users:');
    results.failed.forEach(u => console.log(`  - ${u.email}: ${u.error}`));
  }

  return results;
};

/**
 * Clean up old user documents with random IDs
 */
export const cleanupOldUserDocs = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const docsToDelete = [];

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      // If document ID doesn't look like a UID (UIDs are 28 chars), mark for deletion
      // But keep the hein@speccon.co.za admin user
      if (data.email !== 'hein@speccon.co.za' && doc.id.length < 20) {
        docsToDelete.push({
          id: doc.id,
          email: data.email
        });
      }
    });

    console.log(`Found ${docsToDelete.length} old documents to clean up`);

    for (const docInfo of docsToDelete) {
      await deleteDoc(doc(db, 'users', docInfo.id));
      console.log(`Deleted old document for ${docInfo.email}`);
    }

    return {
      success: true,
      deleted: docsToDelete.length
    };
  } catch (error) {
    console.error('Error cleaning up old docs:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default fixUserDocuments;
