import React, { useState, useEffect } from 'react';
import './styles.css';
import { useTranslation } from 'react-i18next';
import { validateEmail } from '../../Utils';
import { useNavigate } from 'react-router-dom';
import { routeName } from '../../Router/RouteName';
import { useMutation } from '@apollo/client';
import { sendOtpToEmail, ValidateEmailOtp } from '../../apollo/server';
import Spinner from '../../Components/Spinner/Spinner';
import LottieAnimation from '../../Components/LottieAnimation/LottieAnimation';
import Success from "../../assets/Lottie/Success.json"
import { showErrorToast, showSuccessToast } from '../../Components/Toast';

/** A small component to display the remaining time in MM:SS format */
const TimerDisplay = ({ seconds, t }) => {
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
            {t('emailVerification.otpInput.retryIn', {
                seconds: formatTime(seconds)
            })}
        </span>
    );
};

const EmailInputComponent = ({ email, setEmail, setStep, handleResend }) => {
    const { t } = useTranslation();
    const [errorMessage, setErrorMessage] = useState('');
    const [sendOtp, { loading }] = useMutation(sendOtpToEmail);

    const handleSendOtp = async () => {
        if (!email) {
            return;
        }

        if (!validateEmail(email)) {
            setErrorMessage(t('emailVerification.invalidEmail'));
            return;
        }

        try {
            const response = await sendOtp({ variables: { email } })

            if (response?.data?.sendOtpToEmail?.result) {
                handleResend(response?.data?.sendOtpToEmail?.retryAfter);
                showSuccessToast(t('toasts.Otpsentsuccessfully'));
                setStep(2);
                setErrorMessage('');
            } else {
                const serverMsg = response?.data?.sendOtpToEmail?.message || 'Error sending OTP';
                setErrorMessage(serverMsg);
                showErrorToast(serverMsg);
            }
        } catch (err) {
            console.error('Error sending OTP:', err);
            setErrorMessage('Error sending OTP');
            showErrorToast('Error sending OTP');
        }
    };

    return (
        <>
            <p className='page-title bold-fw'>{t('emailVerification.title')}</p>
            <p className='s-fs normal-fw page-description my-2'>{t('emailVerification.description')}</p>

            <input
                type="email"
                placeholder={t('emailVerification.emailInput.placeholder')}
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage('');
                }}
                className="email-input l-fs"
                required
                autoFocus
            />

            {errorMessage && (
                <p className='mt-2' style={{ color: 'red' }}>
                    {errorMessage}
                </p>
            )}

            <div className='mt-4'>
                <button
                    onClick={handleSendOtp}
                    style={{ opacity: email ? 1 : 0.5 }}
                    className="otp-button w-100 l-fs semiBold-fw"
                    disabled={!email || loading}
                >
                    {loading ? <Spinner color="white" size="24px" /> : t('emailVerification.emailInput.sendOtp')}
                </button>
            </div>
        </>
    );
};

const OtpInputComponent = ({ otp, setOtp, email, seconds, isTimerActive, handleResend, setStep, setSeconds }) => {
    const { t } = useTranslation();
    const [validateOtp, { loading: validationLoading }] = useMutation(ValidateEmailOtp);
    const [resendOtp, { loading: resendLoading }] = useMutation(sendOtpToEmail);

    const handleResendEmail = async () => {
        setOtp(['', '', '', '']);
        try {
            const response = await resendOtp({ variables: { email } });
            if (response?.data?.sendOtpToEmail?.result) {
                handleResend(response?.data?.sendOtpToEmail?.retryAfter);
                showSuccessToast(t('toasts.Otpsentsuccessfully'));
            } else {
                showErrorToast(response?.data?.sendOtpToEmail?.message || 'Error resending OTP');
                console.error('Error resending OTP');
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
            const response = await validateOtp({ variables: { otp: otp.join('') } });
            console.log('response', response);

            if (response?.data?.validateEmailOtp?.result) {
                showSuccessToast(t('toasts.OTPvalidatedsuccessfully'));
                setStep(3);
            } else {
                showErrorToast(t('toasts.invalidotp'));
                setOtp(['', '', '', '']);
                // setSeconds(0);
                console.error('Error:', response?.data?.validateEmailOtp?.message);
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
            <p className='page-title bold-fw'>{t('emailVerification.otpInput.title')}</p>
            <p className='s-fs normal-fw page-description my-2'>
                {t('emailVerification.otpInput.description', { email })}
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
                        {t('emailVerification.otpInput.noOtp')}
                        <TimerDisplay seconds={seconds} t={t} />
                    </p>
                ) : (
                    <div onClick={handleResendEmail}>
                        <p style={{ color: '#59574E' }} className="normal-fw l-fs">
                            {t('emailVerification.otpInput.noOtp')}{' '}
                            <span
                                className="semiBold-fw l-fs"
                                style={{ color: '#4D7C0F', textDecorationLine: 'underline' }}
                            >
                                {t('emailVerification.otpInput.resendEmail')}
                            </span>
                        </p>
                    </div>
                )}
            </div>

            <div className='mt-4' style={{ width: '100%' }}>
                <button
                    style={{
                        backgroundColor: otp.join('').length >= 1 ? '#EDCC27' : 'rgba(255,255,255,0.8)',
                        borderColor: otp.join('').length >= 1 ? '' : '#59574E',
                    }}
                    className="verify-button w-100 l-fs semiBold-fw"
                    disabled={otp.join('').length !== 4 || validationLoading}
                    onClick={() => {
                        if (otp.join('').length === 4) {
                            handleVerifyOtp();
                        }
                    }}
                >
                    {validationLoading ? <Spinner color="white" size="24px" /> : t('emailVerification.otpInput.verifyOtp')}
                </button>
            </div>
        </>
    );
};

const SuccessComponent = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (window.clearNavigationHistory) {
                window.clearNavigationHistory();
            }
            navigate(routeName.LOCATION);
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigate]);

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
            <p className='bold-fw success-text'>{t('emailVerification.success.message')}</p>
            <p className='text-center l-fs success-description normal-fw'>
                {t('emailVerification.success.description')}
            </p>
        </>
    );
};

/** Main EmailVerification component */
const EmailVerification = () => {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [seconds, setSeconds] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);

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

    const handleResend = (timeLeft) => {
        setSeconds(timeLeft);
        setIsTimerActive(true);
    };

    return (
        <div className={`email-verification-component p-4 flex-column ${step === 3 ? 'justify-content-center' : ''}`}>
            {step === 1 && (
                <EmailInputComponent
                    email={email}
                    setEmail={setEmail}
                    setStep={setStep}
                    handleResend={handleResend}
                />
            )}

            {step === 2 && (
                <OtpInputComponent
                    otp={otp}
                    setOtp={setOtp}
                    email={email}
                    seconds={seconds}
                    setSeconds={setSeconds}
                    isTimerActive={isTimerActive}
                    handleResend={handleResend}
                    setStep={setStep}
                />
            )}

            {step === 3 && <SuccessComponent />}
        </div>
    );
};

export default EmailVerification;