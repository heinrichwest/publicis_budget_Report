import { collection, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Utility function to set a user as admin
 * Usage: Call this from browser console or temporarily from a component
 */
export const setUserAsAdmin = async (email) => {
  try {
    console.log(`Looking for user: ${email}`);

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`User ${email} not found in database`);
      return { success: false, message: 'User not found' };
    }

    const userDoc = snapshot.docs[0];
    console.log('Current user data:', userDoc.data());

    await updateDoc(userDoc.ref, {
      role: 'systemAdmin'
    });

    console.log(`✓ User ${email} is now a system admin`);
    console.log('Please refresh the page to see changes');

    return { success: true, message: 'User updated to system admin. Please refresh the page.' };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, message: error.message };
  }
};

// Run this immediately when imported (for testing)
// Uncomment the line below and import this file to auto-run
// setUserAsAdmin('hein@specon.co.za');
