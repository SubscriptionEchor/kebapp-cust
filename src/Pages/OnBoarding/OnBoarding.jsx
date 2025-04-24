import React, { useState, useEffect, useRef, useContext } from 'react';
import './style.css';
import KebabLogo from '../../assets/svg/KebabLogo.svg';
import LanguageIcon from '../../assets/svg/language.svg';
import { useNavigate } from 'react-router-dom';
import Loader from '../../Components/Loader/Loader';
import { routeName } from '../../Router/RouteName';
import { useTranslation } from 'react-i18next';
import { LOCALSTORAGE_NAME } from '../../constants/enums';
import { Context } from '../../Context/Context';
import { BootstrapContext } from '../../Context/Bootstrap';
import { round } from 'lodash';
import { recordConsent } from '../../apollo/server';
import { gql, useMutation } from '@apollo/client';
import { showErrorToast } from '../../Components/Toast';
import Spinner from '../../Components/Spinner/Spinner';
import UserContext from "../../Context/User";

const TOGGLECONSENT = gql`${recordConsent}`;

const Onboarding = () => {
    const { bootstrapData } = useContext(BootstrapContext)
    const { profile } = useContext(UserContext)
    const { t, i18n } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isBtnLoader, setIsBtnLoader] = useState(false);
    const [screens, setScreens] = useState([]);
    const [isCompliance, setIsCompliance] = useState(false);
    const [isAlreadyComplianceExists, setIsAlreadyComplianceExists] = useState(false);
    const navigate = useNavigate()

    const [toggleConsentMutation] = useMutation(TOGGLECONSENT);

    // Language dropdown state and ref for outside click detection
    const [isLangDropdownOpen, setLangDropdownOpen] = useState(false);
    const langDropdownRef = useRef(null);

    // Supported languages with labels from translations
    const languages = [
        { code: "en", label: t('language.english') },
        { code: "tr", label: t('language.turkish') },
        { code: "de", label: t('language.german') },
    ];

    useEffect(() => {
        // Load Onboarding data from localStorage
        let screenData = localStorage.getItem(LOCALSTORAGE_NAME.ONBOARDING_DATA);
        screenData = JSON.parse(screenData);
        if (screenData) {
            setScreens(screenData);
            setLoading(false);
        }
        const consentResult = profile?.consentInfo?.find(consent => consent.docVersionId === bootstrapData?.activeConsentDocData?.docVersionId);
        if (consentResult) {
            setIsAlreadyComplianceExists(true);
            setIsCompliance(true);
        }
    }, []);

    useEffect(() => {
        // Prevent scrolling on the onboarding screen
        const preventDefault = (e) => e.preventDefault();
        window.addEventListener('touchmove', preventDefault, { passive: false });
        return () => window.removeEventListener('touchmove', preventDefault);
    }, []);

    // Restore selected language from localStorage on mount
    useEffect(() => {
        const storedLang = localStorage.getItem('selectedLanguage');
        if (storedLang) {
            i18n.changeLanguage(storedLang);
        }
    }, [i18n]);

    // Close dropdown when clicking outside the dropdown container
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
                setLangDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const handleNext = async () => {
        if (!isCompliance) return showErrorToast(t("onboarding.complianceError"));
        if (currentIndex == 0 && !isAlreadyComplianceExists) {
            const response = await handleAgree();
            if (!response) {
                return;
            }
        }
        if (currentIndex < screens.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            navigate(routeName.PHONE_NUMBER_VERIFICATION);
        }
    };

    const toggleLanguageDropdown = () => {
        setLangDropdownOpen((prev) => !prev);
    };

    // Language change function (same as in your Profile code)
    const handleLanguageChange = async (langCode) => {

        try {
            await i18n.changeLanguage(langCode);
            localStorage.setItem('selectedLanguage', langCode);
            setLangDropdownOpen(false);
            console.log("Language changed successfully to:", langCode, "Current language:", i18n.language);
        } catch (error) {
            console.error("Error changing language:", error);
        }
    };

    const handleAgree = async () => {
        setIsBtnLoader(true);
        try {
            const { data, errors } = await toggleConsentMutation({
                variables: { docVersionId: bootstrapData?.activeConsentDocData?.docVersionId }
            });
            return true;
        } catch (error) {
            console.log(error);
            showErrorToast(error?.graphQLErrors?.[0]?.message || t("home.consentError"));
            return false;
        } finally {
            setIsBtnLoader(false);
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="onboarding-container">
            {screens.map((_, index) => (
                <React.Fragment key={index}>
                    {currentIndex !== 0 ? (
                        <div
                            className="onboarding-screen"
                            style={{ backgroundImage: `url(${screens[currentIndex].image})` }}
                        >
                            <div className="overlay">
                                <div className="onboarding-header">
                                    {currentIndex !== screens.length - 1 && (
                                        <button
                                            onClick={() => navigate(routeName.PHONE_NUMBER_VERIFICATION)}
                                            className="skip-button m-fs bold-fw"
                                        >
                                            {t("onboarding.skip")}
                                        </button>
                                    )}
                                </div>
                                <div className="content">
                                    <div className="d-flex flex-row align-items-center">
                                        <img src={KebabLogo} alt="Kebab Logo" width="58" height="58" />
                                        <p className="app-title goldman-bold mx-3 my-4 normal-fw">
                                            {t("onboarding.kebapp")}
                                        </p>
                                    </div>
                                    <p className="screen-title bold-fw">
                                        {t(screens[currentIndex].titleKey)}
                                    </p>
                                    <p className="my-4">
                                        {t(screens[currentIndex].descriptionKey)}
                                    </p>
                                    <button
                                        onClick={handleNext}
                                        className="action-button w-100 l-fs semiBold-fw text-black"
                                    >
                                        {t(screens[currentIndex].buttonTextKey)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="onboarding-screen-new pd-horizontal"
                            style={{ background: "linear-gradient(180deg, #0D1E2E 0%, #1E4069 100%)" }}
                        >
                            <div className="d-flex  justify-content-between my-2">
                                <div className="d-flex align-items-center">
                                    <img src={KebabLogo} alt="Kebab Logo" width={50} height={50} />
                                    <p className="xl-fs semiBold-fw text-white ps-2">
                                        {t("onboarding.kebappChefs")}
                                    </p>
                                </div>
                                {/* Language Dropdown */}
                                <div
                                    className="position-relative d-flex align-items-center"
                                    ref={langDropdownRef}
                                    style={{ position: 'relative' }}
                                >
                                    <div
                                        className="border border-2 rounded"
                                        onClick={toggleLanguageDropdown}
                                        style={{
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            padding: "8px 12px"
                                        }}
                                    >
                                        <img src={LanguageIcon} alt="Language Icon" width={15} height={15} />
                                        <span style={{ fontSize: 12, marginLeft: "6px", color: "#fff" }}>
                                            {languages.find(lang => i18n.language.startsWith(lang.code))?.label || "Select Language"}
                                        </span>
                                    </div>
                                    {isLangDropdownOpen && (
                                        <div
                                            onClick={(e) => {
                                                e?.preventDefault();
                                                e.stopPropagation()
                                            }}
                                            onMouseDown={(e) => {
                                                e?.preventDefault();
                                                e.stopPropagation()
                                            }}
                                            style={{
                                                position: "absolute",
                                                top: "100%",
                                                right: 0,
                                                marginTop: "5px",
                                                zIndex: 9999,
                                                minWidth: "100px",
                                                borderRadius: "8px",
                                                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                                                backgroundColor: "#fff",
                                                overflow: "hidden",
                                                padding: '4px 0px'
                                            }}
                                        >
                                            {languages.map(lang => (
                                                <div
                                                    key={lang.code}
                                                    onClick={(e) => {
                                                        e?.preventDefault();
                                                        e.stopPropagation()
                                                        handleLanguageChange(lang.code)
                                                    }}
                                                    style={{
                                                        textAlign: "center",
                                                        padding: "4px 8px",
                                                        cursor: "pointer",
                                                        whiteSpace: "nowrap",
                                                        backgroundColor: "#fff",
                                                        color: "#333"
                                                    }}
                                                >
                                                    {lang.label}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="screen-title bold-fw">
                                    {t(screens[currentIndex].titleKey)}
                                </p>
                                <p className="mt-2 mb-1 xl-fs light-fw text-white">
                                    {t(screens[currentIndex].descriptionKey)}
                                </p>
                            </div>
                            <img className="onboardImg" src={screens[currentIndex].image} alt="img" />
                            <div>
                                <div className="d-flex justify-content-between ">
                                    <input type='checkbox' className='checkbox' checked={isCompliance} onClick={() => setIsCompliance(prev => !prev)} />
                                    <p
                                        className="m-fs light-fw px-2 "
                                        style={{ color: "rgba(255, 255, 255, 0.7)" }}
                                    >
                                        {t("common.termsLine1")}{" "}
                                        <span
                                            className="text-white"
                                            style={{ textDecorationLine: "underline" }}
                                            onClick={() => navigate(routeName.TERMSANDCONDITION, { state: { url: bootstrapData?.activeConsentDocData?.linkedDocuments[0]?.docPublicLink } })}
                                        >
                                            {t("common.tnc")}
                                        </span>{" "}
                                        {t("onboarding.and")}{" "}
                                        <span
                                            className="text-white"
                                            style={{ textDecorationLine: "underline" }}
                                            onClick={() => navigate(routeName.TERMSANDCONDITION, { state: { url: bootstrapData?.activeConsentDocData?.linkedDocuments[1]?.docPublicLink } })}
                                        >
                                            {t("common.privacyPolicy")}
                                        </span>
                                        . {t("common.termsLine2")}
                                    </p>
                                </div>
                                <button
                                    onClick={handleNext}
                                    className="action-button mt-2 w-100 l-fs semiBold-fw text-black"
                                    style={{ opacity: isCompliance ? 1 : 0.5 }}
                                >
                                    {isBtnLoader ? <Spinner color="#000" size="24px" /> : <p>
                                        {t(screens[currentIndex].buttonTextKey)}
                                    </p>}
                                </button>
                            </div>
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default Onboarding;
