import React, { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

const AdminSetup = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const setupAdminRole = async () => {
    setLoading(true);
    setMessage('');
    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage('Error: No user is currently logged in');
        setLoading(false);
        return;
      }
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      setMessage('Success! Admin role set for ' + user.email + '. Refreshing in 2 seconds...');
      setTimeout(() => window.location.href = '/dashboard', 2000);
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
    setLoading(false);
  };

  const checkUserRole = async () => {
    setLoading(true);
    setMessage('');
    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage('Error: No user is currently logged in');
        setLoading(false);
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setMessage('User: ' + user.email + '
Role: ' + (data.role || 'No role set') + '
UID: ' + user.uid);
      } else {
        setMessage('User ' + user.email + ' exists in Auth but has no Firestore document.
UID: ' + user.uid);
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Admin Setup Utility</h2>
        <p style={styles.subtitle}>Logged in as: {auth.currentUser?.email || 'Not logged in'}</p>
        <button onClick={checkUserRole} disabled={loading} style={styles.button}>CHECK MY ROLE</button>
        <button onClick={setupAdminRole} disabled={loading} style={styles.primaryButton}>
          {loading ? 'SETTING UP...' : 'MAKE ME ADMIN'}
        </button>
        {message && <div style={styles.message}><pre>{message}</pre></div>}
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' },
  card: { maxWidth: '600px', padding: '2.5rem', border: '1px solid #EEEEEE' },
  title: { fontSize: '28px', fontWeight: '700', marginBottom: '0.5rem' },
  subtitle: { fontSize: '14px', color: '#666666', marginBottom: '2rem' },
  button: { padding: '1rem 2rem', backgroundColor: '#FFFFFF', color: '#000000', border: '1px solid #000000', borderRadius: '2px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', marginRight: '1rem' },
  primaryButton: { padding: '1rem 2rem', backgroundColor: '#000000', color: '#FFFFFF', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  message: { backgroundColor: '#EFE', padding: '1.5rem', marginTop: '1.5rem', border: '1px solid #CFC' }
};

export default AdminSetup;