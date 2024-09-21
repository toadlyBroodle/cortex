import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import ApiSelector from './components/ApiSelector';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import UserProfile from './components/UserProfile';
import './App.css';

function App() {
  const [selectedApi, setSelectedApi] = useState('huggingface');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  const handleApiChange = (api) => {
    setSelectedApi(api);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (text) => {
    try {
      setError(null);
      const response = await axios.post('/api/process', {
        api: selectedApi,
        text: text,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
      if (err.response?.status === 401) {
        setIsLoggedIn(false);
        setUsername('');
      }
    }
  };

  const handleLogin = (loggedInUsername) => {
    setIsLoggedIn(true);
    setUsername(loggedInUsername);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
  };

  return (
    <Router>
      <div className="App">
        <h1>API Integration App</h1>
        {isLoggedIn ? (
          <>
            <Navigation onLogout={handleLogout} username={username} />
            <Routes>
              <Route path="/" element={
                <>
                  <ApiSelector selectedApi={selectedApi} onApiChange={handleApiChange} />
                  <InputForm onSubmit={handleSubmit} />
                  {error && <p className="error">{error}</p>}
                  <ResultDisplay result={result} />
                </>
              } />
              <Route path="/api-selection" element={<ApiSelector selectedApi={selectedApi} onApiChange={handleApiChange} />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/usage-dashboard" element={<h2>Usage Dashboard (Coming Soon)</h2>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </>
        ) : (
          <Auth setIsLoggedIn={handleLogin} />
        )}
      </div>
    </Router>
  );
}

export default App;
