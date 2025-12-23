import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { syncUserToFirestore } from './syncUserToFirestore';

const BULK_USERS = [
  { market: 'Botswana', email: 'botswana@test.co.za', username: 'Botswana', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Ghana', email: 'ghana@test.co.za', username: 'Ghana', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Hub', email: 'hub@test.co.za', username: 'Hub', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Kenya', email: 'kenya@test.co.za', username: 'Kenya', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Mauritius', email: 'mauritius@test.co.za', username: 'Mauritius', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Mozambique', email: 'mozambique@test.co.za', username: 'Mozambic', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Seychelles', email: 'seychelles@test.co.za', username: 'Seychelles', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Tanzania', email: 'tanzania@test.co.za', username: 'Tanzania', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Uganda', email: 'uganda@test.co.za', username: 'Uganda', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Zambia', email: 'zambia@test.co.za', username: 'Zambia', password: 'Speccon', role: 'marketAdmin' },
  { market: null, email: 'manager@test.co.za', username: 'Manager', password: 'Speccon', role: 'manager' }
];

export const bulkAddUsers = async () => {
  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  // Store current user to restore auth state
  const currentUser = auth.currentUser;

  for (const userData of BULK_USERS) {
    try {
      // Check if user already exists in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', userData.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        results.skipped.push({
          email: userData.email,
          reason: 'User already exists in Firestore'
        });
        continue;
      }

      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Prepare user data for Firestore
      const firestoreData = {
        username: userData.username,
        role: userData.role || 'marketAdmin'
      };

      // Only add assignedMarket if it's not null (for market admins)
      if (userData.market) {
        firestoreData.assignedMarket = userData.market;
      }

      // Sync user to Firestore (this will create the document with UID as ID)
      await syncUserToFirestore(userCredential.user, firestoreData);

      results.success.push({
        email: userData.email,
        market: userData.market
      });

      // Sign out the newly created user to avoid session conflicts
      await auth.signOut();

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        results.skipped.push({
          email: userData.email,
          reason: 'Email already in use in Firebase Auth'
        });
      } else {
        results.failed.push({
          email: userData.email,
          error: error.message,
          code: error.code
        });
      }
    }
  }

  // Note: Current user session was logged out during the process
  // The user will need to log in again

  return results;
};

export default bulkAddUsers;
