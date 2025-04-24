import React, { useContext } from 'react';
import './styles.css';
import Mail from '../../assets/svg/mail.svg';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'
import { routeName } from '../../Router/RouteName';
import { config } from '../../config';
import { BootstrapContext } from '../../Context/Bootstrap';

const ContactUs = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { bootstrapData } = useContext(BootstrapContext);

    return (
        <div className='contact-component pd-horizontal py-4 slide-up'>
            <p className='xl-fs semiBold-fw text-black'>{t('contactUs.supportCenter')}</p>
            <div className='p-4 mailbox mt-4'>
                <div className='mailIcon'>
                    <img src={Mail} alt="mail" width={24} height={24} />
                </div>
                <div>
                    <p className='xxl-fs semiBold-fw supportContentTextColor'>{t("contactUs.reachoutTitle")}</p>
                    <p className='s-fs normal-fw text-black'>{t("contactUs.reactoutDescription")}</p>
                    <p className='l-fs semiBold-fw supportContentTextColor mt-4'>{config?.CONTACT_EMAIL}</p>
                </div>
            </div>
            <p className='m-fs light-fw text-center px-4 mt-3' style={{ color: "rgba(89, 87, 78, 1)" }}>{t("common.termsLine1")} <span className='text-black' style={{ textDecorationLine: "underline" }} onClick={() => navigate(routeName.TERMSANDCONDITION, { state: { url: bootstrapData?.activeConsentDocData?.linkedDocuments[1]?.docPublicLink } })}>{t("common.tnc")}</span> and <span className='text-black' style={{ textDecorationLine: "underline" }} onClick={() => navigate(routeName.TERMSANDCONDITION, { state: { url: bootstrapData?.activeConsentDocData?.linkedDocuments[0]?.docPublicLink } })}>{t("common.privacyPolicy")}</span>. {t("common.termsLine2")}</p>
        </div>
    );
};

export default ContactUs;