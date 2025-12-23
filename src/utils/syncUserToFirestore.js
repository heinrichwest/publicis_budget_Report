import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Ensures a user document exists in Firestore for the given Firebase Auth user
 * This should be called after any user creation or login
 * If the document already exists, it will NOT overwrite it (unless force is true)
 */
export const syncUserToFirestore = async (user, additionalData = {}, force = false) => {
  if (!user || !user.uid) {
    console.error('No user provided to syncUserToFirestore');
    return { success: false, error: 'No user provided' };
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    // If document doesn't exist OR force is true, create/update it
    if (!userDoc.exists() || force) {
      const action = userDoc.exists() ? 'Updating' : 'Creating';
      console.log(`${action} Firestore document for user ${user.email} (UID: ${user.uid})`);

      const userData = {
        email: user.email,
        createdAt: userDoc.exists() ? (userDoc.data().createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...additionalData
      };

      // Set default role if not provided
      if (!userData.role) {
        userData.role = 'marketAdmin';
      }

      await setDoc(userDocRef, userData);
      console.log(`✓ Firestore document ${action.toLowerCase()}d for ${user.email}`);

      return { success: true, created: !userDoc.exists(), updated: userDoc.exists() };
    } else {
      console.log(`Firestore document already exists for ${user.email}, skipping sync`);
      return { success: true, created: false, skipped: true };
    }
  } catch (error) {
    console.error('Error syncing user to Firestore:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Updates user document in Firestore with new data
 */
export const updateUserInFirestore = async (uid, data) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error updating user in Firestore:', error);
    return { success: false, error: error.message };
  }
};

export default syncUserToFirestore;
