import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { importActivityData } from './importActivityData';

export const clearAndReimportActivities = async () => {
  try {
    console.log('Starting clear and re-import process...');

    // Step 1: Clear existing data
    console.log('Step 1: Clearing existing activityPlan collection...');
    const snapshot = await getDocs(collection(db, 'activityPlan'));
    console.log(`Found ${snapshot.size} existing documents`);

    if (snapshot.size > 0) {
      // Delete in batches to avoid overwhelming Firestore
      const deletePromises = snapshot.docs.map(document =>
        deleteDoc(doc(db, 'activityPlan', document.id))
      );

      await Promise.all(deletePromises);
      console.log(`✓ Deleted ${snapshot.size} existing documents`);
    } else {
      console.log('✓ Collection is already empty');
    }

    // Small delay to ensure deletion is complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Import new data
    console.log('Step 2: Importing new activities...');
    const results = await importActivityData();

    return {
      success: true,
      deleted: snapshot.size,
      imported: results.imported || 0,
      failed: results.failed || 0,
      details: results
    };
  } catch (error) {
    console.error('Error during clear and re-import:', error);
    return {
      success: false,
      message: 'Error during clear and re-import: ' + error.message
    };
  }
};

export default clearAndReimportActivities;
