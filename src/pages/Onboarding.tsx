import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';

import OnboardingZero from "../assets/jpeg/OnboardingZero.png";
import OnboardingOne from "../assets/jpeg/OnboardingOne.png";
import OnboardingTwo from "../assets/jpeg/OnboardingTwo.png";
import OnboardingThree from "../assets/jpeg/OnboardingThree.png";
import { useBootstrap } from '../context/BootstrapContext';
import { useUser } from '../context/UserContext';
import { AppRoutes } from '../routeenums';

const OnboardingStep: React.FC<{
  setIsCompliance: () => void;
  title: string;
  description: string;
  image: string;
  isActive: boolean;
  isCompliance: boolean;
}> = ({ title, description, image, isActive, setIsCompliance, isCompliance, currentStep, isAlreadyComplianceExists }) => {
  const { t } = useTranslation();
  return (

    <div
      className={`absolute inset-0 transition-opacity duration-500 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
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
        <div style={{ zIndex: 100 }} className={`${!isAlreadyComplianceExists && currentStep == 0 ? 'bottom-[30%]' : 'bottom-[20%]'} absolute p-6 animate-slide-up`}>
          <h2 className="text-xl font-bold text-white mb-2 animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
            {title}
          </h2>
          <p className="text-gray-300 text-sm animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
            {description}
          </p>
        </div>
        {!isAlreadyComplianceExists && currentStep == 0 && <div className=" flex px-6 items-start absolute  bottom-[20%]  ">
          <input type='checkbox' className='checkbox mt-1' checked={isCompliance} onClick={() => setIsCompliance((prev: any) => !prev)} />
          <p
            className="m-fs light-fw px-2 "
            style={{ color: "rgba(255, 255, 255, 0.7)" }}
          >
            {t("common.termsLine1")}{" "}
            <span
              className="text-white"
              style={{ textDecorationLine: "underline" }}
            // onClick={() => navigate(routeName.TERMSANDCONDITION, { state: { url: bootstrapData?.activeConsentDocData?.linkedDocuments[0]?.docPublicLink } })}
            >
              {t("common.tnc")}
            </span>{" "}
            {t("onboarding.and")}{" "}
            <span
              className="text-white"
              style={{ textDecorationLine: "underline" }}
            // onClick={() => navigate(routeName.TERMSANDCONDITION, { state: { url: bootstrapData?.activeConsentDocData?.linkedDocuments[1]?.docPublicLink } })}
            >
              {t("common.privacyPolicy")}
            </span>
            {/* . {t("common.termsLine2")} */}
          </p>
        </div>}
      </div>

    </div>

  )
};

const Onboarding: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompliance, setIsCompliance] = useState(false);
  const [isAlreadyComplianceExists, setIsAlreadyComplianceExists] = useState(false);
  const { bootstrapData } = useBootstrap()
  const { profile } = useUser()
  useEffect(() => {
    if (bootstrapData?.activeConsentDocData && profile?.consentInfo) {
      const needsConsent = bootstrapData.activeConsentDocData.docVersionId === profile.consentInfo[0].docVersionId;
      setIsAlreadyComplianceExists(needsConsent);
    }
  }, [bootstrapData, profile]);

  const steps = [
    {
      title: t('onboarding.screen0.title'),
      description: t('onboarding.screen0.description'),
      image: OnboardingZero
    },
    {
      title: t('onboarding.screen1.title'),
      description: t('onboarding.screen1.description'),
      image: OnboardingOne
    },
    {
      title: t('onboarding.screen2.title'),
      description: t('onboarding.screen2.description'),
      image: OnboardingTwo
    },
    {
      title: t('onboarding.screen3.title'),
      description: t('onboarding.screen3.description'),
      image: OnboardingThree
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      navigate(AppRoutes.HOME, { replace: true });
    }
  };

  const handleSkip = () => {
    navigate(AppRoutes.HOME, { replace: true });
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Skip Button */}
      {currentStep > 0 && <button
        onClick={handleSkip}
        className="absolute top-4 right-4 z-50 px-4 py-2 text-sm font-medium text-white hover:text-secondary transition-colors"
      >
        {t('onboarding.skip')}
      </button>}

      {/* Steps */}
      {steps.map((step, index) => (
        <OnboardingStep
          isAlreadyComplianceExists={isAlreadyComplianceExists}
          currentStep={currentStep}
          setIsCompliance={setIsCompliance}
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
            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentStep
              ? 'bg-secondary w-6'
              : 'bg-gray-500'
              }`}
          />
        ))}
      </div>


      {/* Next Button */}
      <div className="absolute bottom-6 inset-x-6 z-20">
        <Button
          disabled={!isAlreadyComplianceExists && !isCompliance}
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