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

function App() {
  return (
    <Router>
      <TelegramProvider>
        <AuthProvider>
          <BootstrapProvider>
            <LocationProvider>
              <UserProvider>
                <Routes>
                  {/* Default route redirects to splash */}
                  <Route path="/" element={<Navigate to="/splash" replace />} />
                  <Route path="/splash" element={<Splash />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/following" element={<Following />} />
                 <Route path="/orders" element={<Orders />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/profile/addresses" element={<SavedAddresses />} />
                  <Route path="/profile/details" element={<UserDetails />} />
                  <Route path="/profile/addresses" element={<SavedAddresses />} />
                  <Route path="/profile/support" element={<Support />} />
                  <Route path="/order/:id" element={<OrderStatus />} />
                  <Route path="/restaurant/:id" element={<RestaurantDetails />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/coupons" element={<Coupons />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/location/search" element={<LocationSearch />} />
                  <Route path="/review" element={<Review />} />
                </Routes>
              </UserProvider>
            </LocationProvider>
          </BootstrapProvider>
          <Toaster position="top-center" />
        </AuthProvider>
      </TelegramProvider>
    </Router>
  );
}

export default App