import React from 'react';

const LoadingModal = ({ visible = false, text = 'Fetching data' }) => {
    if (!visible) return null;
    return (
        <div className="loading-modal-overlay" role="status" aria-live="polite">
            <div className="loading-modal">
                <div className="spinner" aria-hidden="true"></div>
                <div className="loading-text">{text}</div>
            </div>
            <style>{`
                .loading-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 10000; }
                .loading-modal { background: white; padding: 24px 32px; border-radius: 8px; display: flex; align-items: center; gap: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
                .loading-text { font-size: 16px; font-weight: 600; }
                .spinner { width: 36px; height: 36px; border-radius: 50%; border: 4px solid #e6e6e6; border-top-color: #3b82f6; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default LoadingModal;
