# Setup Instructions

## 1. Environment Variables

Create a `.env` file in the root directory with your Firebase configuration:

```
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Firebase Setup

### Create Initial Admin User

1. Go to Firebase Console > Authentication
2. Enable Email/Password authentication
3. Click "Add user" and create user with:
   - Email: `Hein@speccon.co.za`
   - Password: (set a secure password)
4. Copy the User UID from the Authentication section
5. Go to Firestore Database
6. Create a new document in the `users` collection with:
   - Document ID: (the User UID from step 4)
   - Fields:
     - `email`: `Hein@speccon.co.za`
     - `role`: `admin`
     - `createdAt`: (current timestamp)

### Deploy Firebase Rules

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore`
4. Deploy rules: `firebase deploy --only firestore:rules`

Or manually copy the rules from `firebase.rules` to Firebase Console > Firestore Database > Rules

## 4. Start Development Server

```bash
npm start
```

The app will open at http://localhost:3000

## 5. GitHub Setup

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/heinrichwest/publicis_budget_Report.git
git branch -M main
git push -u origin main
```

