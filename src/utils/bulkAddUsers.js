import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const BULK_USERS = [
  { market: 'Botswana', email: 'Botswana@test.co.za', username: 'Botswana', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Ghana', email: 'Ghana@test.co.za', username: 'Ghana', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Hub', email: 'Hub@test.co.za', username: 'Hub', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Kenya', email: 'Kenya@test.co.za', username: 'Kenya', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Mauritius', email: 'Mauritius@test.co.za', username: 'Mauritius', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Mozambique', email: 'Mozambique@test.co.za', username: 'Mozambic', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Seychelles', email: 'Seychelles@test.co.za', username: 'Seychelles', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Tanzania', email: 'Tanzania@test.co.za', username: 'Tanzania', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Uganda', email: 'Uganda@test.co.za', username: 'Uganda', password: 'Speccon', role: 'marketAdmin' },
  { market: 'Zambia', email: 'Zambia@test.co.za', username: 'Zambia', password: 'Speccon', role: 'marketAdmin' },
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

      // Create user document in Firestore
      const userDoc = {
        email: userData.email,
        username: userData.username,
        role: userData.role || 'marketAdmin',
        createdAt: new Date().toISOString()
      };

      // Only add assignedMarket if it's not null (for market admins)
      if (userData.market) {
        userDoc.assignedMarket = userData.market;
      }

      await addDoc(collection(db, 'users'), userDoc);

      results.success.push({
        email: userData.email,
        market: userData.market
      });

      // Sign out the newly created user to avoid session conflicts
      await auth.signOut();

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        // User exists in Auth, try to add to Firestore only
        try {
          const userDoc = {
            email: userData.email,
            username: userData.username,
            role: userData.role || 'marketAdmin',
            createdAt: new Date().toISOString()
          };

          // Only add assignedMarket if it's not null (for market admins)
          if (userData.market) {
            userDoc.assignedMarket = userData.market;
          }

          await addDoc(collection(db, 'users'), userDoc);
          results.success.push({
            email: userData.email,
            market: userData.market,
            note: 'Added to Firestore (already existed in Auth)'
          });
        } catch (firestoreError) {
          results.failed.push({
            email: userData.email,
            error: firestoreError.message
          });
        }
      } else {
        results.failed.push({
          email: userData.email,
          error: error.message
        });
      }
    }
  }

  // Note: Current user session was logged out during the process
  // The user will need to log in again

  return results;
};

export default bulkAddUsers;
