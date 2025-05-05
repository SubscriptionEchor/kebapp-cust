import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HoldingTimeInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const HoldingTimeInfoSheet: React.FC<HoldingTimeInfoSheetProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 animate-slide-up">
        {/* Header */}
        <div className="flex justify-end p-4">
          <button 
            onClick={onClose}
            className="text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-8">
          <p className="text-[13px] text-gray-900 leading-relaxed mb-6">
            {t('orderStatus.warningText1')}
          </p>
          <p className="text-[13px] text-gray-900 leading-relaxed mb-8">
            {t('orderStatus.warningText2')}
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#00B37A] text-white rounded-lg text-[13px] font-medium"
          >
            {t('orderStatus.okButton')}
          </button>
        </div>
      </div>
    </>
  );
};

export default HoldingTimeInfoSheet;