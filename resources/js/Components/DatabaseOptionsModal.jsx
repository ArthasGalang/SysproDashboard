import React, { useState } from 'react';
import CryptoJS from 'crypto-js';

const modalStyle = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: '#fff',
  borderRadius: '1.2rem',
  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
  padding: '1.2rem 1.5rem',
  minWidth: '260px',
  zIndex: 2000,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};
const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  margin: '0.3rem 0 0.7rem 0',
  borderRadius: '0.7rem',
  border: '1.5px solid #222',
  fontSize: '1rem',
  outline: 'none',
};
const labelStyle = {
  fontSize: '1rem',
  fontWeight: 500,
  marginBottom: '0.15rem',
  textAlign: 'center',
};
const buttonStyle = {
  marginTop: '1rem',
  padding: '0.5rem 1.5rem',
  borderRadius: '0.4rem',
  background: '#38b6ff',
  color: '#fff',
  fontSize: '1rem',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 500,
};

// Helper to hash password for display
function hashPassword(password) {
  if (!password) return '';
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

const DatabaseOptionsModal = ({ onChange }) => {
  // Prefill from .env
  const env = {
    DB_DATABASE: 'SysproEdu1',
    DB_USERNAME: 'jantest',
    DB_PASSWORD: 'pass',
  };
  const [database, setDatabase] = useState(env.DB_DATABASE);
  const [login, setLogin] = useState(env.DB_USERNAME);
  const [password, setPassword] = useState(env.DB_PASSWORD);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onChange) {
      onChange({ database, login, password });
    }
  };

  return (
    <div style={modalStyle}>
      <button
        type="button"
        onClick={() => onChange && onChange()}
        style={{
          position: 'absolute',
          top: '0.7rem',
          right: '1rem',
          background: 'transparent',
          border: 'none',
          fontSize: '1.5rem',
          color: '#888',
          cursor: 'pointer',
          zIndex: 10,
        }}
        aria-label="Close"
      >
        &times;
      </button>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 400, marginBottom: '1.5rem', marginTop: '1rem', textAlign: 'center' }}>Database Options</h2>
      <form style={{ width: '100%' }} onSubmit={handleSubmit}>
        <div style={labelStyle}>Database</div>
        <input style={inputStyle} type="text" value={database} onChange={e => setDatabase(e.target.value)} />
        <div style={labelStyle}>Login</div>
        <input style={inputStyle} type="text" value={login} onChange={e => setLogin(e.target.value)} />
        <div style={labelStyle}>Password</div>
        <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <button type="submit" style={buttonStyle}>Change</button>
        </div>
      </form>
    </div>
  );
};

export default DatabaseOptionsModal;
