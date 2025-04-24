import React, { useEffect } from 'react';
import './styles.css';

const Popup = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
}) => {

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        }
        else {
            document.body.style.overflow = "scroll"
        }
    }, [isOpen])

    if (!isOpen) return null;
    return (
        <div className="popup-overlay">
            <div className="popup-content">
                <h3 className="popup-title">{title}</h3>
                <p className="popup-message">{message}</p>
                <div className="popup-buttons">
                    <button
                        className="popup-button cancel-button"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                    <button
                        className="popup-button confirm-button"
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Popup;