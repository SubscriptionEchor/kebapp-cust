import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TelegramProvider } from './context/TelegramContext';
import { BootstrapProvider } from './context/BootstrapContext';
import { UserProvider } from './context/UserContext';
import { AuthProvider } from './context/AuthContext';

// Import pages
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Following from './pages/Following';
import Restaurant from './pages/Restaurant';

// App component
function App() {
  return (
    <Router>
      <TelegramProvider>
        <AuthProvider>
          <BootstrapProvider>
            <UserProvider>
              <Routes>
                {/* Default route redirects to splash */}
                <Route path="/" element={<Navigate to="/splash" replace />} />
                <Route path="/splash" element={<Splash />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/following" element={<Following />} />
                <Route path="/restaurant/:id" element={<Restaurant />} />
              </Routes>
            </UserProvider>
          </BootstrapProvider>
        </AuthProvider>
      </TelegramProvider>
    </Router>
  );
}

export default App;