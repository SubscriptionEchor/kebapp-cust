import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PhoneNumberUtil } from 'google-libphonenumber';
import CheckSquare from '../../assets/svg/CheckSquare.svg';
import UnCheckSquare from '../../assets/svg/UnCheckSquare.svg';
import './styles.css';
import { useNavigate } from 'react-router-dom';
import { routeName } from '../../Router/RouteName';
import { useMutation } from '@apollo/client';
import { sendOtpToPhoneNumber, ValidatePhoneOtp } from '../../apollo/server';
import Spinner from '../../Components/Spinner/Spinner';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import LottieAnimation from '../../Components/LottieAnimation/LottieAnimation';
import Success from "../../assets/Lottie/Success.json"
import { showErrorToast, showSuccessToast } from '../../Components/Toast';

const phoneUtil = PhoneNumberUtil.getInstance();

const TimerDisplay = ({ seconds, t }) => {
    // Format seconds into hours, minutes, and seconds
    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const remainingSeconds = totalSeconds % 60;

        const formattedHours = hours < 10 ? `0${hours}` : hours;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

        return hours > 0
            ? `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
            : `${formattedMinutes}:${formattedSeconds}`;
    };

    return (
        <span className="semiBold-fw l-fs ms-2" style={{ color: '#4D7C0F' }}>
            {t('phoneVerification.otpInput.retryIn', {
                seconds: formatTime(seconds)
            })}
        </span>
    );
};

const PhoneInputStep = ({ phoneNumber, setPhoneNumber, termsAccepted, setTermsAccepted, onNext, loader }) => {
    const { t } = useTranslation();

    return (
        <>
            <p className='page-title bold-fw'>{t('phoneVerification.title')}</p>
            <p className='s-fs normal-fw page-description my-2'>
                {t('phoneVerification.description')}
            </p>

            <PhoneInput
                placeholder={t('phoneVerification.phoneInput.placeholder')}
                defaultCountry="de"
                value={phoneNumber}
                onChange={phone => {
                    setPhoneNumber(phone);
                }}
                inputStyle={{
                    height: '3rem',
                    width: '100%',
                    boxShadow: 'none',
                    borderTopRightRadius: '0.75rem',
                    borderBottomRightRadius: '0.75rem',
                }}
            />

            <div className='mt-4'>
                <button
                    style={{ opacity: phoneNumber ? 1 : 0.5 }}
                    className="otp-button w-100 l-fs semiBold-fw"
                    disabled={!phoneNumber}
                    onClick={onNext}
                >
                    {loader ? <Spinner color="white" size="24px" /> : t('phoneVerification.phoneInput.sendOtp')}
                </button>
            </div>
        </>
    );
};

const OtpInputStep = ({ phoneNumber, onVerificationSuccess, seconds, setSeconds, isTimerActive, setIsTimerActive }) => {
    const { t } = useTranslation();
    const [otp, setOtp] = useState(['', '', '', '']);
    const [validateOtp, { loading: validationLoading }] = useMutation(ValidatePhoneOtp);
    const [sendOtpToPhoneNumberResponse] = useMutation(sendOtpToPhoneNumber);

    useEffect(() => {
        let interval;
        if (isTimerActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds((prev) => prev - 1);
            }, 1000);
        } else if (seconds === 0) {
            setIsTimerActive(false);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, seconds]);

    const handleResend = async () => {
        setOtp(['', '', '', '']);
        try {
            const response = await sendOtpToPhoneNumberResponse({
                variables: { phone: phoneNumber }
            });
            if (response?.data?.sendOtpToPhoneNumber?.result) {
                setSeconds(response?.data?.sendOtpToPhoneNumber?.retryAfter);
                setIsTimerActive(true);
                showSuccessToast(t('toasts.Otpsentsuccessfully'));
            } else {
                showErrorToast(response?.data?.sendOtpToPhoneNumber?.message || 'Error sending OTP');
                console.log('Error resending OTP:', response?.data?.message);
            }
        } catch (err) {
            console.error('Error resending OTP:', err);
        }
    };

    const handleOtpInput = (value, index) => {
        if (/^\d*$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            if (value && index < 3) {
                document.getElementById(`otp-${index + 1}`).focus();
            }
        }
    };

    const handleVerifyOtp = async () => {
        try {
            const response = await validateOtp({ variables: { validatePhoneOtpOtp2: otp.join('') } });
            if (response?.data?.validatePhoneOtp?.result) {
                showSuccessToast(t('toasts.OTPvalidatedsuccessfully'));
                onVerificationSuccess();
            } else {
                 showErrorToast(t('toasts.invalidotp'));
                setOtp(['', '', '', '']);
                // setSeconds(0);
                console.error('Error:', response?.data?.validatePhoneOtp?.message);
            }
        } catch (err) {
            showErrorToast('Error validating OTP');
            console.error('Error validating OTP:', err);
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                document.getElementById(`otp-${index - 1}`).focus();
            } else {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    return (
        <>
            <p className='page-title bold-fw'>{t('phoneVerification.otpInput.title')}</p>
            <p className='s-fs normal-fw page-description my-2'>
                {t('phoneVerification.otpInput.description', { phoneNumber })}
            </p>
            <div className="otp-container">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        id={`otp-${index}`}
                        type="tel"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpInput(e.target.value, index)}
                        className="otp-input l-fs semiBold-fw"
                        autoComplete="one-time-code"
                        onKeyDown={(e) => handleKeyDown(e, index)}
                    />
                ))}
            </div>

            <div>
                {isTimerActive ? (
                    <p style={{ color: '#59574E' }} className="normal-fw l-fs">
                        {t('phoneVerification.otpInput.noOtp')}{' '}
                        <TimerDisplay seconds={seconds} t={t} />
                    </p>
                ) : (
                    <div onClick={handleResend}>
                        <p style={{ color: '#59574E' }} className="normal-fw l-fs">
                            {t('phoneVerification.otpInput.noOtp')}{' '}
                            <span className="semiBold-fw l-fs" style={{ color: '#4D7C0F', textDecorationLine: 'underline' }}>
                                {t('phoneVerification.otpInput.resendSms')}
                            </span>
                        </p>
                    </div>
                )}
            </div>

            <div className='mt-4'>
                <button
                    style={{
                        backgroundColor: otp.join('').length >= 1 ? '#EDCC27' : 'rgba(255,255,255,0.8)',
                        borderColor: otp.join('').length >= 1 ? '' : '#59574E',
                    }}
                    className="verify-button w-100 l-fs semiBold-fw"
                    disabled={otp.join('').length !== 4 || validationLoading}
                    onClick={async () => {
                        if (otp.join('').length === 4) {
                            handleVerifyOtp();
                        }
                    }}
                >
                    {validationLoading ? <Spinner color="white" size="24px" /> : t('phoneVerification.otpInput.verifyOtp')}
                </button>
            </div>
        </>
    );
};

const SuccessStep = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (window.clearNavigationHistory) {
                window.clearNavigationHistory();
            }
            navigate(routeName.EMAIL_VERIFICATION);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <div className='d-flex align-items-center justify-content-center'>
                <LottieAnimation
                    animationData={Success}
                    width={300}
                    height={300}
                    autoplay={true}
                    loop={true}
                />
            </div>
            <p className='bold-fw success-text'>
                {t('phoneVerification.success.message')}
            </p>
        </>
    );
};

const PhoneNumberVerification = () => {
    const [sendOtpToPhoneNumberResponse, { loading }] = useMutation(sendOtpToPhoneNumber);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [step, setStep] = useState(1);
    const [seconds, setSeconds] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const { t } = useTranslation();

    // Validate phone number length & country using google-libphonenumber
    const handleSendOtp = async () => {
        if (!phoneNumber) {
            showErrorToast(t('phoneVerification.invalidNumber'));
            return;
        }

        try {
            // Parse the phone number with google-libphonenumber
            const parsedNumber = phoneUtil.parseAndKeepRawInput(phoneNumber);

            // Check if the phone number is valid for its region
            if (!phoneUtil.isValidNumber(parsedNumber)) {
                showErrorToast(t('phoneVerification.invalidNumber'));
                return;
            }

            // If valid, proceed with sending OTP
            const response = await sendOtpToPhoneNumberResponse({
                variables: { phone: phoneNumber },
            });
            if (response?.data?.sendOtpToPhoneNumber?.result) {
                setSeconds(response?.data?.sendOtpToPhoneNumber?.retryAfter);
                setIsTimerActive(true);
                showSuccessToast(t('toasts.Otpsentsuccessfully'));
                setStep(2);
            } else {
                showErrorToast(response?.data?.sendOtpToPhoneNumber?.message || 'Error sending OTP');
                console.log('Error sending OTP:', response?.data?.message);
            }
        } catch (err) {
            // If parse fails or any error
            showErrorToast(t('phoneVerification.invalidNumber'));
            console.error('Error sending OTP:', err);
        }
    };

    return (
        <div className={`otp-verification-component p-4 flex-column ${step === 3 ? 'justify-content-center' : ''}`}>
            {step === 1 && (
                <PhoneInputStep
                    phoneNumber={phoneNumber}
                    setPhoneNumber={setPhoneNumber}
                    termsAccepted={termsAccepted}
                    setTermsAccepted={setTermsAccepted}
                    loader={loading}
                    onNext={handleSendOtp}
                />
            )}
            {step === 2 && (
                <OtpInputStep
                    phoneNumber={phoneNumber}
                    onVerificationSuccess={() => setStep(3)}
                    seconds={seconds}
                    setSeconds={setSeconds}
                    isTimerActive={isTimerActive}
                    setIsTimerActive={setIsTimerActive}
                />
            )}
            {step === 3 && <SuccessStep />}
        </div>
    );
};

export default PhoneNumberVerification;