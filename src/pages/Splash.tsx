import React from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingAnimation from '../components/LoadingAnimation';
import Logo from '../components/Logo';

const Splash: React.FC = () => {
  const { isLoading, error } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-teal-800 to-blue-900 p-4">
      <div className="text-center">
        <Logo className="mb-8" variant="light" />

        {isLoading ? (
          <LoadingAnimation className="animate-fade-in" />
        ) : error ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white animate-scale-in">
            <p className="mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-blue-900 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Splash;