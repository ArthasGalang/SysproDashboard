import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
// DatabaseOptionsModal merged here
const dbModalStyle = {
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
const dbInputStyle = {
  width: '100%',
  padding: '0.5rem',
  margin: '0.3rem 0 0.7rem 0',
  borderRadius: '0.7rem',
  border: '1.5px solid #222',
  fontSize: '1rem',
  outline: 'none',
};
const dbLabelStyle = {
  fontSize: '1rem',
  fontWeight: 500,
  marginBottom: '0.15rem',
  textAlign: 'center',
};
const dbButtonStyle = {
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

function hashPassword(password) {
  if (!password) return '';
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

const DatabaseOptionsModal = ({ onChange }) => {
  // Prefill from .env
  const env = {
    DB_DATABASE: 'SysproEdu1',
    DB_USERNAME: 'Impact_Services',
    DB_PASSWORD: 'pass',
  };
  const [database, setDatabase] = React.useState(env.DB_DATABASE);
  const [login, setLogin] = React.useState(env.DB_USERNAME);
  const [password, setPassword] = React.useState(env.DB_PASSWORD);

  // Close modal when clicking outside
  const overlayRef = React.useRef(null);
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      if (onChange) onChange();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onChange) {
      onChange({ database, login, password });
    }
  };

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.25)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={handleOverlayClick}
    >
      <div style={dbModalStyle}>
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
          <div style={dbLabelStyle}>Database</div>
          <input style={dbInputStyle} type="text" value={database} onChange={e => setDatabase(e.target.value)} />
          <div style={dbLabelStyle}>Login</div>
          <input style={dbInputStyle} type="text" value={login} onChange={e => setLogin(e.target.value)} />
          <div style={dbLabelStyle}>Password</div>
          <input style={dbInputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <button type="submit" style={dbButtonStyle}>Change</button>
          </div>
        </form>
      </div>
    </div>
  );
};
// Dashboards modal component
const DashboardsModal = ({ onClose }) => {
  const overlayRef = React.useRef(null);
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      if (onClose) onClose();
    }
  };
  // Dashboard routes
  const dashboards = [
    { label: 'A/R', route: '/ARDB' },
    { label: 'Inventory Valuation', route: '/InvenValDB' },
    { label: 'Purchasing', route: '/PurchasingDB' },
    { label: 'Sales', route: '/SalesDB' },
  ];
  const handleNav = (route) => {
    window.location.href = route;
  };
  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.25)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={handleOverlayClick}
    >
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '2rem 2.5rem',
        minWidth: '320px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        position: 'relative',
      }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>Dashboards</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          {dashboards.map(d => (
            <button
              key={d.route}
              style={modalBtnStyle}
              onClick={() => handleNav(d.route)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
          }}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const modalBtnStyle = {
  padding: '0.75rem 1.5rem',
  fontSize: '1.1rem',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
  background: '#f7f7f7',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'background 0.2s',
};

// Animation keyframes as a style tag
const floatingButtonAnimations = `
@keyframes fadeOut {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes slideOut {
  0% { opacity: 0; transform: translateY(0) scale(0.7); }
  100% { opacity: 1; transform: translateY(-90px) scale(1); }
}
`;

const FloatingButton = () => {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [fadeHamburger, setFadeHamburger] = useState(false);
  const [showArrow, setShowArrow] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDashModal, setShowDashModal] = useState(false);

  // Inject keyframes
  React.useEffect(() => {
    if (!document.getElementById('floating-btn-anim')) {
      const style = document.createElement('style');
      style.id = 'floating-btn-anim';
      style.innerHTML = floatingButtonAnimations;
      document.head.appendChild(style);
    }
  }, []);

  // SVGs for icons (larger)
  const menuIcon = (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="22" fill="#fff" />
      <rect x="14" y="21" width="16" height="3" rx="1.5" fill="#666" />
      <rect x="14" y="27" width="16" height="3" rx="1.5" fill="#666" />
      <rect x="14" y="15" width="16" height="3" rx="1.5" fill="#666" />
    </svg>
  );
  // Tabler Icons database-edit SVG (user provided)
  const databaseIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M4 6c0 1.657 3.582 3 8 3s8 -1.343 8 -3s-3.582 -3 -8 -3s-8 1.343 -8 3" />
      <path d="M4 6v6c0 1.657 3.582 3 8 3c.478 0 .947 -.016 1.402 -.046" />
      <path d="M20 12v-6" />
      <path d="M4 12v6c0 1.526 3.04 2.786 6.972 2.975" />
      <path d="M18.42 15.61a2.1 2.1 0 0 1 2.97 2.97l-3.39 3.42h-3v-3l3.42 -3.39z" />
    </svg>
  );
    // Dashboard icon (Tabler Icons style)
    const dashboardIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  // X (close) icon
  const closeIcon = (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="22" fill="#fff" />
      <line x1="16" y1="16" x2="28" y2="28" stroke="#666" strokeWidth="3" strokeLinecap="round" />
      <line x1="28" y1="16" x2="16" y2="28" stroke="#666" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );

  // Animation styles
  const transition = 'all 0.35s cubic-bezier(.4,0,.2,1)';
  const panelStyle = {
    position: 'fixed',
    right: '2rem',
    bottom: '2.7rem',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(0)' : 'translateY(40px)',
    pointerEvents: open ? 'auto' : 'none',
    transition,
  };
  const buttonStyle = {
    position: 'fixed',
    right: '2rem',
    bottom: '2.7rem',
    zIndex: 1000,
    background: '#fff',
    borderRadius: '50%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    width: '72px',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity: (!open && !hidden) ? 1 : 0,
    transform: (!open && !hidden) ? 'scale(1)' : 'scale(0.7)',
    pointerEvents: (!open && !hidden) ? 'auto' : 'none',
    transition,
  };
  const iconWrapperStyle = {
    width: '56px',
    height: '56px',
    background: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition,
  };

  // Hamburger icon (default and when hidden)
  if (hidden) {
    return (
      <div style={{ ...buttonStyle, opacity: 1, pointerEvents: 'auto', transform: 'scale(1)' }} onClick={() => { setOpen(false); setHidden(false); }}>
        <div style={iconWrapperStyle}>{menuIcon}</div>
      </div>
    );
  }

  // Handle hamburger click: fade out, fade in arrow, slide out database
  const handleHamburgerClick = () => {
    setFadeHamburger(true);
    setShowArrow(true);
    setShowDatabase(true);
  };

  // Handle arrow click: reset all
  const handleArrowClick = () => {
    setOpen(false);
    setHidden(true);
    setFadeHamburger(false);
    setShowArrow(false);
    setShowDatabase(false);
    setTimeout(() => {
      setHidden(false);
    }, 350);
  };

  return (
    <>
      {/* Main floating button container, always visible */}
      <div style={buttonStyle}>
        {/* Hamburger icon (no fade out) */}
        {!fadeHamburger && (
          <div style={{
            ...iconWrapperStyle,
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            margin: 'auto',
            zIndex: 2,
            cursor: 'pointer',
          }} onClick={handleHamburgerClick}>
            {menuIcon}
          </div>
        )}
        {/* X (close) icon */}
        {showArrow && (
          <div style={{
            ...iconWrapperStyle,
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            margin: 'auto',
            zIndex: 3,
            cursor: 'pointer',
          }} onClick={handleArrowClick}>
            {closeIcon}
          </div>
        )}
      </div>
      {/* Database button (slides out) */}
        {showDatabase && (
          <>
            <div
              style={{
                position: 'fixed',
                right: '2rem',
                bottom: '2.7rem',
                zIndex: 999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
              }}
            >
              {/* Dashboard button */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  width: '72px',
                  height: '72px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition,
                  animation: 'slideOut 0.35s forwards',
                }}
                onClick={() => setShowDashModal(true)}
              >
                {dashboardIcon}
              </div>
              {/* Database button */}
              {/* <div
                style={{
                  background: '#fff',
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  width: '72px',
                  height: '72px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition,
                  animation: 'slideOut 0.35s forwards',
                }}
                onClick={() => setShowModal(true)}
              >
                {databaseIcon}
              </div> */}
            </div>
          </>
        )}
      {/* Database Options Modal (merged) */}
      {/* {showModal && (
        <DatabaseOptionsModal onChange={() => setShowModal(false)} />
      )} */}
      {/* Dashboards Modal */}
      {showDashModal && (
        <DashboardsModal onClose={() => setShowDashModal(false)} />
      )}
    </>
  );
};

export default FloatingButton;
