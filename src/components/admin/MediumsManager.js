import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const MediumsManager = () => {
  const [mediums, setMediums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newMedium, setNewMedium] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadMediums();
  }, []);

  const loadMediums = async () => {
    setLoading(true);
    setError('');
    try {
      const querySnapshot = await getDocs(collection(db, 'mediums'));
      const mediumsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMediums(mediumsList);
    } catch (err) {
      setError('Error loading mediums: ' + err.message);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newMedium.trim()) {
      setError('Medium name is required');
      return;
    }

    setError('');
    setSuccess('');
    try {
      await addDoc(collection(db, 'mediums'), {
        name: newMedium.trim(),
        createdAt: new Date().toISOString()
      });
      setSuccess('Medium added successfully');
      setNewMedium('');
      setShowAddForm(false);
      loadMediums();
    } catch (err) {
      setError('Error adding medium: ' + err.message);
    }
  };

  const handleEdit = (medium) => {
    setEditingId(medium.id);
    setEditName(medium.name);
    setError('');
    setSuccess('');
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) {
      setError('Medium name is required');
      return;
    }

    setError('');
    setSuccess('');
    try {
      await updateDoc(doc(db, 'mediums', id), {
        name: editName.trim(),
        updatedAt: new Date().toISOString()
      });
      setSuccess('Medium updated successfully');
      setEditingId(null);
      setEditName('');
      loadMediums();
    } catch (err) {
      setError('Error updating medium: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete medium "${name}"?`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await deleteDoc(doc(db, 'mediums', id));
      setSuccess('Medium deleted successfully');
      loadMediums();
    } catch (err) {
      setError('Error deleting medium: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setError('');
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewMedium('');
    setError('');
  };

  if (loading) {
    return <div style={styles.loading}>Loading mediums...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Mediums Management</h3>
        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} style={styles.addButton}>
            + ADD MEDIUM
          </button>
        )}
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}
      {success && <div style={styles.successMessage}>{success}</div>}

      {showAddForm && (
        <div style={styles.addForm}>
          <input
            type="text"
            value={newMedium}
            onChange={(e) => setNewMedium(e.target.value)}
            placeholder="Enter medium name"
            style={styles.input}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div style={styles.formActions}>
            <button onClick={handleAdd} style={styles.saveButton}>SAVE</button>
            <button onClick={handleCancelAdd} style={styles.cancelButton}>CANCEL</button>
          </div>
        </div>
      )}

      <div style={styles.list}>
        {mediums.map((medium) => (
          <div key={medium.id} style={styles.card}>
            {editingId === medium.id ? (
              <div style={styles.editForm}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={styles.rowInput}
                  onKeyPress={(e) => e.key === 'Enter' && handleUpdate(medium.id)}
                  autoFocus
                />
                <div style={styles.cardActions}>
                  <button onClick={() => handleUpdate(medium.id)} style={styles.saveButton}>
                    SAVE
                  </button>
                  <button onClick={handleCancelEdit} style={styles.cancelButton}>
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.cardContent}>
                <h4 style={styles.mediumName}>{medium.name}</h4>
                <div style={styles.cardActions}>
                  <button onClick={() => handleEdit(medium)} style={styles.editButton}>
                    EDIT
                  </button>
                  <button onClick={() => handleDelete(medium.id, medium.name)} style={styles.deleteButton}>
                    DELETE
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {mediums.length === 0 && !showAddForm && (
        <div style={styles.emptyState}>
          No mediums found. Click "ADD MEDIUM" to create one.
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
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    fontSize: '14px',
    fontFamily: 'Montserrat, sans-serif',
    marginBottom: '1rem',
    boxSizing: 'border-box'
  },
  formActions: {
    display: 'flex',
    gap: '1rem'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'center'
  },
  cardContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: '1rem'
  },
  mediumName: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    color: '#000000'
  },
  cardActions: {
    display: 'flex',
    gap: '0.75rem'
  },
  editForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    width: '100%'
  },
  rowInput: {
    flex: 1,
    minWidth: 0,
    padding: '0.75rem',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    fontSize: '14px',
    fontFamily: 'Montserrat, sans-serif',
    boxSizing: 'border-box'
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

export default MediumsManager;
