import React, { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../Context/AuthContext/AuthContext'
import { routeName } from '../RouteName'

const ProtectedRoute = ({ children }) => {
    const [history, setHistory] = useState(() => {
        const savedHistory = localStorage.getItem('navigationHistory');
        return savedHistory ? JSON.parse(savedHistory) : [];
    });
    const { isAuthenticated } = useAuth()
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.setItem('navigationHistory', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        if (location.pathname === routeName.HOME || location.pathname === routeName.SPLASH_SCREEN) {
            setHistory([location.pathname]);
            if (window?.Telegram?.WebApp) {
                window.Telegram.WebApp.BackButton.hide();
            }
            return;
        }
        if (history[history.length - 1] !== location.pathname) {
            setHistory(prev => [...prev, location.pathname]);
        }
    }, [location.pathname]);

    // window.handleCustomBack(); -> by using this function to go back to the previous page, eg. Implemented in coupons screen
    const handleCustomBack = () => {
        if (history.length <= 1) {
            return;
        }

        const newHistory = [...history];
        const currentPath = newHistory.pop(); // Remove current path
        const previousPath = newHistory[newHistory.length - 1]; // Get previous path

        if (currentPath === routeName.ORDERSTATUS && previousPath === routeName.CHECKOUT) {
            const restaurantIndex = newHistory.findIndex(path => path === routeName.RESTAURANT);
            if (restaurantIndex !== -1) {
                const updatedHistory = newHistory.slice(0, restaurantIndex + 1);
                setHistory(updatedHistory);
                navigate(routeName.RESTAURANT);
                return;
            }
        }

        if (previousPath === routeName.HOME || previousPath === routeName.SPLASH_SCREEN) {
            setHistory([previousPath]);
            if (window?.Telegram?.WebApp) {
                window.Telegram.WebApp.BackButton.hide();
            }
        } else {
            setHistory(newHistory);
            if (newHistory.length <= 1 && window?.Telegram?.WebApp) {
                window.Telegram.WebApp.BackButton.hide();
            }
        }
        navigate(previousPath);
    };

    useEffect(() => {
        if (typeof window === "undefined" || !window?.Telegram) {
            return;
        }
        const telegram = window.Telegram.WebApp;
        const handleBackNavigation = () => {
            handleCustomBack();
        };

        if (location.pathname === routeName.HOME || location.pathname === routeName.SPLASH_SCREEN) {
            telegram.BackButton.hide();
        } else if (history.length > 1) {
            telegram.BackButton.show();
            telegram.BackButton.onClick(handleBackNavigation);
        } else {
            telegram.BackButton.hide();
        }

        return () => {
            if (window?.Telegram?.WebApp) {
                telegram.BackButton.offClick(handleBackNavigation);
            }
        };
    }, [history, location.pathname]);

    React.useEffect(() => {
        window.handleCustomBack = handleCustomBack;
    }, [history]);


    // To keep only a specific path
    // window.clearNavigationHistory(routeName.HOME);  // History becomes: ['/home']
    // To clear entire history
    // window.clearNavigationHistory();  // History becomes: []
    React.useEffect(() => {
        window.clearNavigationHistory = (targetPath = null) => {
            if (targetPath) {
                // If path is provided, keep only that path
                setHistory([targetPath]);
            } else {
                // If no path provided, clear entire history
                setHistory([]);
            }

            if (window?.Telegram?.WebApp) {
                window.Telegram.WebApp.BackButton.hide();
            }
        };

        return () => {
            delete window.clearNavigationHistory;
        };
    }, []);

    // Cleanup effect
    React.useEffect(() => {
        return () => {
            delete window.handleCustomBack;
            delete window.clearNavigationHistory;
        };
    }, []);

    if (!isAuthenticated) {
        return <Navigate to="/login" />
    }

    return children;
}

export default ProtectedRoute;