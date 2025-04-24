// components/Home/CompliancePopup.jsx
import React, { memo } from 'react';
import Spinner from '../../Components/Spinner/Spinner';

const CompliancePopup = ({ t, navigate, bootstrapData, handleAgree, btnLoader, routeName }) => {
    return (
        <div className="popup-bg-home fade-in">
            <div className="popup-container-home" onClick={e => e.stopPropagation()}>
                <p className='l-fs normal-fw black-text px-4 mt-3' style={{ lineHeight: 1.8 }}>
                    {t("common.termsLine1")} {t("common.termsLine3")}
                    <span
                        className='text-primary'
                        style={{ textDecorationLine: "underline" }}
                        onClick={() => navigate(routeName.TERMSANDCONDITION, {
                            state: { url: bootstrapData?.activeConsentDocData?.linkedDocuments[1]?.docPublicLink }
                        })}
                    >
                        {t("common.tnc")}
                    </span>
                    {t("onboarding.and")}
                    <span
                        className='text-primary'
                        style={{ textDecorationLine: "underline" }}
                        onClick={() => navigate(routeName.TERMSANDCONDITION, {
                            state: { url: bootstrapData?.activeConsentDocData?.linkedDocuments[0]?.docPublicLink }
                        })}
                    >
                        {t("common.privacyPolicy")}
                    </span>.
                </p>
                <div className='d-flex justify-content-end'>
                    <div style={{ width: "10%" }} />
                    <div className="d-flex align-items-center justify-content-between mt-4">
                        <div style={{ width: "10%" }} />
                        <div className='btn-cancel p-2 px-3' onClick={handleAgree}>
                            {btnLoader ?
                                <Spinner color="#000" size="24px" /> :
                                <p className='l-fs semiBold-fw black-text'>{t('common.agree')}</p>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(CompliancePopup);