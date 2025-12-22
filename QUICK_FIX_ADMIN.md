# Quick Fix: Set Admin Role for hein@speccon.co.za

## Problem
You're logged in as `hein@speccon.co.za` but cannot see the admin dashboard because the user doesn't have a role set in Firestore.

## Solution Options

### Option 1: Use Firebase Console (RECOMMENDED - FASTEST)

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: "publicis-budget-report"
3. Go to **Firestore Database**
4. Click on the **"users"** collection (or create it if it doesn't exist)
5. Find the document with your user ID, or create a new document:
   - **Document ID**: Your user UID (you can find this in Authentication > Users)
   - Click "Add Document"
6. Add these fields:
   ```
   email: "hein@speccon.co.za"
   role: "admin"
   createdAt: (use timestamp with current date/time)
   ```
7. Save the document
8. **Refresh your browser** or logout and login again

### Option 2: Use Browser Console

1. While logged in to the app, open Browser Developer Tools (F12)
2. Go to the **Console** tab
3. Paste this code and press Enter:

```javascript
const { doc, setDoc } = await import('firebase/firestore');
const { db, auth } = await import('./firebase/config');

const user = auth.currentUser;
if (user) {
  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    role: 'admin',
    createdAt: new Date().toISOString()
  });
  console.log('Admin role set! Please refresh the page.');
  alert('Admin role set successfully! Refreshing page...');
  window.location.reload();
} else {
  console.error('No user logged in');
}
```

### Option 3: Navigate to Setup Page

I'll add a `/setup` route where you can click a button to set yourself as admin.

## Expected Result

After completing any of these options:
1. Refresh the page
2. You should see the Admin Dashboard with tabs:
   - Markets
   - Currency Rates  
   - Mediums
   - User Management
3. Click "INITIALIZE DATA" button to populate the database with initial data
