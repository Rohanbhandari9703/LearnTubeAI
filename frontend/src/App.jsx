import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../componenets/landingpage';
import MainPage from '../componenets/mainPage';
import Learning from '../componenets/learning';
import Login from '../componenets/Login';
import Signup from '../componenets/Signup';
import SavedPlaylists from '../componenets/SavedPlaylists';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/learn" element={<Learning />}/>
        <Route path="/saved-playlists" element={<SavedPlaylists />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
        
      </Routes>
    </Router>
  );
}

export default App;
