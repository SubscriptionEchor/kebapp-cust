import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { recordConsent } from '../graphql/queries';
import toast from 'react-hot-toast';

interface ConsentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  docVersionId: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
}

const ConsentPopup: React.FC<ConsentPopupProps> = ({
  isOpen,
  onClose,
  docVersionId,
  privacyPolicyUrl,
  termsUrl
}) => {
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = React.useState(false);
  const [recordUserConsent] = useMutation(recordConsent);

  if (!isOpen) return null;

  const handleAgree = async () => {
    if (!isChecked) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    try {
      await recordUserConsent({
        variables: { docVersionId }
      });
      onClose();
      toast.success('Consent recorded successfully');
    } catch (error) {
      console.error('Error recording consent:', error);
      toast.error(error?.[0]?.message||'Failed to record consent');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50  animate-fade-in" style={{zIndex:250}}/>
      <div className="fixed inset-x-4 bottom-4 bg-white rounded-xl p-6 animate-slide-up" style={{zIndex:250}}>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Privacy Policy and Terms Updated
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          We've updated our privacy policy and terms of service. Please review and accept them to continue.
        </p>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => window.open(privacyPolicyUrl, '_blank')}
            className="w-full py-3 bg-gray-50 rounded-lg text-sm text-gray-900 font-medium hover:bg-gray-100 transition-colors"
          >
            View Privacy Policy
          </button>
          
          <button
            onClick={() => window.open(termsUrl, '_blank')}
            className="w-full py-3 bg-gray-50 rounded-lg text-sm text-gray-900 font-medium hover:bg-gray-100 transition-colors"
          >
            View Terms of Service
          </button>
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-secondary checked:bg-secondary checked:border-secondary"
          />
          <span className="text-sm text-gray-600">
            I have read and agree to the updated Privacy Policy and Terms of Service
          </span>
        </label>

        <button
          onClick={handleAgree}
          disabled={!isChecked}
          className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
            isChecked
              ? 'bg-secondary text-black hover:bg-opacity-90'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Agree and Continue
        </button>
      </div>
    </>
  );
};

export default ConsentPopup;