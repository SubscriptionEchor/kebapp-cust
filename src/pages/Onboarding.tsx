import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';

// Import images
import OnboardingZero from '../assets/images/onboarding/OnboardingZero.png';
import OnboardingOne from '../assets/images/onboarding/OnboardingOne.png';
import OnboardingTwo from '../assets/images/onboarding/OnboardingTwo.png';

const OnboardingStep: React.FC<{
  title: string;
  description: string;
  image: string;
  isActive: boolean;
}> = ({ title, description, image, isActive }) => (
  <div 
    className={`absolute inset-0 transition-opacity duration-500 ${
      isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
    }`}
  >
    <div className="h-full flex flex-col">
      <div className="relative flex-1 bg-gradient-to-b from-gray-900 to-gray-800">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>
      <div className="bg-black p-6 animate-slide-up">
        <h2 className="text-2xl font-bold text-white mb-2 animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
          {title}
        </h2>
        <p className="text-gray-300 animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
          {description}
        </p>
      </div>
    </div>
  </div>
);

const Onboarding: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: t('onboarding.screen1.title'),
      description: t('onboarding.screen1.description'),
      image: OnboardingZero
    },
    {
      title: t('onboarding.screen2.title'),
      description: t('onboarding.screen2.description'),
      image: OnboardingOne
    },
    {
      title: t('onboarding.screen3.title'),
      description: t('onboarding.screen3.description'),
      image: OnboardingTwo
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      navigate('/home', { replace: true });
    }
  };

  const handleSkip = () => {
    navigate('/home', { replace: true });
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 z-50 px-4 py-2 text-sm font-medium text-white hover:text-secondary transition-colors"
      >
        {t('onboarding.skip')}
      </button>

      {/* Steps */}
      {steps.map((step, index) => (
        <OnboardingStep
          key={index}
          {...step}
          isActive={currentStep === index}
        />
      ))}

      {/* Progress Dots */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentStep 
                ? 'bg-secondary w-6' 
                : 'bg-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Next Button */}
      <div className="absolute bottom-6 inset-x-6 z-20">
        <Button
          onClick={handleNext}
          fullWidth
          size="lg"
          className="animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          <span className="flex items-center justify-center gap-2">
            {currentStep === steps.length - 1 
              ? t('onboarding.screen3.buttonText')
              : t('onboarding.screen2.buttonText')}
            <ChevronRight size={20} />
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;