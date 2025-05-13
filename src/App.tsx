import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { TelegramProvider } from './context/TelegramContext';
import { BootstrapProvider } from './context/BootstrapContext';
import { UserProvider } from './context/UserContext';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';

import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Following from './pages/Following';
import RestaurantDetails from './pages/RestaurantDetails';
import UserDetails from './pages/UserDetails';
import SavedAddresses from './pages/SavedAddresses';
import OrderStatus from './pages/OrderStatus';
import Orders from './pages/Orders';
import Checkout from './pages/Checkout';
import Review from './pages/Review';
import Coupons from './pages/Coupons';
import Search from './pages/Search';
import Support from './pages/Support';
import LocationSearch from './pages/LocationSearch';
import SaveAddress from './pages/SaveAddress';
import { AppRoutes } from './routeenums';
import TermsAndCondition from './pages/termsandcondition';
import ProtectedRoute from './protectedRoute';



function App() {
  return (
    <Router>
      <TelegramProvider>
        <AuthProvider>
          <BootstrapProvider>
            <LocationProvider>
              <UserProvider>
                <ProtectedRoute>
                  <Routes>
                    {/* Default route redirects to splash */}
                    <Route path="/" element={<Navigate to={AppRoutes.SPLASH} replace />} />
                    <Route path={AppRoutes.SPLASH} element={<Splash />} />
                    <Route path={AppRoutes.ONBOARDING} element={<Onboarding />} />
                    <Route path={AppRoutes.HOME} element={<Home />} />
                    <Route path={AppRoutes.PROFILE} element={<Profile />} />
                    <Route path={AppRoutes.FOLLOWING} element={<Following />} />
                    <Route path={AppRoutes.ORDERS} element={<Orders />} />
                    <Route path={AppRoutes.PROFILE_ADDRESSES} element={<SavedAddresses />} />
                    <Route path={AppRoutes.PROFILE_DETAILS} element={<UserDetails />} />
                    <Route path={AppRoutes.PROFILE_SUPPORT} element={<Support />} />
                    <Route path={AppRoutes.ORDER} element={<OrderStatus />} />
                    <Route path={AppRoutes.RESTAURANT} element={<RestaurantDetails />} />
                    <Route path={AppRoutes.CHECKOUT} element={<Checkout />} />
                    <Route path={AppRoutes.COUPONS} element={<Coupons />} />
                    <Route path={AppRoutes.SEARCH} element={<Search />} />
                    <Route path={AppRoutes.LOCATION_SEARCH} element={<LocationSearch />} />
                    <Route path={AppRoutes.REVIEW} element={<Review />} />
                    <Route path={AppRoutes.SAVE_ADDRESS} element={<SaveAddress />} />
                    <Route path={AppRoutes.TERMS} element={<TermsAndCondition />} />
                  </Routes>
                </ProtectedRoute>
              </UserProvider>
            </LocationProvider>
          </BootstrapProvider>
          <Toaster position="top-center" />
        </AuthProvider>
      </TelegramProvider>
    </Router>
  );
}

export default App;