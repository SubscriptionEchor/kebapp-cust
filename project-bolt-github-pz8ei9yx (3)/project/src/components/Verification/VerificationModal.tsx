import React, { useState } from 'react';
import { X, Phone, Mail, ChevronDown, Loader2 } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { sendOtpToPhoneNumber, ValidatePhoneOtp, sendOtpToEmail, ValidateEmailOtp } from '../../graphql/queries';
import toast from 'react-hot-toast';

interface CountryCode {
  code: string;
  name: string;
  dial_code: string;
}

const countryCodes: CountryCode[] = [
  { code: "DE", name: "Germany", dial_code: "+49" },
  { code: "TR", name: "Turkey", dial_code: "+90" },
  { code: "IN", name: "India", dial_code: "+91" },
  { code: "GB", name: "United Kingdom", dial_code: "+44" },
  { code: "US", name: "United States", dial_code: "+1" },
  { code: "FR", name: "France", dial_code: "+33" },
  { code: "IT", name: "Italy", dial_code: "+39" }
];

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'mobile' | 'email';
  onVerify: (value: string) => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  type,
  onVerify
}) => {
  const [value, setValue] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [error, setError] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Phone OTP mutations
  const [sendPhoneOtp, { loading: sendPhoneLoading }] = useMutation(sendOtpToPhoneNumber);
  const [validatePhoneOtp, { loading: validatePhoneLoading }] = useMutation(ValidatePhoneOtp);

  // Email OTP mutations
  const [sendEmailOtp, { loading: sendEmailLoading }] = useMutation(sendOtpToEmail);
  const [validateEmailOtp, { loading: validateEmailLoading }] = useMutation(ValidateEmailOtp);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async () => {    
    if (step === 'input') {
      // Validate input
      if (type === 'mobile' && !/^[1-9]\d{1,14}$/.test(phoneNumber)) {
        setError('Please enter a valid phone number');
        return;
      }
      if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setError('Please enter a valid email address');
        return;
      }
      setError('');
      
      if (type === 'mobile') {
        try {
          const { data } = await sendPhoneOtp({
            variables: { phone: `${selectedCountry.dial_code}${phoneNumber}` }
          });
          if (data?.sendOtpToPhoneNumber?.result) {
            toast.success('OTP sent successfully');
            setValue(`${selectedCountry.dial_code}${phoneNumber}`);
            setStep('otp');
          } else {
            toast.error(data?.sendOtpToPhoneNumber?.message || 'Failed to send OTP');
            setError(data?.sendOtpToPhoneNumber?.message || 'Failed to send OTP');
          }
        } catch (err) {
          toast.error('Failed to send OTP');
          setError('Failed to send OTP');
        }
      } else {
        try {
          const { data } = await sendEmailOtp({
            variables: { email: value }
          });
          if (data?.sendOtpToEmail?.result) {
            toast.success('OTP sent successfully');
            setStep('otp');
          } else {
            toast.error(data?.sendOtpToEmail?.message || 'Failed to send OTP');
            setError(data?.sendOtpToEmail?.message || 'Failed to send OTP');
          }
        } catch (err) {
          toast.error('Failed to send OTP');
          setError('Failed to send OTP');
        }
      }
    } else {
      // Verify OTP
      if (otp.length !== 4) {
        setError('Please enter a valid 4-digit OTP');
        return;
      }
      
      try {
        if (type === 'mobile') {
          const { data } = await validatePhoneOtp({
            variables: { validatePhoneOtpOtp2: otp }
          });
          if (data?.validatePhoneOtp?.result) {
            toast.success('Phone number verified successfully');
            onVerify(value);
            onClose();
          } else {
            toast.error(data?.validatePhoneOtp?.message || 'Invalid OTP');
            setError(data?.validatePhoneOtp?.message || 'Invalid OTP');
          }
        } else {
          const { data } = await validateEmailOtp({
            variables: { otp }
          });
          if (data?.validateEmailOtp?.result) {
            toast.success('Email verified successfully');
            onVerify(value);
            onClose();
          } else {
            toast.error(data?.validateEmailOtp?.message || 'Invalid OTP');
            setError(data?.validateEmailOtp?.message || 'Invalid OTP');
          }
        }
      } catch (err) {
        toast.error('Failed to verify OTP');
        setError('Failed to verify OTP');
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-xl p-6 z-50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">
            {type === 'mobile' ? 'Verify Phone Number' : 'Verify Email'}
          </h3>
          <button onClick={onClose} className="p-1">
            <X size={20} />
          </button>
        </div>

        {step === 'input' ? (
          <div className="space-y-4">
            <div className="relative">
              {type === 'mobile' ? (
                <div className="flex w-full">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="flex items-center gap-2 px-3 py-2.5 border rounded-l-lg hover:bg-gray-50 transition-colors h-[42px] whitespace-nowrap"
                    >
                      <span className="text-sm font-medium">{selectedCountry.dial_code}</span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                    
                    {showCountryDropdown && (
                      <div 
                        ref={dropdownRef}
                        className="absolute top-full left-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
                      >
                        {countryCodes.map((country) => (
                          <button
                            key={country.code}
                            onClick={() => {
                              setSelectedCountry(country);
                              setShowCountryDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                          >
                            <span className="text-sm">{country.name}</span>
                            <span className="text-sm text-gray-500">{country.dial_code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 px-4 py-2.5 border-y border-r rounded-r-lg focus:outline-none focus:border-secondary h-[42px] w-[100px]"
                  />
                </div>
              ) : (
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 border rounded-lg focus:outline-none focus:border-secondary h-[42px]"
                  />
                </div>
              )}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleSubmit}
              className="w-full h-[42px] bg-secondary text-black rounded-lg font-medium"
              disabled={type === 'mobile' ? sendPhoneLoading : sendEmailLoading}
            >
              {(type === 'mobile' ? sendPhoneLoading : sendEmailLoading) ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Sending OTP...</span>
                </div>
              ) : (
                'Send OTP'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center gap-3">
              {[...Array(4)].map((_, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={otp[index] || ''}
                  onChange={(e) => {
                    const digit = e.target.value.replace(/\D/g, '');
                    if (!digit) return;
                    
                    const newOtp = otp.split('');
                    newOtp[index] = digit.slice(-1);
                    setOtp(newOtp.join(''));
                    
                    // Auto-focus next input
                    if (digit && index < 3) {
                      const inputs = e.target.parentElement?.parentElement?.getElementsByTagName('input');
                      const nextInput = inputs?.[index + 1] as HTMLInputElement;
                      if (nextInput) nextInput.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    // Handle backspace
                    if (e.key === 'Backspace') {
                      e.preventDefault();
                      const newOtp = otp.split('');
                      newOtp[index] = '';
                      setOtp(newOtp.join(''));
                      
                      // Move to previous input
                      if (index > 0) {
                        const inputs = document.getElementsByTagName('input');
                        const prevInput = inputs[index - 1] as HTMLInputElement;
                        if (prevInput) {
                          prevInput.focus();
                        }
                      }
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                    const newOtp = Array(4).fill('');
                    pastedData.split('').forEach((digit, i) => {
                      if (index + i < 4) newOtp[index + i] = digit;
                    });
                    setOtp(newOtp.join(''));
                    
                    // Focus next empty input or last input
                    const inputs = e.currentTarget.parentElement?.parentElement?.querySelectorAll('input');
                    if (inputs) {
                      const nextEmptyIndex = newOtp.findIndex((digit, i) => !digit && i >= index);
                      const targetInput = inputs[nextEmptyIndex === -1 ? 3 : nextEmptyIndex] as HTMLInputElement;
                      if (targetInput) targetInput.focus();
                    }
                  }}
                  className="w-10 h-10 text-center border rounded-lg focus:outline-none focus:border-secondary text-lg"
                />
              ))}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleSubmit}
              className="w-full h-[42px] bg-secondary text-black rounded-lg font-medium disabled:opacity-50"
              disabled={isLoading}
            >
              {(type === 'mobile' ? validatePhoneLoading : validateEmailLoading) ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify OTP'
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default VerificationModal;