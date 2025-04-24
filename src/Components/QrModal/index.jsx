import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import "./style.css";
import KebabLogo from "../../assets/svg/KebabLogo.svg";
import { useTranslation } from 'react-i18next';

export default function QrModal({ isOpen, onClose, restaurantId }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const modalRef = useRef(null);

    // Format the link to include restaurant information in startapp parameter
    // Using restaurant_id as the start parameter

    // this is for QA environment
    const telegramBotLink = `https://t.me/T1998_bot/qa_web?startapp=${restaurantId}`;


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="qr-modal-overlay">
            <div ref={modalRef} className="qr-modal-container animate-in">
                <button
                    className="close-btn"
                    onClick={onClose}
                    aria-label="Close modal">
                    ×
                </button>
                {/* <h2 className="modal-title d-none">Scan QR</h2> */}
                <div className="qr-code-wrapper mt-3">
                    <div className="qr-code-container">
                        <QRCodeCanvas
                            id="qr-gen"
                            value={telegramBotLink}
                            size={220}
                            level="H"
                            includeMargin={true}
                            className="qr-code"
                            bgColor="#ffffff"
                            fgColor="#2e2e2e"
                        />
                        <img
                            src={KebabLogo}
                            alt="QR Logo"
                            className="qr-logo"
                        />
                    </div>
                </div>

                <div className="button-group">
                    <CopyToClipboard
                        text={telegramBotLink}
                        onCopy={() => {
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}>
                        <button className="btn btn-copy">
                            <span className="copy-text d-flex align-items-center justify-content-center">
                                {copied ? t('qrCode.copied') : t('qrCode.copy')}
                            </span>
                        </button>
                    </CopyToClipboard>
                </div>
            </div>
        </div>
    );
}