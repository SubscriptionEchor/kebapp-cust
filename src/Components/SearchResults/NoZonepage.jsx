import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import './style.css';

export const NotFound = () => {
const { t } = useTranslation();
    const navigate = useNavigate()
    
    return (
        <div className="d-flex align-items-center p-5 justify-content-center not-found-container">
            <div className="text-center">
                <p className="lead mb-4 text-black">
                    {t('common.outsidezone')}
                </p>
                <p onClick={() => navigate(-1)} className="btn btn-secondary btn-lg">
                    {t('common.Goback')}
                </p>
            </div>
        </div>
    );
};
