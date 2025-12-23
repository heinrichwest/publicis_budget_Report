# Publicis Budget Report

A React application for managing country budget reports with Firebase authentication and user role management.

## Features

- Firebase Authentication
- User role management (Admin, Manager)
- Admin can add users and assign roles
- Secure database access with Firebase Rules

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Create a `.env` file in the root directory
   - Add your Firebase configuration:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

3. Start the development server:
```bash
npm start
```

## Initial Admin User

- Email: Hein@speccon.co.za
- Role: Admin

## User Roles

- **Admin**: Can add users and assign roles
- **Manager**: Can view and manage reports


