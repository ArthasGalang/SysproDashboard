import React, { useState } from 'react';
import DatabaseOptionsModal from './DatabaseOptionsModal';

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
  const arrowDownIcon = (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="22" fill="#fff" />
      <path d="M22 14v16M22 30l-8-8M22 30l8-8" stroke="#666" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  // Animation styles
  const transition = 'all 0.35s cubic-bezier(.4,0,.2,1)';
  const panelStyle = {
    position: 'fixed',
    right: '2rem',
    bottom: '2rem',
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
    bottom: '2rem',
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
        {/* Arrow icon (no fade in) */}
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
            {arrowDownIcon}
          </div>
        )}
      </div>
      {/* Database button (slides out) */}
      {showDatabase && (
        <div
          style={{
            position: 'fixed',
            right: '2rem',
            bottom: '2rem',
            zIndex: 999,
            animation: 'slideOut 0.35s forwards',
          }}
        >
          <div style={{
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
          }} onClick={() => setShowModal(true)}>
            {databaseIcon}
          </div>
        </div>
      )}
      {/* Database Options Modal */}
      {showModal && (
        <DatabaseOptionsModal onChange={() => setShowModal(false)} />
      )}
    </>
  );
};

export default FloatingButton;
