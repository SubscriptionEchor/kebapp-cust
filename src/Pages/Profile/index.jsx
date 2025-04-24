import React, { useContext, useState, useEffect } from 'react';
import './style.css';
import ArrowRight from '../../assets/svg/arrowRight.svg';
import Contact from '../../assets/svg/contact.svg';
import Location from '../../assets/svg/locationBlack.svg';
import Notification from '../../assets/svg/notification.svg';
import UserBlack from '../../assets/svg/userBlack.svg';
import PageTitle from '../../Components/PageTitle';
import { useTranslation } from 'react-i18next';
import { gql, useMutation, useQuery } from '@apollo/client';
import { deleteAccount, profile, toggleUserNotifications } from '../../apollo/server';
import { Context } from '../../Context/Context';
import Loader from '../../Components/Loader/Loader';
import { useNavigate } from 'react-router-dom';
import { routeName } from '../../Router/RouteName';
import Crying from "../../assets/Lottie/Crying.json";
import LottieAnimation from '../../Components/LottieAnimation/LottieAnimation';
import Toggle from 'react-toggle';
import "react-toggle/style.css";
import { showErrorToast, showSuccessToast } from '../../Components/Toast';
import Spinner from '../../Components/Spinner/Spinner';
import './profiledropdown.css';
import { BootstrapContext } from '../../Context/Bootstrap'

const PROFILE = gql`${profile}`;
const TOGGLE_NOTIFICATION = gql`${toggleUserNotifications}`;
const DELETE_ACCOUNT = gql`${deleteAccount}`;

const Profile = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { userDetails, setUserDetails } = useContext(Context);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notificationLoader, setNotificationLoader] = useState(false);
    const { bootstrapData } = useContext(BootstrapContext)

    // State for language dropdown
    const [isLangDropdownOpen, setLangDropdownOpen] = useState(false);

    // Supported languages
    const languages = [
        { code: "en", label: t('language.english') },
        { code: "de", label: t('language.german') },
        { code: "tr", label: t('language.turkish') },
    ];

    // Restore the selected language from localStorage on mount
    useEffect(() => {
        const storedLang = localStorage.getItem("selectedLanguage");
        if (storedLang) {
            i18n.changeLanguage(storedLang);
        }
    }, [i18n]);

    // Toggle language on selection and store selection in localStorage
    const handleLanguageChange = async (langCode) => {
        try {
            await i18n.changeLanguage(langCode);
            localStorage.setItem("selectedLanguage", langCode); // key for selected language
            setLangDropdownOpen(false);
        } catch (error) {
            console.error("Error changing language:", error);
        }
    };



    // console.log(bootstrapData, userDetails, bootstrapData?.activeConsentDocData?.linkedDocuments[1]?.docPublicLink)

    const navItems = [
        {
            itemIcon: UserBlack,
            name: t('profile.details'),
            routeName: routeName.EDITPROFILE,
            actionIcon: ArrowRight,
        },
        {
            itemIcon: Location,
            name: t('profile.addresses'),
            routeName: routeName.SAVEDADDRESS,
            actionIcon: ArrowRight,
        },
        {
            itemIcon: Contact,
            name: t('contactUs.supportCenter'),
            routeName: routeName.CONTACTUS,
            actionIcon: ArrowRight,
        },
        // Uncomment if you want to show notification toggle here
        {
            itemIcon: Notification,
            name: t('profile.notifications'),
            routeName: null,
            actionIcon: null,
        },
    ];

    const [toggleNotificationMutation] = useMutation(TOGGLE_NOTIFICATION);
    const [requestDelete] = useMutation(DELETE_ACCOUNT);

    // Fetch user details
    const { loading } = useQuery(PROFILE, {
        fetchPolicy: "network-only",
        onCompleted: (data) => {
            setUserDetails(data?.profile || {});
        },
        //skip: userDetails
    });

    if (loading) {
        return <Loader />;
    }

    const handleNotification = async (status) => {
        if (notificationLoader) return;
        setNotificationLoader(true);
        try {
            setUserDetails(prevState => ({
                ...prevState,
                notificationEnabled: !status
            }));
            showSuccessToast('Updated successfully');
            await toggleNotificationMutation();
        } catch (error) {
            console.error('Error toggling notification:', error);
            showErrorToast(t('common.failureMessage'))
        }
        setNotificationLoader(false);
    };

    const handleDelete = async () => {
        if (isLoading) return;
        setIsLoading(true);
        const telegram = window?.Telegram?.WebApp;
        await requestDelete()
            .then(() => {
                localStorage.clear();
                setTimeout(async () => {
                    setIsLoading(false);
                    setIsPopupVisible(false);
                    if (telegram) {
                        setUserDetails({});
                        await telegram.close();
                    }
                }, 3000);
            })
            .catch(() => {
                showErrorToast(t('common.failureMessage'))
                setIsLoading(false);
            });
    };


    const onClickTermsAndPrivacy = (url) => {
        const embeddedUrl = url.includes('?') ? `${url}&embedded=true` : `${url}?embedded=true`;
        window.open(embeddedUrl, '_blank');

        // if (window.Telegram && window.Telegram.WebApp) {
        //     const webApp = window.Telegram.WebApp;
        //     webApp.openLink(embeddedUrl, { try_instant_view: false });
        // } else {
        //     window.open(embeddedUrl, '_blank');
        // }
    };
    return (
        <div className='profileComponent bg-white'>
            <PageTitle title={t("screenTitle.profile")} />
            <div className='slide-up'>
                <div
                    className='d-flex align-items-center pd-horizontal py-4'
                    style={{ backgroundColor: "rgba(241, 245, 249, 1)" }}
                >
                    <div className='nameIcon'>
                        <p
                            className='xxl-fs bold-fw text-white'
                            style={{ textTransform: "uppercase" }}
                        >
                            {userDetails?.name?.slice(0, 1)}
                        </p>
                    </div>
                    <div className='ms-3' style={{ width: "75%", flex: 1 }}>
                        <p className='xxl-fs semiBold-fw text-black text-ellipsis'>
                            {userDetails?.name?.slice(0, 8)}...
                        </p>
                        <p className='m-fs normal-fw text-black text-ellipsis'>
                            {userDetails?.email?.slice(0, 15)}..
                        </p>
                    </div>

                    {/* Language Dropdown */}
                    <div
                        className="language-dropdown"
                        style={{
                            marginLeft: "auto",
                            position: "relative",
                            zIndex: 9999 // ensure it's on top
                        }}
                    >
                        <div
                            className="dropdown-toggle"
                            onClick={() => setLangDropdownOpen(!isLangDropdownOpen)}
                            style={{
                                cursor: "pointer",
                                padding: "8px 12px",
                                background: "#fff",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            {/* Show current language label or default */}
                            {languages.find(lang => i18n.language.startsWith(lang.code))?.label || "Select Language"}
                        </div>
                        {isLangDropdownOpen && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    right: 0,
                                    width: "100%",
                                    background: "#fff",
                                    boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                    zIndex: 9999 // keep above everything
                                }}
                            >
                                {languages.map(lang => (
                                    <div
                                        key={lang.code}
                                        className="dropdown-item"
                                        onClick={() => handleLanguageChange(lang.code)}
                                        style={{
                                            padding: "8px 12px",
                                            cursor: "pointer",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {lang.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className='profile-content-area pd-horizontal'>
                    <p className='xl-fs semiBold-fw text-black my-3'>
                        {t('profile.accountSettings')}
                    </p>
                    {navItems.map((el, i) => (
                        <div
                            key={i}
                            className='profile-nav-item'
                            onClick={() => { el?.routeName && navigate(el?.routeName) }}
                        >
                            <div className='d-flex align-items-center'>
                                <img
                                    className='icon-size me-3'
                                    src={el.itemIcon}
                                    alt="icon"
                                />
                                <p className='normal-fw l-fs text-black'>
                                    {el.name}
                                </p>
                            </div>
                            {el.actionIcon && (
                                <img
                                    width={12}
                                    height={12}
                                    src={el.actionIcon}
                                    alt="icon"
                                />
                            )}
                            {!el.actionIcon && (
                                <Toggle
                                    icons={false}
                                    checked={userDetails?.notificationEnabled}
                                    onChange={() => handleNotification(userDetails?.notificationEnabled)}
                                />
                            )}
                        </div>
                    ))}

                    <p className='xl-fs semiBold-fw text-black my-3 mt-4'>{t('profile.others')}</p>
                    <div className='profile-nav-item border-0'
                        onClick={() => navigate(routeName.TERMSANDCONDITION, { state: { url: bootstrapData?.activeConsentDocData?.linkedDocuments[1]?.docPublicLink } })}
                    //  onClick={() => onClickTermsAndPrivacy(bootstrapData?.activeConsentDocData?.linkedDocuments[1]?.docPublicLink)}
                    >
                        <p className='normal-fw l-fs text-black'>{t('profile.agreement')}</p>
                    </div>
                    <div className='profile-nav-item border-0' onClick={() => navigate(routeName.TERMSANDCONDITION, { state: { url: bootstrapData?.activeConsentDocData?.linkedDocuments[0]?.docPublicLink } })}>
                        <p className='normal-fw l-fs text-black'>{t('profile.dataProtections')}</p>
                    </div>
                    <div
                        className='profile-nav-item border-0'
                        onClick={() => setIsPopupVisible(true)}
                    >
                        <p
                            className='normal-fw l-fs'
                            style={{ color: "#D32F2F" }}
                        >
                            {t('profile.dataDelete')}
                        </p>
                    </div>
                </div>
            </div>

            {isPopupVisible && (
                <div
                    className={`popup-bg ${isPopupVisible ? 'fade-in' : 'fade-out'}`}
                    onClick={() => setIsPopupVisible(false)}
                >
                    <div
                        className="popup-container"
                        onClick={e => e.stopPropagation()}
                    >
                        <p className="xl-fs semiBold-fw black-text text-center mt-2">
                            {t('profile.dataDelete')}
                        </p>
                        <div className="d-flex align-items-center justify-content-between mt-4">
                            <div className='btn-confirm' onClick={handleDelete}>
                                {isLoading ? (
                                    <Spinner color="#000" size="24px" />
                                ) : (
                                    <p className='l-fs semiBold-fw black-text'>{t('common.confirm')}</p>
                                )}
                            </div>
                            <div className='btn-cancel px-2 py-2 d-flex justify-content-center' onClick={() => { !isLoading && setIsPopupVisible(false) }} style={{ width: "44%" }}>
                                <p className='l-fs semiBold-fw black-text'>{t('common.cancel')}</p>
                            </div>
                        </div>
                    </div >
                </div >
            )}
        </div >
    );
};

export default Profile;
