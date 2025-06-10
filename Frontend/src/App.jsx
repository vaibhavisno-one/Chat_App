import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import TeamsPage from "./pages/TeamsPage"; // Import the new page

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore(); // Removed onlineUsers from here
  const { theme } = useThemeStore();

  // console.log({ onlineUsers }); // Removed

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // console.log({ authUser }); // Keep for debugging if needed

  if (isCheckingAuth && !authUser) // Keep this check
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} /> {/* Assuming settings can be accessed by all or handles auth internally */}
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/teams" element={authUser ? <TeamsPage /> : <Navigate to="/login" />} /> {/* Add new route */}
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;