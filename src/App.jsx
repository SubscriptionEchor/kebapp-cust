import './App.css';
import { CartProvider } from './Context/Context';
import Router from './Router/Router';
import { ApolloProvider } from "@apollo/client";
import setupAplloClient from "./apollo/index";
import React, { useEffect, useState } from 'react';
import { UserProvider } from './Context/User';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NoInternet from './assets/svg/noWifi.svg';
import { ConfigurableValues } from './constants/constants';


// Initialize configuration values before rendering
ConfigurableValues();

const client = setupAplloClient();

function App() {
  return <Router />;
}

export default () => {
  const [isOnline, setIsOnline] = useState(window?.navigator?.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(window.navigator.onLine);
    };

    // Listen for offline/online changes
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return (
    <div>
      <ApolloProvider client={client}>

        <UserProvider>
          <CartProvider>

            <ToastContainer />
            {!isOnline ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100vh',
                }}
              >
                <img height={50} width={50} src={NoInternet} alt="no internet" />
                <p className='xxl-fs semiBold-fw mt-4'>No internet connection!</p>
              </div>
            ) : (
              <App />
            )}
          </CartProvider>
        </UserProvider>

      </ApolloProvider>
    </div>
  );
};