import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../firebase/config';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ email: '', role: '', assignedMarket: '' });
  const [newUser, setNewUser] = useState({ email: '', password: '', role: '', assignedMarket: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load markets
      const marketsSnapshot = await getDocs(collection(db, 'markets'));
      const marketsList = marketsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMarkets(marketsList);

      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (err) {
      setError('Error loading data: ' + err.message);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newUser.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!newUser.password || newUser.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!newUser.role) {
      setError('Role is required');
      return;
    }
    if (newUser.role === 'manager' && !newUser.assignedMarket) {
      setError('Managers must be assigned to a market');
      return;
    }

    setError('');
    setSuccess('');
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email.trim(),
        newUser.password
      );

      // Create user document in Firestore
      const userData = {
        email: newUser.email.trim(),
        role: newUser.role,
        createdAt: new Date().toISOString()
      };

      if (newUser.role === 'manager') {
        userData.assignedMarket = newUser.assignedMarket;
      }

      await addDoc(collection(db, 'users'), userData);

      setSuccess('User created successfully');
      setNewUser({ email: '', password: '', role: '', assignedMarket: '' });
      setShowAddForm(false);
      loadData();
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError('Error creating user: ' + err.message);
      }
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setEditData({
      email: user.email,
      role: user.role,
      assignedMarket: user.assignedMarket || ''
    });
    setError('');
    setSuccess('');
  };

  const handleUpdate = async (id) => {
    if (!editData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!editData.role) {
      setError('Role is required');
      return;
    }
    if (editData.role === 'manager' && !editData.assignedMarket) {
      setError('Managers must be assigned to a market');
      return;
    }

    setError('');
    setSuccess('');
    try {
      const updateData = {
        email: editData.email.trim(),
        role: editData.role,
        updatedAt: new Date().toISOString()
      };

      if (editData.role === 'manager') {
        updateData.assignedMarket = editData.assignedMarket;
      } else {
        // Remove assignedMarket if role is not manager
        updateData.assignedMarket = null;
      }

      await updateDoc(doc(db, 'users', id), updateData);
      setSuccess('User updated successfully');
      setEditingId(null);
      setEditData({ email: '', role: '', assignedMarket: '' });
      loadData();
    } catch (err) {
      setError('Error updating user: ' + err.message);
    }
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Are you sure you want to delete user "${email}"? This will not delete their authentication account.`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await deleteDoc(doc(db, 'users', id));
      setSuccess('User deleted successfully');
      loadData();
    } catch (err) {
      setError('Error deleting user: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ email: '', role: '', assignedMarket: '' });
    setError('');
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewUser({ email: '', password: '', role: '', assignedMarket: '' });
    setError('');
  };

  const getRoleBadgeStyle = (role) => {
    if (role === 'admin') {
      return { ...styles.badge, backgroundColor: '#000000', color: '#FFFFFF' };
    } else if (role === 'manager') {
      return { ...styles.badge, backgroundColor: '#666666', color: '#FFFFFF' };
    }
    return { ...styles.badge, backgroundColor: '#EEEEEE', color: '#333333' };
  };

  if (loading) {
    return <div style={styles.loading}>Loading users...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>User Management</h3>
        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} style={styles.addButton}>
            + ADD USER
          </button>
        )}
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}
      {success && <div style={styles.successMessage}>{success}</div>}

      {showAddForm && (
        <div style={styles.addForm}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="user@example.com"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Minimum 6 characters"
                style={styles.input}
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                style={styles.select}
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            {newUser.role === 'manager' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Assigned Market</label>
                <select
                  value={newUser.assignedMarket}
                  onChange={(e) => setNewUser({ ...newUser, assignedMarket: e.target.value })}
                  style={styles.select}
                >
                  <option value="">Select Market</option>
                  {markets.map((market) => (
                    <option key={market.id} value={market.name}>
                      {market.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={styles.formActions}>
            <button onClick={handleAdd} style={styles.saveButton}>CREATE USER</button>
            <button onClick={handleCancelAdd} style={styles.cancelButton}>CANCEL</button>
          </div>
        </div>
      )}

      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <div style={styles.headerCell}>Email</div>
          <div style={styles.headerCell}>Role</div>
          <div style={styles.headerCell}>Assigned Market</div>
          <div style={styles.headerCell}>Actions</div>
        </div>

        {users.map((user) => (
          <div key={user.id} style={styles.tableRow}>
            {editingId === user.id ? (
              <>
                <div style={styles.tableCell}>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.tableCell}>
                  <select
                    value={editData.role}
                    onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                    style={styles.select}
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div style={styles.tableCell}>
                  {editData.role === 'manager' ? (
                    <select
                      value={editData.assignedMarket}
                      onChange={(e) => setEditData({ ...editData, assignedMarket: e.target.value })}
                      style={styles.select}
                    >
                      <option value="">Select Market</option>
                      {markets.map((market) => (
                        <option key={market.id} value={market.name}>
                          {market.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span style={styles.mutedText}>N/A</span>
                  )}
                </div>
                <div style={styles.tableCell}>
                  <button onClick={() => handleUpdate(user.id)} style={styles.saveButton}>
                    SAVE
                  </button>
                  <button onClick={handleCancelEdit} style={styles.cancelButton}>
                    CANCEL
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={styles.tableCell}>{user.email}</div>
                <div style={styles.tableCell}>
                  <span style={getRoleBadgeStyle(user.role)}>
                    {user.role ? user.role.toUpperCase() : 'N/A'}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  {user.assignedMarket || <span style={styles.mutedText}>N/A</span>}
                </div>
                <div style={styles.tableCell}>
                  <button onClick={() => handleEdit(user)} style={styles.editButton}>
                    EDIT
                  </button>
                  <button onClick={() => handleDelete(user.id, user.email)} style={styles.deleteButton}>
                    DELETE
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {users.length === 0 && !showAddForm && (
        <div style={styles.emptyState}>
          No users found. Click "ADD USER" to create one.
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    color: '#000000'
  },
  addButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: 'Montserrat, sans-serif'
  },
  addForm: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EEEEEE',
    padding: '1.5rem',
    marginBottom: '2rem',
    borderRadius: '2px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#333333',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    fontSize: '14px',
    fontFamily: 'Montserrat, sans-serif',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    fontSize: '14px',
    fontFamily: 'Montserrat, sans-serif',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF'
  },
  formActions: {
    display: 'flex',
    gap: '1rem'
  },
  table: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EEEEEE',
    borderRadius: '2px'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  headerCell: {
    padding: '1rem 1.5rem'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
    borderBottom: '1px solid #EEEEEE'
  },
  tableCell: {
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '14px'
  },
  badge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.5px'
  },
  mutedText: {
    color: '#999999',
    fontStyle: 'italic'
  },
  saveButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    fontFamily: 'Montserrat, sans-serif'
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    border: '1px solid #000000',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    fontFamily: 'Montserrat, sans-serif'
  },
  editButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    fontFamily: 'Montserrat, sans-serif'
  },
  deleteButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#FFFFFF',
    color: '#666666',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    fontFamily: 'Montserrat, sans-serif'
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '14px',
    color: '#666666'
  },
  errorMessage: {
    backgroundColor: '#FEE',
    border: '1px solid #FCC',
    padding: '1rem',
    marginBottom: '1.5rem',
    borderRadius: '2px',
    color: '#C00',
    fontSize: '14px'
  },
  successMessage: {
    backgroundColor: '#EFE',
    border: '1px solid #CFC',
    padding: '1rem',
    marginBottom: '1.5rem',
    borderRadius: '2px',
    color: '#060',
    fontSize: '14px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#666666',
    fontSize: '14px',
    border: '1px dashed #EEEEEE',
    borderRadius: '2px'
  }
};

export default UserManagement;
