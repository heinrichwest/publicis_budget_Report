// Utility script to initialize the admin user
// This should be run once to create the initial admin user
// Run this in the browser console after Firebase is configured

import { createUser } from '../firebase/auth';

export const initializeAdmin = async () => {
  // Note: You'll need to create this user manually through Firebase Console
  // or use Firebase Admin SDK on the server side
  // This is a helper function that can be called from the browser console
  
  const adminEmail = 'Hein@speccon.co.za';
  const adminPassword = 'ChangeThisPassword123!'; // User should change this
  
  console.log('Initializing admin user...');
  const result = await createUser(adminEmail, adminPassword, 'admin');
  
  if (result.success) {
    console.log('Admin user created successfully!');
    console.log('Please change the password after first login.');
  } else {
    console.error('Error creating admin user:', result.error);
  }
  
  return result;
};

// Instructions for creating the admin user:
// 1. Go to Firebase Console > Authentication
// 2. Click "Add user" and create user with email: Hein@speccon.co.za
// 3. Set a temporary password
// 4. Go to Firestore Database
// 5. Create a document in the "users" collection with the user's UID
// 6. Set the document fields: email: "Hein@speccon.co.za", role: "admin", createdAt: (current timestamp)

