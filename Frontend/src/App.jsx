import Navbar from "./components/Navbar"

import { Routes,Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";

const App = () => {
  return (
    <div>
      <Navbar />
    
      <Routes>
        <Route path ="/" element={<HomePage/>}/>
        <Route path ="/signup" element={<SignUpPage/>}/>
        <Route path ="/login" element={<LoginPage/>}/>
        <Route path ="/Setting" element={<SettingsPage/>}/>
        <Route path ="/profile" element={<ProfilePage/>}/>
      </Routes>
    
    </div>
  )
};

export default App