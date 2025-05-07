import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Support: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Content */}
      <div className="p-4 flex  justify-center ">
        <div className="flex flex-col items-center text-center bg-white p-10 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Mail size={24} className="text-gray-600" />
          </div>
          
          <h2 className="text-[17px] font-semibold text-gray-900 mb-2">
            Reach out to us via email
          </h2>
          
          <p className="text-[14px] text-gray-500 mb-4">
            Chat with our awesome support team
          </p>
          
          <p className="text-[15px] font-medium text-gray-900 mb-8">
            contact@kebconnect.com
          </p>

          <p className="text-[12px] text-gray-500 max-w-[300px] leading-relaxed">
            By proceeding, you accept our <span className="text-secondary">Terms of Service</span> and <span className="text-secondary">Privacy Policy</span>. We only collect data necessary to improve your experience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Support;