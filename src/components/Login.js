import React, { useState } from 'react';
import { signIn } from '../firebase/auth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Failed to sign in');
    }
    
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.logoContainer}>
          <img src="/logo.png" alt="Publicis Groupe Africa" style={styles.logo} />
        </div>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Country Budget Report</h1>
          <p style={styles.heroTagline}>Driving your growth through connected creativity</p>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <h2 style={styles.title}>Sign In</h2>
          <p style={styles.subtitle}>Access your budget reporting dashboard</p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>EMAIL ADDRESS</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="your.email@publicis.com"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Montserrat', sans-serif"
  },
  leftPanel: {
    flex: 1,
    backgroundColor: '#000000',
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem 2rem',
    position: 'relative'
  },
  logoContainer: {
    position: 'absolute',
    top: '3rem',
    left: '3rem'
  },
  logo: {
    height: '80px',
    width: 'auto',
    filter: 'brightness(0) invert(1)'
  },
  heroContent: {
    maxWidth: '500px',
    textAlign: 'center'
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '700',
    marginBottom: '1.5rem',
    lineHeight: '1.2',
    letterSpacing: '-0.5px'
  },
  heroTagline: {
    fontSize: '18px',
    fontWeight: '400',
    color: '#EEEEEE',
    lineHeight: '1.6',
    fontStyle: 'italic'
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: '2rem'
  },
  card: {
    width: '100%',
    maxWidth: '440px'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#000000',
    marginBottom: '0.5rem'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666666',
    marginBottom: '2.5rem',
    fontWeight: '400'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  inputGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#333333',
    fontWeight: '600',
    fontSize: '11px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '1px solid #EEEEEE',
    borderRadius: '2px',
    fontSize: '16px',
    fontFamily: "'Montserrat', sans-serif",
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
    outline: 'none'
  },
  button: {
    padding: '1rem',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '2px',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '1px',
    cursor: 'pointer',
    marginTop: '1rem',
    fontFamily: "'Montserrat', sans-serif",
    transition: 'background-color 0.2s ease',
    textTransform: 'uppercase'
  },
  buttonDisabled: {
    backgroundColor: '#666666',
    cursor: 'not-allowed'
  },
  error: {
    backgroundColor: '#FEE',
    color: '#C33',
    padding: '1rem',
    borderRadius: '2px',
    marginBottom: '1.5rem',
    fontSize: '14px',
    border: '1px solid #FCC'
  }
};

export default Login;
