import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute/ProtectedRoute'
import { AuthProvider } from '../Context/AuthContext/AuthContext'
import { CommonProvider } from '../Context/Context'
import { routeName } from './RouteName'
import MobileOnlyApp from '../Components/MobileOnlyApp/MobileOnlyApp'
import Orders from '../Pages/Orders'
import Profile from '../Pages/Profile'
import EditProfile from '../Pages/Profile/editProfile'
import SavedAddress from '../Pages/Profile/savedAddress'
import Following from '../Pages/Following'
import SplashScreen from '../Pages/SplashScreen/SplashScreen'
import Onboarding from '../Pages/OnBoarding/OnBoarding'
import Checkout from '../Pages/Checkout'
import Restaurant from '../Pages/Restaurant'
import OrderStatus from '../Pages/OrderStatus'
// import Home from '../Pages/Home'
import PhoneNumberVerification from '../Pages/PhoneNumberVerification/PhoneNumberVerification'
import EmailVerification from '../Pages/EmailVerification/EmailVerification'
import Location from '../Pages/Location/Location'
import SelectLocation from '../Pages/SelectLocation/SelectLocation'
import FetchLocation from '../Pages/FetchLocation/FetchLocation'
import Ratings from '../Pages/Ratings'
import Search from '../Pages/search'
import TermsAndCondition from '../Pages/TermsAndCondition'
import PrivacyPolicy from '../Pages/PrivacyPolicy'
import ContactUs from '../Pages/ContactUs'
import Coupons from '../Pages/Coupons'
import { NotFound } from '../Components/SearchResults/NoZonepage'
import { BootstrapProvider } from '../Context/Bootstrap'
import Home from '../Components/Home'

function Router() {

    return (
        <AuthProvider>
            <CommonProvider>
                <BootstrapProvider>
                    <MobileOnlyApp>
                        <BrowserRouter>
                            <Routes>
                                <Route path={routeName.SPLASH_SCREEN} element={<ProtectedRoute><SplashScreen /></ProtectedRoute>} />
                                <Route path={routeName.ONBOARDING} element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                                <Route path={routeName.PHONE_NUMBER_VERIFICATION} element={<ProtectedRoute><PhoneNumberVerification /></ProtectedRoute>} />
                                <Route path={routeName.EMAIL_VERIFICATION} element={<ProtectedRoute><EmailVerification /></ProtectedRoute>} />
                                <Route path={routeName.LOCATION} element={<ProtectedRoute><Location /></ProtectedRoute>} />
                                <Route path={routeName.SELECT_LOCATION} element={<ProtectedRoute><SelectLocation /></ProtectedRoute>} />
                                <Route path={routeName.FETCH_LOCATION} element={<ProtectedRoute><FetchLocation /></ProtectedRoute>} />
                                <Route path={routeName.ORDERSTATUS} element={<ProtectedRoute><OrderStatus /></ProtectedRoute>} />
                                <Route path={routeName.HOME} element={<ProtectedRoute><Home /></ProtectedRoute>} />
                                <Route path={routeName.ORDERS} element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                                <Route path={routeName.PROFILE} element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                <Route path={routeName.FOLLOWING} element={<ProtectedRoute><Following /></ProtectedRoute>} />
                                <Route path={routeName.RESTAURANT} element={<ProtectedRoute><Restaurant /></ProtectedRoute>} />
                                <Route path={routeName.CHECKOUT} element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                                <Route path={routeName.RATINGS} element={<ProtectedRoute><Ratings /></ProtectedRoute>} />
                                <Route path={routeName.SEARCH} element={<ProtectedRoute><Search /></ProtectedRoute>} />
                                <Route path={routeName.TERMSANDCONDITION} element={<ProtectedRoute><TermsAndCondition /></ProtectedRoute>} />
                                <Route path={routeName.PRIVACYPOLICY} element={<ProtectedRoute><PrivacyPolicy /></ProtectedRoute>} />
                                <Route path={routeName.CONTACTUS} element={<ProtectedRoute><ContactUs /></ProtectedRoute>} />
                                <Route path={routeName.EDITPROFILE} element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                                <Route path={routeName.SAVEDADDRESS} element={<ProtectedRoute><SavedAddress /></ProtectedRoute>} />
                                <Route path={routeName.COUPONS} element={<ProtectedRoute><Coupons /></ProtectedRoute>} />
                                <Route path={routeName.NOTFOUND} element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
                            </Routes>
                        </BrowserRouter>
                    </MobileOnlyApp>
                </BootstrapProvider>
            </CommonProvider>
        </AuthProvider>
    )
}

export default Router